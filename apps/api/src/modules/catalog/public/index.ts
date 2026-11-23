import type { FastifyInstance } from 'fastify';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AuthGuard } from '../../../shared/auth.js';
import { DrizzleCatalogRepository } from '../internal/repository.js';
import { registerCatalogRoutes } from '../internal/routes.js';
import type { CatalogReadPort } from './catalog-read.js';
import type { CatalogWritePort } from './catalog-write.js';
import { createPhotoStorageFromEnv, type PhotoStorage } from './photo-storage.js';

export interface CreateCatalogModuleDeps {
  readonly db: NodePgDatabase;
  readonly authGuard: AuthGuard;
  readonly photoStorage?: PhotoStorage;
}

export interface CatalogModule {
  readonly read: CatalogReadPort;
  readonly write: CatalogWritePort;
  readonly photoStorage: PhotoStorage;
  registerRoutes(app: FastifyInstance): void;
}

/**
 * Composition root factory for the catalog module (ADR-002, P06, P02f, S1, S4).
 */
export function createCatalogModule(deps: CreateCatalogModuleDeps): CatalogModule {
  const repository = new DrizzleCatalogRepository(deps.db);
  const photoStorage = deps.photoStorage ?? createPhotoStorageFromEnv();

  return {
    read: repository,
    write: repository,
    photoStorage,
    registerRoutes(app: FastifyInstance): void {
      registerCatalogRoutes(app, {
        catalogRead: repository,
        photoStorage,
        authGuard: deps.authGuard,
      });
    },
  };
}
