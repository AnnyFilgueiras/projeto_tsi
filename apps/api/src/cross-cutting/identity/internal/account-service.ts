import { randomUUID } from 'node:crypto';
import type { ProfileLifecyclePort } from '../../../modules/profile/public/profile-lifecycle.js';
import type { IdentityStore } from './repository.js';
import type { SessionService, TokenPair } from './session-service.js';

export interface CreateAnonymousAccountResult {
  readonly accountId: string;
  readonly tokens: TokenPair;
}

export interface AccountServiceDeps {
  readonly store: IdentityStore;
  readonly profileLifecycle: ProfileLifecyclePort;
  readonly sessionService: SessionService;
  readonly clock?: () => Date;
}

/**
 * Orchestrates account creation and atomic profile initialization (ADR-007, T01).
 */
export class AccountService {
  private readonly store: IdentityStore;
  private readonly profileLifecycle: ProfileLifecyclePort;
  private readonly sessionService: SessionService;
  private readonly clock: () => Date;

  constructor(deps: AccountServiceDeps) {
    this.store = deps.store;
    this.profileLifecycle = deps.profileLifecycle;
    this.sessionService = deps.sessionService;
    this.clock = deps.clock ?? (() => new Date());
  }

  async createAnonymousAccount(): Promise<CreateAnonymousAccountResult> {
    const accountId = randomUUID();
    const now = this.clock();

    // T01 / ADR-007: Account, profile, and initial refresh session commit in a single transaction.
    const tokens = await this.store.withTransaction(async (tx) => {
      await this.store.createAccount(
        {
          id: accountId,
          role: 'user',
          email: null,
          passwordHash: null,
          createdAt: now,
          lastAccessAt: now,
        },
        tx,
      );
      await this.profileLifecycle.createProfile(accountId, tx);
      const issued = await this.sessionService.issueSessionForAccount(accountId, 'user', tx);
      return issued.tokens;
    });

    return { accountId, tokens };
  }
}
