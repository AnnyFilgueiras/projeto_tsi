import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import { ProblemError, unauthenticatedProblem } from '../../../shared/problem.js';
import type { ProfileService } from './service.js';

const updatePreferencesBodySchema = z
  .object({
    cuisineIds: z.array(z.string().uuid()),
  })
  .strict();

export interface ProfileRoutesDeps {
  readonly profileService: ProfileService;
  readonly authGuard: AuthGuard;
}

export function registerProfileRoutes(app: FastifyInstance, deps: ProfileRoutesDeps): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.put(
    '/v1/profile/preferences',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        body: updatePreferencesBodySchema,
      },
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }

      await deps.profileService.updatePreferences(principal.accountId, request.body.cuisineIds);
      return reply.code(204).send();
    },
  );
}
