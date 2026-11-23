import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { OperationApplier } from '../../../shared/operation-applier.js';
import type { CatalogReadPort } from '../../catalog/public/catalog-read.js';
import { createRatingApplier } from '../internal/rating-applier.js';
import { DrizzleProgressRepository } from '../internal/repository.js';
import type { ProgressPublicPort } from './progress-public.js';

export interface CreateProgressModuleDeps {
  readonly db: NodePgDatabase;
  readonly catalogRead: CatalogReadPort;
  readonly clock?: () => Date;
}

export interface ProgressModule {
  readonly publicPort: ProgressPublicPort;
  readonly appliers: readonly OperationApplier[];
}

/**
 * Composition root factory for the progress & gamification module (ADR-002, ADR-016, P01, P06).
 */
export function createProgressModule(deps: CreateProgressModuleDeps): ProgressModule {
  const repository = new DrizzleProgressRepository(deps.db);
  const ratingApplier = createRatingApplier({
    store: repository,
    catalogRead: deps.catalogRead,
    clock: deps.clock,
  });

  return {
    publicPort: repository,
    appliers: [ratingApplier],
  };
}

export type {
  BadgeAwardDto,
  BadgeDefinitionDto,
  BadgeMilestone,
  ProgressPublicPort,
  ProgressSnapshotDto,
  RatingDto,
} from './progress-public.js';
