import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '../../db/client.js';
import type { CatalogReadPort } from '../../modules/catalog/public/catalog-read.js';
import type { ProfileQueryPort } from '../../modules/profile/public/profile-query.js';
import type { RestrictionsForOwnerSyncPort } from '../../modules/profile/public/restrictions-for-owner-sync.js';
import type { ProgressPublicPort } from '../../modules/progress/public/progress-public.js';
import type { RoutinePublicPort } from '../../modules/routine/public/routine-public.js';
import type { AuthGuard } from '../../shared/auth.js';
import type { OperationApplier } from '../../shared/operation-applier.js';
import {
  OperationApplierRegistry,
  type OperationApplierRegistryOptions,
} from './internal/applier-registry.js';
import { DownloadSetBuilder } from './internal/download-set-builder.js';
import { DrizzleOperationRepository } from './internal/repository.js';
import { registerSyncRoutes } from './internal/routes.js';
import { SyncService } from './internal/sync-service.js';

export interface CreateSyncModuleDeps {
  readonly dbClient: DatabaseClient;
  readonly authGuard: AuthGuard;
  readonly appliers: readonly OperationApplier[];
  readonly downloadSetPorts?: {
    readonly profileQuery: ProfileQueryPort;
    readonly restrictionsForOwnerSync: RestrictionsForOwnerSyncPort;
    readonly catalogRead: CatalogReadPort;
    readonly progressPublic: ProgressPublicPort;
    readonly routinePublic: RoutinePublicPort;
  };
  readonly registryOptions?: OperationApplierRegistryOptions;
  readonly clock?: () => Date;
}

export interface SyncModule {
  readonly syncService: SyncService;
  readonly downloadSetBuilder?: DownloadSetBuilder;
  registerRoutes(app: FastifyInstance): void;
}

export function createSyncModule(deps: CreateSyncModuleDeps): SyncModule {
  const registry = new OperationApplierRegistry(deps.appliers, deps.registryOptions);
  const repository = new DrizzleOperationRepository(deps.dbClient);
  const syncService = new SyncService({
    registry,
    store: repository,
    clock: deps.clock,
  });

  const downloadSetBuilder = deps.downloadSetPorts
    ? new DownloadSetBuilder({
        ...deps.downloadSetPorts,
        clock: deps.clock,
      })
    : undefined;

  return {
    syncService,
    downloadSetBuilder,
    registerRoutes(app: FastifyInstance): void {
      registerSyncRoutes(app, {
        syncService,
        downloadSetBuilder,
        authGuard: deps.authGuard,
      });
    },
  };
}

export {
  DuplicateOperationApplierError,
  MissingOperationApplierError,
  OperationApplierRegistry,
  type OperationApplierRegistryOptions,
} from './internal/applier-registry.js';
export { hashOperationPayload } from './internal/canonical-hash.js';
export {
  buildCuisineCatalogIndex,
  computeDownloadSetVersion,
  DownloadSetBuilder,
  type DownloadSetBuildResult,
  type DownloadSetCandidateItem,
  type DownloadSetCuisineIndexItem,
  type DownloadSetDishIndexItem,
  type DownloadSetDto,
  type DownloadSetRecipeRef,
} from './internal/download-set-builder.js';
export {
  DrizzleOperationRepository,
  type OperationStore,
  type ProcessedOperationRecord,
} from './internal/repository.js';
export { MAX_SYNC_BATCH_SIZE } from './internal/routes.js';
export {
  IDEMPOTENCY_TTL_MS,
  SyncService,
  type OperationBatchItemResult,
  type ProcessBatchResponse,
  type SyncServiceDeps,
} from './internal/sync-service.js';
