import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import {
  ProblemError,
  unauthenticatedProblem,
  validationProblem,
} from '../../../shared/problem.js';
import {
  DEFAULT_SUGGESTION_LIMIT,
  MAX_SUGGESTION_LIMIT,
  type SuggestionService,
} from './service.js';

const uuidSchema = z.string().uuid();

const suggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_SUGGESTION_LIMIT).default(DEFAULT_SUGGESTION_LIMIT),
  usePantry: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const suggestionIdParamsSchema = z.object({
  suggestionId: uuidSchema,
});

function requireIdempotencyKeyHeader(request: FastifyRequest): string {
  const raw = request.headers['idempotency-key'];
  const headerValue = Array.isArray(raw) ? raw[0] : raw;
  const parsed = uuidSchema.safeParse(headerValue);
  if (!parsed.success) {
    throw new ProblemError(
      validationProblem('O cabeçalho Idempotency-Key (UUID válido) é obrigatório.', [
        { field: 'Idempotency-Key', message: 'UUID inválido ou ausente.' },
      ]),
    );
  }
  return parsed.data;
}

const PACKAGE_VERSION_HEADER_PATTERN = /^[0-9A-Za-z._+-]{1,32}$/;

function readOptionalPackageVersionHeader(request: FastifyRequest): string | undefined {
  const raw = request.headers['x-allergen-package-version'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  // ADR-014 / A13: Read header without blocking; drop malformed/oversized values before logging.
  if (!trimmed || !PACKAGE_VERSION_HEADER_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function resolveSessionKey(request: FastifyRequest, accountId: string): string {
  // RN11: Scope discards to the active bearer token using an irreversible hash
  // so discarded dishes stay hidden in this session and can reappear in future sessions.
  const rawAuth = request.headers.authorization;
  const authValue = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  const normalizedToken = authValue?.replace(/^Bearer\s+/i, '').trim();
  const digest = createHash('sha256')
    .update(normalizedToken && normalizedToken.length > 0 ? normalizedToken : accountId, 'utf8')
    .digest('hex')
    .slice(0, 32);
  return `sess:${digest}`;
}

export interface SuggestionRoutesDeps {
  readonly suggestionService: SuggestionService;
  readonly authGuard: AuthGuard;
}

export function registerSuggestionSearchRoutes(
  app: FastifyInstance,
  deps: SuggestionRoutesDeps,
): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/v1/suggestions',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        querystring: suggestionsQuerySchema,
      },
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }

      const response = await deps.suggestionService.getSuggestions({
        accountId: principal.accountId,
        sessionKey: resolveSessionKey(request, principal.accountId),
        limit: request.query.limit,
        usePantry: request.query.usePantry,
        clientAllergenPackageVersion: readOptionalPackageVersionHeader(request),
      });

      return reply.code(200).send(response);
    },
  );

  typedApp.post(
    '/v1/suggestions/:suggestionId/approve',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        params: suggestionIdParamsSchema,
      },
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }

      const idempotencyKey = requireIdempotencyKeyHeader(request);
      const item = await deps.suggestionService.approveSuggestion(
        principal.accountId,
        request.params.suggestionId,
        idempotencyKey,
      );

      return reply.code(200).send(item);
    },
  );

  typedApp.post(
    '/v1/suggestions/:suggestionId/discard',
    {
      preHandler: deps.authGuard.requireAuth,
      schema: {
        params: suggestionIdParamsSchema,
      },
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }

      const idempotencyKey = requireIdempotencyKeyHeader(request);
      await deps.suggestionService.discardSuggestion(
        principal.accountId,
        request.params.suggestionId,
        resolveSessionKey(request, principal.accountId),
        idempotencyKey,
      );

      return reply.code(204).send();
    },
  );
}
