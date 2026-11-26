import { classifyRecipe, filterCandidates, PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import type { AllergenState } from '@panelada/allergen-rules/rules';
import type {
  CatalogDishSummaryDto,
  CatalogReadPort,
  Difficulty,
} from '../../../modules/catalog/public/catalog-read.js';
import type { ProfileQueryPort } from '../../../modules/profile/public/profile-query.js';
import type { RestrictionsForFilterPort } from '../../../modules/profile/public/restrictions-for-filter.js';
import type { ProgressPublicPort } from '../../../modules/progress/public/progress-public.js';
import type {
  RoutinePublicPort,
  SuggestionRecord,
  SuggestionStatus,
} from '../../../modules/routine/public/routine-public.js';
import { notFoundProblem, ProblemError } from '../../../shared/problem.js';

export const DEFAULT_SUGGESTION_LIMIT = 10;
export const MAX_SUGGESTION_LIMIT = 20;

export interface DishSummaryDto {
  readonly dishId: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly photoHash?: string;
  // MVP-04C1: Describes the dish's catalog verification state, never the user's restrictions (A05).
  readonly allergenState: AllergenState;
}

export interface SuggestionItemDto {
  readonly id: string;
  readonly status: SuggestionStatus;
  readonly dish: DishSummaryDto;
  readonly missingIngredients: readonly string[];
  readonly missingUtensils: readonly string[];
}

export interface GetSuggestionsInput {
  readonly accountId: string;
  readonly sessionKey: string;
  readonly limit?: number;
  readonly usePantry?: boolean;
  readonly clientAllergenPackageVersion?: string;
}

export interface GetSuggestionsResponse {
  readonly suggestions: readonly SuggestionItemDto[];
  readonly noResult: boolean;
  readonly minPackageVersion: string;
}

export interface AggregateClassificationLogger {
  info(bindings: Record<string, unknown>, msg: string): void;
}

export interface SuggestionServiceDeps {
  readonly catalogRead: CatalogReadPort;
  readonly restrictionsForFilter: RestrictionsForFilterPort;
  readonly profileQuery: ProfileQueryPort;
  readonly progressPublic: ProgressPublicPort;
  readonly routinePublic: RoutinePublicPort;
  readonly logger: AggregateClassificationLogger;
}

function toDishSummary(dish: CatalogDishSummaryDto): DishSummaryDto {
  return {
    dishId: dish.dishId,
    name: dish.name,
    cuisineId: dish.cuisineId,
    prepTimeMinutes: dish.prepTimeMinutes,
    difficulty: dish.difficulty,
    ...(dish.photoHash !== null ? { photoHash: dish.photoHash } : {}),
    allergenState: dish.allergenState,
  };
}

/**
 * Pure deterministic ranking placing user-preferred cuisines first (RN10),
 * preserving preference order and breaking ties alphabetically by dish name.
 */
export function rankCompatibleDishes(
  dishes: readonly CatalogDishSummaryDto[],
  preferredCuisineIds: readonly string[],
): CatalogDishSummaryDto[] {
  const preferenceRank = new Map<string, number>();
  preferredCuisineIds.forEach((cuisineId, index) => {
    if (!preferenceRank.has(cuisineId)) {
      preferenceRank.set(cuisineId, index);
    }
  });

  return [...dishes].sort((left, right) => {
    const leftRank = preferenceRank.get(left.cuisineId);
    const rightRank = preferenceRank.get(right.cuisineId);

    if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    if (leftRank !== undefined && rightRank === undefined) {
      return -1;
    }
    if (leftRank === undefined && rightRank !== undefined) {
      return 1;
    }
    const nameCompare = left.name.localeCompare(right.name, 'pt-BR');
    return nameCompare !== 0 ? nameCompare : left.dishId.localeCompare(right.dishId);
  });
}

function clampSuggestionLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit)) {
    return DEFAULT_SUGGESTION_LIMIT;
  }
  return Math.max(1, Math.min(MAX_SUGGESTION_LIMIT, limit));
}

function toSuggestionItem(
  record: SuggestionRecord,
  dish: CatalogDishSummaryDto,
): SuggestionItemDto {
  return {
    id: record.id,
    status: record.status,
    dish: toDishSummary(dish),
    missingIngredients: [],
    missingUtensils: [],
  };
}

/**
 * Orchestrates allergen-filtered suggestions and suggestion approval/discard (UC01, UC02).
 *
 * S3: Sole consumer of `RestrictionsForFilterPort`.
 * ADR-014 §8-9 / A13 × A05: Logs only aggregate classification counts, never accountId or restrictions.
 */
export class SuggestionService {
  private readonly catalogRead: CatalogReadPort;
  private readonly restrictionsForFilter: RestrictionsForFilterPort;
  private readonly profileQuery: ProfileQueryPort;
  private readonly progressPublic: ProgressPublicPort;
  private readonly routinePublic: RoutinePublicPort;
  private readonly logger: AggregateClassificationLogger;

  constructor(deps: SuggestionServiceDeps) {
    this.catalogRead = deps.catalogRead;
    this.restrictionsForFilter = deps.restrictionsForFilter;
    this.profileQuery = deps.profileQuery;
    this.progressPublic = deps.progressPublic;
    this.routinePublic = deps.routinePublic;
    this.logger = deps.logger;
  }

  async getSuggestions(input: GetSuggestionsInput): Promise<GetSuggestionsResponse> {
    const limit = clampSuggestionLimit(input.limit);

    const [approvedDishes, restrictions, preferences, completedDishIds, exclusions] =
      await Promise.all([
        this.catalogRead.listApprovedDishes(),
        this.restrictionsForFilter.getActiveRestrictionCodes(input.accountId),
        this.profileQuery.getPreferences(input.accountId),
        this.progressPublic.getCompletedDishIds(input.accountId),
        this.routinePublic.getSuggestionExclusions(input.accountId, input.sessionKey),
      ]);

    const counts = { compatible: 0, incompatible: 0, unconfirmed: 0 };
    for (const dish of approvedDishes) {
      const classification = classifyRecipe(dish, restrictions);
      counts[classification.result] += 1;
    }

    // ADR-014 §8-9 / A13 × A05: Aggregate counts only — never log accountId or restriction codes.
    this.logger.info(
      {
        allergenPackageVersion: PACKAGE_VERSION,
        ...(input.clientAllergenPackageVersion
          ? { clientAllergenPackageVersion: input.clientAllergenPackageVersion }
          : {}),
        compatible: counts.compatible,
        incompatible: counts.incompatible,
        unconfirmed: counts.unconfirmed,
      },
      'Suggestion allergen classification summary',
    );

    // RN08 / A06: Keep strictly compatible recipes via the shared pure allergen filter.
    const compatibleDishes = filterCandidates(approvedDishes, restrictions);

    const excludedDishIds = new Set<string>([
      ...completedDishIds,
      ...exclusions.candidateDishIds,
      ...exclusions.discardedDishIdsInSession,
    ]);

    // RN02 / #86: an evolution stays a mystery until its base dish is completed, so it is
    // never suggested before that (suggesting it would reveal its name and photo).
    const completed = new Set(completedDishIds);
    const eligibleDishes = compatibleDishes.filter(
      (dish) =>
        !excludedDishIds.has(dish.dishId) &&
        (dish.baseDishId === null || completed.has(dish.baseDishId)),
    );
    const ranked = rankCompatibleDishes(eligibleDishes, preferences);
    const selected = ranked.slice(0, limit);

    if (selected.length === 0) {
      return {
        suggestions: [],
        noResult: true,
        minPackageVersion: PACKAGE_VERSION,
      };
    }

    const presentedRecords = await this.routinePublic.registerPresentedSuggestions(
      input.accountId,
      selected.map((dish) => dish.dishId),
      input.sessionKey,
    );

    const dishById = new Map(selected.map((dish) => [dish.dishId, dish]));
    const suggestions: SuggestionItemDto[] = [];
    for (const record of presentedRecords) {
      const dish = dishById.get(record.dishId);
      if (dish) {
        suggestions.push(toSuggestionItem(record, dish));
      }
    }

    return {
      suggestions,
      noResult: suggestions.length === 0,
      minPackageVersion: PACKAGE_VERSION,
    };
  }

  async approveSuggestion(
    accountId: string,
    suggestionId: string,
    idempotencyKey: string,
  ): Promise<SuggestionItemDto> {
    const approved = await this.routinePublic.approveSuggestion(
      accountId,
      suggestionId,
      idempotencyKey,
    );

    const approvedDishes = await this.catalogRead.listApprovedDishes();
    const dish = approvedDishes.find((item) => item.dishId === approved.dishId);
    if (!dish) {
      throw new ProblemError(
        notFoundProblem('Prato associado à sugestão não está mais disponível.'),
      );
    }

    return toSuggestionItem(approved, dish);
  }

  async discardSuggestion(
    accountId: string,
    suggestionId: string,
    sessionKey: string,
    idempotencyKey: string,
  ): Promise<void> {
    await this.routinePublic.discardSuggestion(accountId, suggestionId, sessionKey, idempotencyKey);
  }
}
