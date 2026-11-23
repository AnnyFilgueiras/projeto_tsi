import type { FastifyInstance } from 'fastify';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AuthGuard } from '../../../shared/auth.js';
import type { OperationApplier } from '../../../shared/operation-applier.js';
import type { FieldCipher } from '../../../support/field-encryption/index.js';
import { createProfileAppliers } from '../internal/applier.js';
import { DrizzleProfileRepository } from '../internal/repository.js';
import { registerProfileRoutes } from '../internal/routes.js';
import { ProfileService } from '../internal/service.js';
import type { ProfileLifecyclePort } from './profile-lifecycle.js';
import type { ProfileQueryPort } from './profile-query.js';
import type { RestrictionsForFilterPort } from './restrictions-for-filter.js';
import type { RestrictionsForOwnerSyncPort } from './restrictions-for-owner-sync.js';

export interface CreateProfileModuleDeps {
  readonly db: NodePgDatabase;
  readonly cipher: FieldCipher;
  readonly authGuard: AuthGuard;
  readonly clock?: () => Date;
}

export interface ProfileModule {
  readonly lifecycle: ProfileLifecyclePort;
  readonly query: ProfileQueryPort;
  readonly restrictionsForFilter: RestrictionsForFilterPort;
  readonly restrictionsForOwnerSync: RestrictionsForOwnerSyncPort;
  readonly appliers: readonly OperationApplier[];
  registerRoutes(app: FastifyInstance): void;
}

/**
 * Composition root factory for the profile module (ADR-002, P06, S1, S5).
 */
export function createProfileModule(deps: CreateProfileModuleDeps): ProfileModule {
  const repository = new DrizzleProfileRepository(deps.db);
  const service = new ProfileService({
    store: repository,
    cipher: deps.cipher,
    clock: deps.clock,
  });

  return {
    lifecycle: service,
    query: service,
    restrictionsForFilter: service,
    restrictionsForOwnerSync: service,
    appliers: createProfileAppliers(service),
    registerRoutes(app: FastifyInstance): void {
      registerProfileRoutes(app, {
        profileService: service,
        authGuard: deps.authGuard,
      });
    },
  };
}
