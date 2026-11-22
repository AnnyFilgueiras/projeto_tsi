import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '../../db/client.js';
import type { AuthGuard } from '../../shared/auth.js';
import type { OperationApplier } from '../../shared/operation-applier.js';
import {
  OperationApplierRegistry,
  type OperationApplierRegistryOptions,
} from './internal/applier-registry.js';
import { DrizzleOperationRepository } from './internal/repository.js';
import { registerSyncRoutes } from './internal/routes.js';
import { SyncService } from './internal/sync-service.js';

export interface CreateSyncModuleDeps {
  readonly dbClient: DatabaseClient;
  readonly authGuard: AuthGuard;
  readonly appliers: readonly OperationApplier[];
  readonly registryOptions?: OperationApplierRegistryOptions;
  readonly clock?: () => Date;
}

export interface SyncModule {
  readonly syncService: SyncService;
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

  return {
    syncService,
    registerRoutes(app: FastifyInstance): void {
      registerSyncRoutes(app, {
        syncService,
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
