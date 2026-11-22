import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import { ProblemError, unauthenticatedProblem } from '../../../shared/problem.js';
import type { AccountService } from './account-service.js';
import type { InMemoryRateLimiter } from './rate-limiter.js';
import type { SessionService } from './session-service.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SIGN_IN_MAX_ATTEMPTS = 5;
const ANONYMOUS_MAX_ATTEMPTS = 60;

const tokenPairSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.string(),
  refreshToken: z.string(),
  refreshExpiresAt: z.string(),
});

const accountWithTokensSchema = z.object({
  accountId: z.string().uuid(),
  tokens: tokenPairSchema,
});

const signInBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  })
  .strict();

const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export interface IdentityRateLimitConfig {
  readonly signInMaxAttempts?: number;
  readonly signInWindowMs?: number;
  readonly anonymousMaxAttempts?: number;
  readonly anonymousWindowMs?: number;
}

export interface IdentityRoutesDeps {
  readonly accountService: AccountService;
  readonly sessionService: SessionService;
  readonly authGuard: AuthGuard;
  readonly rateLimiter: InMemoryRateLimiter;
  readonly rateLimitConfig?: IdentityRateLimitConfig;
}

export function registerIdentityRoutes(app: FastifyInstance, deps: IdentityRoutesDeps): void {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const signInMax = deps.rateLimitConfig?.signInMaxAttempts ?? SIGN_IN_MAX_ATTEMPTS;
  const signInWindow = deps.rateLimitConfig?.signInWindowMs ?? FIFTEEN_MINUTES_MS;
  const anonMax = deps.rateLimitConfig?.anonymousMaxAttempts ?? ANONYMOUS_MAX_ATTEMPTS;
  const anonWindow = deps.rateLimitConfig?.anonymousWindowMs ?? FIFTEEN_MINUTES_MS;

  typedApp.post(
    '/v1/accounts/anonymous',
    {
      schema: {
        response: {
          201: accountWithTokensSchema,
        },
      },
    },
    async (request, reply) => {
      deps.rateLimiter.consume(`anon:${request.ip}`, anonMax, anonWindow);
      const result = await deps.accountService.createAnonymousAccount();
      return reply.code(201).send(result);
    },
  );

  typedApp.post(
    '/v1/sessions/sign-in',
    {
      schema: {
        body: signInBodySchema,
        response: {
          200: accountWithTokensSchema,
        },
      },
    },
    async (request, reply) => {
      const normalizedEmail = request.body.email.trim().toLowerCase();
      // ADR-007 item 7: Limit both per IP (anti-email-spray / Argon2id CPU DoS) and per IP+account (5 / 15 min).
      deps.rateLimiter.consume(
        `sign-in-ip:${request.ip}`,
        Math.max(signInMax * 4, 20),
        signInWindow,
      );
      deps.rateLimiter.consume(`sign-in:${request.ip}:${normalizedEmail}`, signInMax, signInWindow);

      const result = await deps.sessionService.signIn(request.body.email, request.body.password);
      return reply.code(200).send(result);
    },
  );

  typedApp.post(
    '/v1/sessions/refresh',
    {
      schema: {
        body: refreshBodySchema,
        response: {
          200: tokenPairSchema,
        },
      },
    },
    async (request, reply) => {
      const tokens = await deps.sessionService.refresh(request.body.refreshToken);
      return reply.code(200).send(tokens);
    },
  );

  typedApp.post(
    '/v1/sessions/sign-out',
    {
      preHandler: deps.authGuard.requireAuth,
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }
      await deps.sessionService.revokeSessions(principal.accountId);
      return reply.code(204).send();
    },
  );
}
