import type { FastifyInstance } from 'fastify';
import type { DatabaseClient } from '../../db/client.js';
import type { ProfileLifecyclePort } from '../../modules/profile/public/profile-lifecycle.js';
import type { AuthGuard } from '../../shared/auth.js';
import { AccountService } from './internal/account-service.js';
import { createAuthGuard } from './internal/auth-guard.js';
import { InMemoryRateLimiter } from './internal/rate-limiter.js';
import { DrizzleIdentityRepository } from './internal/repository.js';
import { registerIdentityRoutes, type IdentityRateLimitConfig } from './internal/routes.js';
import { SessionService } from './internal/session-service.js';
import type { TokenIssuer } from './internal/token-issuer.js';

export interface CreateIdentityModuleDeps {
  readonly dbClient: DatabaseClient;
  readonly profileLifecycle: ProfileLifecyclePort;
  readonly tokenIssuer: TokenIssuer;
  readonly clock?: () => Date;
  readonly rateLimitConfig?: IdentityRateLimitConfig;
}

export interface IdentityModule {
  readonly authGuard: AuthGuard;
  readonly accountService: AccountService;
  readonly sessionService: SessionService;
  registerRoutes(app: FastifyInstance): void;
}

export function createIdentityModule(deps: CreateIdentityModuleDeps): IdentityModule {
  const repository = new DrizzleIdentityRepository(deps.dbClient);
  const authGuard = createAuthGuard(deps.tokenIssuer);
  const sessionService = new SessionService({
    store: repository,
    tokenIssuer: deps.tokenIssuer,
    clock: deps.clock,
  });
  const accountService = new AccountService({
    store: repository,
    profileLifecycle: deps.profileLifecycle,
    sessionService,
    clock: deps.clock,
  });
  const rateLimiter = new InMemoryRateLimiter(deps.clock);

  return {
    authGuard,
    accountService,
    sessionService,
    registerRoutes(app: FastifyInstance): void {
      registerIdentityRoutes(app, {
        accountService,
        sessionService,
        authGuard,
        rateLimiter,
        rateLimitConfig: deps.rateLimitConfig,
      });
    },
  };
}

export { AccountService, type CreateAnonymousAccountResult } from './internal/account-service.js';
export { createAuthGuard } from './internal/auth-guard.js';
export { InMemoryRateLimiter } from './internal/rate-limiter.js';
export {
  DrizzleIdentityRepository,
  type AccountRecord,
  type IdentityStore,
  type RefreshSessionRecord,
} from './internal/repository.js';
export type { IdentityRateLimitConfig } from './internal/routes.js';
export {
  CONCURRENT_REUSE_TOLERANCE_MS,
  REFRESH_TOKEN_TTL_MS,
  SessionService,
  type SignInResult,
  type TokenPair,
} from './internal/session-service.js';
export {
  ACCESS_TOKEN_TTL_SECONDS,
  Hs256TokenIssuer,
  type Hs256TokenIssuerOptions,
  type IssuedAccessToken,
  type TokenIssuer,
} from './internal/token-issuer.js';
