import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { createTechnicalLogger, type TechnicalLogger } from './support/technical-log/logger.js';

export const DEFAULT_API_VERSION = '0.1.0';

export interface BuildAppDeps {
  readonly checkDatabaseHealth: () => Promise<boolean>;
  readonly logger?: TechnicalLogger;
  readonly apiVersion?: string;
}

const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  allergenPackageVersion: z.string(),
});

const problemResponseSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
});

export function buildApp(deps: BuildAppDeps) {
  const logger = deps.logger ?? createTechnicalLogger();
  const apiVersion = deps.apiVersion ?? DEFAULT_API_VERSION;

  const app = Fastify({
    loggerInstance: logger,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/v1/health',
    {
      schema: {
        response: {
          200: healthResponseSchema,
          503: problemResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      let healthy = false;
      try {
        healthy = await deps.checkDatabaseHealth();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown database error';
        app.log.error({ reason: message }, 'Database health check threw an exception');
        healthy = false;
      }

      if (!healthy) {
        return reply.code(503).type('application/problem+json').send({
          type: 'service-unavailable',
          title: 'Serviço indisponível',
          status: 503,
          detail: 'Não foi possível verificar a conectividade com o banco de dados.',
        });
      }

      return reply.code(200).send({
        status: 'ok' as const,
        version: apiVersion,
        allergenPackageVersion: PACKAGE_VERSION,
      });
    },
  );

  return app;
}
