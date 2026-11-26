import type { FastifyInstance } from 'fastify';
import type { CatalogReadPort } from '../../modules/catalog/public/catalog-read.js';
import type { ProfileQueryPort } from '../../modules/profile/public/profile-query.js';
import type { RestrictionsForFilterPort } from '../../modules/profile/public/restrictions-for-filter.js';
import type { ProgressPublicPort } from '../../modules/progress/public/progress-public.js';
import type { RoutinePublicPort } from '../../modules/routine/public/routine-public.js';
import type { AuthGuard } from '../../shared/auth.js';
import { registerSuggestionSearchRoutes } from './internal/routes.js';
import { SuggestionService, type AggregateClassificationLogger } from './internal/service.js';

export interface CreateSuggestionSearchModuleDeps {
  readonly catalogRead: CatalogReadPort;
  readonly restrictionsForFilter: RestrictionsForFilterPort;
  readonly profileQuery: ProfileQueryPort;
  readonly progressPublic: ProgressPublicPort;
  readonly routinePublic: RoutinePublicPort;
  readonly authGuard: AuthGuard;
  readonly logger: AggregateClassificationLogger;
}

export interface SuggestionSearchModule {
  readonly suggestionService: SuggestionService;
  registerRoutes(app: FastifyInstance): void;
}

/**
 * Composition root factory for `cross-cutting/suggestion-search` (S3, A05, A06).
 */
export function createSuggestionSearchModule(
  deps: CreateSuggestionSearchModuleDeps,
): SuggestionSearchModule {
  const suggestionService = new SuggestionService({
    catalogRead: deps.catalogRead,
    restrictionsForFilter: deps.restrictionsForFilter,
    profileQuery: deps.profileQuery,
    progressPublic: deps.progressPublic,
    routinePublic: deps.routinePublic,
    logger: deps.logger,
  });

  return {
    suggestionService,
    registerRoutes(app: FastifyInstance): void {
      registerSuggestionSearchRoutes(app, {
        suggestionService,
        authGuard: deps.authGuard,
      });
    },
  };
}

export {
  DEFAULT_SUGGESTION_LIMIT,
  MAX_SUGGESTION_LIMIT,
  rankCompatibleDishes,
  SuggestionService,
  type DishSummaryDto,
  type GetSuggestionsInput,
  type GetSuggestionsResponse,
  type SuggestionItemDto,
} from './internal/service.js';
