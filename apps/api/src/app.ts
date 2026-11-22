import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import Fastify, {
  type FastifyBaseLogger,
  type FastifyError,
  type RawReplyDefaultExpression,
  type RawRequestDefaultExpression,
  type RawServerDefault,
} from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  createAuthGuard,
  createIdentityModule,
  Hs256TokenIssuer,
  type IdentityRateLimitConfig,
  type TokenIssuer,
} from './cross-cutting/identity/index.js';
import { createSyncModule } from './cross-cutting/sync/index.js';
import type { DatabaseClient } from './db/client.js';
import { createProfileModule } from './modules/profile/public/index.js';
import {
  notFoundProblem,
  ProblemError,
  validationProblem,
  type ProblemFieldError,
} from './shared/problem.js';
import {
  createFieldCipher,
  EnvOrFileKeyProvider,
  type KeyProvider,
} from './support/field-encryption/index.js';
import { createTechnicalLogger, type TechnicalLogger } from './support/technical-log/logger.js';

export const DEFAULT_API_VERSION = '0.1.0';

// Non-secret fallback used only when NODE_ENV is not production and JWT_SECRET is omitted.
const DEV_FALLBACK_JWT_SECRET = 'panelada-dev-only-jwt-secret-change-in-prod-0001';

export interface BuildAppDeps {
  readonly checkDatabaseHealth: () => Promise<boolean>;
  readonly dbClient?: DatabaseClient;
  readonly keyProvider?: KeyProvider;
  readonly tokenIssuer?: TokenIssuer;
  readonly jwtSecret?: string;
  readonly clock?: () => Date;
  readonly rateLimitConfig?: IdentityRateLimitConfig;
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

function resolveJwtSecret(explicitSecret?: string): string {
  const secret = explicitSecret ?? process.env.JWT_SECRET;
  if (secret !== undefined && secret.length > 0) {
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long.');
    }
    return secret;
  }
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    throw new Error('JWT_SECRET must be configured with at least 32 characters outside dev/test.');
  }
  return DEV_FALLBACK_JWT_SECRET;
}

function extractValidationErrors(error: FastifyError): ProblemFieldError[] {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return error.validation.map((item) => ({
      field: item.instancePath.replace(/^\//, '').replace(/\//g, '.') || 'body',
      message: item.message ?? 'Valor inválido.',
    }));
  }

  if (Array.isArray(error.validation)) {
    return error.validation.map((item) => ({
      field: item.instancePath.replace(/^\//, '').replace(/\//g, '.') || 'body',
      message: item.message ?? 'Valor inválido.',
    }));
  }

  return [];
}

export function buildApp(deps: BuildAppDeps) {
  const logger = deps.logger ?? createTechnicalLogger();
  const apiVersion = deps.apiVersion ?? DEFAULT_API_VERSION;

  const app = Fastify<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger
  >({
    loggerInstance: logger,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Global RFC 9457 error handler sanitized against sensitive data leakage (A13, A05).
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ProblemError) {
      if (error.headers) {
        for (const [headerName, headerValue] of Object.entries(error.headers)) {
          reply.header(headerName, headerValue);
        }
      }
      request.log.warn(
        { status: error.problem.status, problemType: error.problem.type },
        'Request rejected with domain problem',
      );
      return reply.code(error.problem.status).type('application/problem+json').send(error.problem);
    }

    const fastifyError = error as FastifyError;
    if (
      hasZodFastifySchemaValidationErrors(fastifyError) ||
      Array.isArray(fastifyError.validation)
    ) {
      const errors = extractValidationErrors(fastifyError);
      request.log.warn(
        { status: 400, problemType: 'validation', fields: errors.map((item) => item.field) },
        'Request validation failed',
      );
      return reply
        .code(400)
        .type('application/problem+json')
        .send(validationProblem('Os dados enviados na requisição são inválidos.', errors));
    }

    if (fastifyError.statusCode === 400) {
      request.log.warn(
        { status: 400, problemType: 'validation' },
        'Malformed request payload rejected',
      );
      return reply
        .code(400)
        .type('application/problem+json')
        .send(validationProblem('Corpo da requisição malformado.'));
    }

    request.log.error(
      { status: 500, errorName: error instanceof Error ? error.name : 'UnknownError' },
      'Unhandled API error',
    );
    return reply.code(500).type('application/problem+json').send({
      type: 'internal-error',
      title: 'Erro interno do servidor',
      status: 500,
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply
      .code(404)
      .type('application/problem+json')
      .send(notFoundProblem('Rota não encontrada.'));
  });

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

  // Wire domain and cross-cutting modules when a DatabaseClient is supplied (composition root).
  if (deps.dbClient) {
    const tokenIssuer =
      deps.tokenIssuer ??
      new Hs256TokenIssuer({
        secret: resolveJwtSecret(deps.jwtSecret),
        clock: deps.clock,
      });
    const authGuard = createAuthGuard(tokenIssuer);
    const keyProvider = deps.keyProvider ?? EnvOrFileKeyProvider.fromEnv();
    const fieldCipher = createFieldCipher(keyProvider);

    const profileModule = createProfileModule({
      db: deps.dbClient.db,
      cipher: fieldCipher,
      authGuard,
      clock: deps.clock,
    });

    const identityModule = createIdentityModule({
      dbClient: deps.dbClient,
      profileLifecycle: profileModule.lifecycle,
      tokenIssuer,
      clock: deps.clock,
      rateLimitConfig: deps.rateLimitConfig,
    });

    const syncModule = createSyncModule({
      dbClient: deps.dbClient,
      authGuard,
      appliers: [...profileModule.appliers],
      clock: deps.clock,
    });

    identityModule.registerRoutes(app);
    profileModule.registerRoutes(app);
    syncModule.registerRoutes(app);
  }

  return app;
}
