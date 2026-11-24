import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import type { AllergenState } from '@panelada/allergen-rules/rules';
import type {
  CatalogDishSummaryDto,
  CatalogReadPort,
  Continent,
  CuisineDto,
  Difficulty,
} from '../../../modules/catalog/public/catalog-read.js';
import type {
  ProfileQueryPort,
  ProfileSummaryDto,
  RestrictionTypeDto,
} from '../../../modules/profile/public/profile-query.js';
import type {
  DecryptedRestrictionWithConsent,
  RestrictionsForOwnerSyncPort,
} from '../../../modules/profile/public/restrictions-for-owner-sync.js';
import type {
  BadgeAwardDto,
  BadgeDefinitionDto,
  ProgressPublicPort,
  RatingDto,
} from '../../../modules/progress/public/progress-public.js';
import type {
  RoutinePublicPort,
  SuggestionStatus,
} from '../../../modules/routine/public/routine-public.js';
import { hashCanonicalPayload } from '../../../shared/canonical-hash.js';

export interface DownloadSetDishIndexItem {
  readonly id: string;
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
}

export interface DownloadSetCuisineIndexItem {
  readonly id: string;
  readonly name: string;
  readonly continents: readonly Continent[];
  readonly totalDishes: number;
}

export interface DownloadSetCandidateItem {
  readonly id: string;
  readonly status: SuggestionStatus;
  readonly dish: {
    readonly dishId: string;
    readonly name: string;
    readonly cuisineId: string;
    readonly prepTimeMinutes: number;
    readonly difficulty: Difficulty;
    readonly photoHash?: string;
    readonly allergenState: AllergenState;
  };
  readonly missingIngredients: readonly string[];
  readonly missingUtensils: readonly string[];
}

export interface DownloadSetRecipeRef {
  readonly dishId: string;
  readonly updatedAt: string;
  readonly photoHash?: string;
}

export interface DownloadSetDto {
  readonly version: string;
  readonly generatedAt: string;
  readonly minPackageVersion: string;
  readonly profile: ProfileSummaryDto;
  readonly restrictions: readonly DecryptedRestrictionWithConsent[];
  readonly pantry: readonly string[];
  readonly utensils: readonly string[];
  readonly plans: readonly never[];
  readonly candidates: readonly DownloadSetCandidateItem[];
  readonly ratings: readonly RatingDto[];
  readonly badgeAwards: readonly BadgeAwardDto[];
  readonly evolutionUnlocks: readonly string[];
  readonly catalogIndex: {
    readonly dishes: readonly DownloadSetDishIndexItem[];
    readonly cuisines: readonly DownloadSetCuisineIndexItem[];
    readonly badgeDefinitions: readonly BadgeDefinitionDto[];
  };
  readonly restrictionTypes: readonly RestrictionTypeDto[];
  readonly recipesToDownload: readonly DownloadSetRecipeRef[];
}

export type DownloadSetBuildResult =
  { readonly notModified: true } | { readonly notModified: false; readonly data: DownloadSetDto };

export interface DownloadSetBuilderDeps {
  readonly profileQuery: ProfileQueryPort;
  readonly restrictionsForOwnerSync: RestrictionsForOwnerSyncPort;
  readonly catalogRead: CatalogReadPort;
  readonly progressPublic: ProgressPublicPort;
  readonly routinePublic: RoutinePublicPort;
  readonly clock?: () => Date;
}

/**
 * Pure helper assembling cuisines with their approved dish totals for collection progress (RN07).
 */
export function buildCuisineCatalogIndex(
  dishes: readonly CatalogDishSummaryDto[],
  cuisines: readonly CuisineDto[],
): DownloadSetCuisineIndexItem[] {
  const countsByCuisine = new Map<string, number>();
  for (const dish of dishes) {
    countsByCuisine.set(dish.cuisineId, (countsByCuisine.get(dish.cuisineId) ?? 0) + 1);
  }

  return cuisines.map((cuisine) => ({
    id: cuisine.id,
    name: cuisine.name,
    continents: cuisine.continents,
    totalDishes: countsByCuisine.get(cuisine.id) ?? 0,
  }));
}

/**
 * Computes a deterministic content version for HTTP 304 conditional download-set polling.
 */
export function computeDownloadSetVersion(
  snapshot: Omit<DownloadSetDto, 'version' | 'generatedAt'>,
): string {
  return hashCanonicalPayload('download-set', snapshot);
}

/**
 * Builds Layer 1 + Layer 2 download-set snapshots across module public facades
 * (UC04, UC10, UC11, ADR-008, P06).
 */
export class DownloadSetBuilder {
  private readonly profileQuery: ProfileQueryPort;
  private readonly restrictionsForOwnerSync: RestrictionsForOwnerSyncPort;
  private readonly catalogRead: CatalogReadPort;
  private readonly progressPublic: ProgressPublicPort;
  private readonly routinePublic: RoutinePublicPort;
  private readonly clock: () => Date;

  constructor(deps: DownloadSetBuilderDeps) {
    this.profileQuery = deps.profileQuery;
    this.restrictionsForOwnerSync = deps.restrictionsForOwnerSync;
    this.catalogRead = deps.catalogRead;
    this.progressPublic = deps.progressPublic;
    this.routinePublic = deps.routinePublic;
    this.clock = deps.clock ?? (() => new Date());
  }

  async build(accountId: string, clientVersion?: string): Promise<DownloadSetBuildResult> {
    const [
      profile,
      pantryAndUtensils,
      restrictionTypes,
      restrictions,
      catalogIndex,
      progress,
      candidateRecords,
    ] = await Promise.all([
      this.profileQuery.getProfileSummary(accountId),
      this.profileQuery.getPantryAndUtensils(accountId),
      this.profileQuery.listRestrictionTypes(),
      this.restrictionsForOwnerSync.getDecryptedRestrictionsWithConsent(accountId),
      this.catalogRead.getCatalogIndex(),
      this.progressPublic.getProgressSnapshot(accountId),
      this.routinePublic.listCandidateSuggestions(accountId),
    ]);

    const dishById = new Map(catalogIndex.dishes.map((dish) => [dish.dishId, dish]));

    const candidates: DownloadSetCandidateItem[] = [];
    const recipeRefByDishId = new Map<string, DownloadSetRecipeRef>();

    for (const record of candidateRecords) {
      const dish = dishById.get(record.dishId);
      if (!dish) {
        continue;
      }

      candidates.push({
        id: record.id,
        status: record.status,
        dish: {
          dishId: dish.dishId,
          name: dish.name,
          cuisineId: dish.cuisineId,
          prepTimeMinutes: dish.prepTimeMinutes,
          difficulty: dish.difficulty,
          ...(dish.photoHash !== null ? { photoHash: dish.photoHash } : {}),
          allergenState: dish.allergenState,
        },
        missingIngredients: [],
        missingUtensils: [],
      });

      if (!recipeRefByDishId.has(dish.dishId)) {
        recipeRefByDishId.set(dish.dishId, {
          dishId: dish.dishId,
          updatedAt: dish.updatedAt,
          ...(dish.photoHash !== null ? { photoHash: dish.photoHash } : {}),
        });
      }
    }

    const coreSnapshot: Omit<DownloadSetDto, 'version' | 'generatedAt'> = {
      minPackageVersion: PACKAGE_VERSION,
      profile,
      restrictions,
      pantry: pantryAndUtensils.pantryIngredientIds,
      utensils: pantryAndUtensils.utensilIds,
      plans: [],
      candidates,
      ratings: progress.ratings,
      badgeAwards: progress.badgeAwards,
      evolutionUnlocks: progress.evolutionUnlocks,
      catalogIndex: {
        dishes: catalogIndex.dishes.map((dish) => ({
          id: dish.dishId,
          name: dish.name,
          cuisineId: dish.cuisineId,
          baseDishId: dish.baseDishId,
        })),
        cuisines: buildCuisineCatalogIndex(catalogIndex.dishes, catalogIndex.cuisines),
        badgeDefinitions: progress.badgeDefinitions,
      },
      restrictionTypes,
      recipesToDownload: [...recipeRefByDishId.values()],
    };

    const version = computeDownloadSetVersion(coreSnapshot);
    if (clientVersion !== undefined && clientVersion === version) {
      return { notModified: true };
    }

    return {
      notModified: false,
      data: {
        version,
        generatedAt: this.clock().toISOString(),
        ...coreSnapshot,
      },
    };
  }
}
