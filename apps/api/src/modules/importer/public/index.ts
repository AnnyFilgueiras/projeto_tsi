import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '../../../db/client.js';
import type { AuthGuard } from '../../../shared/auth.js';
import type { CatalogReadPort } from '../../catalog/public/catalog-read.js';
import type { CatalogWritePort } from '../../catalog/public/catalog-write.js';
import type { PhotoStorage } from '../../catalog/public/photo-storage.js';
import { DrizzleImporterRepository } from '../internal/repository.js';
import { registerImporterRoutes } from '../internal/routes.js';
import { CurationService } from '../internal/service.js';

export interface CreateImporterModuleDeps {
  readonly dbClient: DatabaseClient;
  readonly catalogRead: CatalogReadPort;
  readonly catalogWrite: CatalogWritePort;
  readonly photoStorage: PhotoStorage;
  readonly authGuard: AuthGuard;
  readonly clock?: () => Date;
}

export interface ImporterModule {
  registerRoutes(app: FastifyInstance): void;
}

/**
 * Composition root factory for the importer / manual curation module (ADR-002, ADR-010, S4).
 */
export function createImporterModule(deps: CreateImporterModuleDeps): ImporterModule {
  const repository = new DrizzleImporterRepository(deps.dbClient.db);
  const curationService = new CurationService({
    dbClient: deps.dbClient,
    repository,
    catalogRead: deps.catalogRead,
    catalogWrite: deps.catalogWrite,
    photoStorage: deps.photoStorage,
    clock: deps.clock,
  });

  return {
    registerRoutes(app: FastifyInstance): void {
      registerImporterRoutes(app, {
        curationService,
        authGuard: deps.authGuard,
      });
    },
  };
}
