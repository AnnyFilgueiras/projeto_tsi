import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import { notFoundProblem, ProblemError } from '../../../shared/problem.js';
import type { CatalogReadPort } from '../public/catalog-read.js';
import type { PhotoStorage } from '../public/photo-storage.js';

const photoParamsSchema = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/, 'Hash SHA-256 inválido.'),
});

const recipeParamsSchema = z.object({
  dishId: z.string().uuid(),
});

export interface CatalogRoutesDeps {
  readonly catalogRead: CatalogReadPort;
  readonly photoStorage: PhotoStorage;
  readonly authGuard: AuthGuard;
}

export function registerCatalogRoutes(app: FastifyInstance, deps: CatalogRoutesDeps): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/v1/photos/:hash',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        params: photoParamsSchema,
      },
    },
    async (request, reply) => {
      const stored = await deps.photoStorage.get(request.params.hash);
      if (!stored) {
        throw new ProblemError(notFoundProblem('Foto não encontrada.'));
      }

      // ADR-012: Photo binaries are content-addressed by SHA-256 and safe to cache immutably.
      return reply
        .code(200)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .type(stored.contentType)
        .send(stored.bytes);
    },
  );

  typedApp.get(
    '/v1/recipes/:dishId',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        params: recipeParamsSchema,
      },
    },
    async (request, reply) => {
      const recipe = await deps.catalogRead.getApprovedRecipe(request.params.dishId);
      if (!recipe) {
        throw new ProblemError(notFoundProblem('Receita não encontrada no catálogo aprovado.'));
      }

      return reply.code(200).send(recipe);
    },
  );
}
