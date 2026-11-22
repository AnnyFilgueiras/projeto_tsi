import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { AccountRole } from '../../../shared/auth.js';
import { verifyPassword, verifyPasswordDummy } from '../../../shared/password-hash.js';
import {
  invalidCredentialsProblem,
  invalidRefreshProblem,
  ProblemError,
} from '../../../shared/problem.js';
import type { Tx } from '../../../shared/tx.js';
import type { IdentityStore } from './repository.js';
import type { TokenIssuer } from './token-issuer.js';

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CONCURRENT_REUSE_TOLERANCE_MS = 60 * 1000;
const REFRESH_TOKEN_BYTES = 32;

export interface TokenPair {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly refreshToken: string;
  readonly refreshExpiresAt: string;
}

export interface SignInResult {
  readonly accountId: string;
  readonly tokens: TokenPair;
}

export interface SessionServiceDeps {
  readonly store: IdentityStore;
  readonly tokenIssuer: TokenIssuer;
  readonly clock?: () => Date;
}

interface GraceCacheEntry {
  readonly pair: TokenPair;
  readonly familyId: string;
  readonly expiresAtMs: number;
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function generateOpaqueRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/**
 * Manages rotating single-use refresh sessions, 60 s concurrent-retry tolerance (R17),
 * family revocation on replay outside the window, single active device on sign-in (ADR-008),
 * and sign-out revocation (ADR-007).
 */
export class SessionService {
  private readonly store: IdentityStore;
  private readonly tokenIssuer: TokenIssuer;
  private readonly clock: () => Date;
  // Ephemeral in-memory 60 s cache keyed by rotated session ID so concurrent retries
  // receive the exact same TokenPair without ever storing plaintext refresh tokens in PostgreSQL.
  private readonly graceCache = new Map<string, GraceCacheEntry>();

  constructor(deps: SessionServiceDeps) {
    this.store = deps.store;
    this.tokenIssuer = deps.tokenIssuer;
    this.clock = deps.clock ?? (() => new Date());
  }

  async issueSessionForAccount(
    accountId: string,
    role: AccountRole,
    tx: Tx,
    familyId: string = randomUUID(),
  ): Promise<{ sessionId: string; tokens: TokenPair }> {
    const now = this.clock();
    const refreshToken = generateOpaqueRefreshToken();
    const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const sessionId = randomUUID();

    await this.store.createRefreshSession(
      {
        id: sessionId,
        accountId,
        familyId,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshExpiresAt,
        usedAt: null,
        successorId: null,
        revokedAt: null,
        createdAt: now,
      },
      tx,
    );

    const access = this.tokenIssuer.issueAccess(accountId, role);
    return {
      sessionId,
      tokens: {
        accessToken: access.token,
        expiresAt: access.expiresAt,
        refreshToken,
        refreshExpiresAt: refreshExpiresAt.toISOString(),
      },
    };
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    const account = await this.store.findAccountByEmail(email);
    if (!account || !account.passwordHash) {
      await verifyPasswordDummy(password);
      throw new ProblemError(invalidCredentialsProblem());
    }

    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) {
      throw new ProblemError(invalidCredentialsProblem());
    }

    const now = this.clock();
    const { revokedFamilies, tokens } = await this.store.withTransaction(async (tx) => {
      // ADR-007 item 5 / ADR-008: One active device per account — revoke all prior sessions on sign-in.
      const families = await this.store.revokeAccountSessions(account.id, now, tx);
      await this.store.updateLastAccess(account.id, now, tx);
      const issued = await this.issueSessionForAccount(account.id, account.role, tx);
      return { revokedFamilies: families, tokens: issued.tokens };
    });

    for (const familyId of revokedFamilies) {
      this.evictFamilyFromGraceCache(familyId);
    }

    return {
      accountId: account.id,
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    if (refreshToken.trim().length === 0) {
      throw new ProblemError(invalidRefreshProblem());
    }

    const tokenHash = hashRefreshToken(refreshToken);
    let provisionallyCachedSessionId: string | undefined;

    // Return a discriminated outcome instead of throwing inside `withTransaction` so
    // security revocations commit cleanly before the HTTP 401 ProblemError is raised.
    let outcome:
      | { readonly ok: true; readonly pair: TokenPair }
      | { readonly ok: false; readonly revokedFamilyId?: string };

    try {
      outcome = await this.store.withTransaction<
        | { readonly ok: true; readonly pair: TokenPair }
        | { readonly ok: false; readonly revokedFamilyId?: string }
      >(async (tx) => {
        const session = await this.store.findRefreshSessionByTokenHashForUpdate(tokenHash, tx);
        // Capture current time *after* acquiring the row lock so a concurrent request that waited
        // behind a rotation never observes a negative elapsed time relative to `session.usedAt`.
        const now = this.clock();
        const nowMs = now.getTime();
        this.sweepExpiredGraceEntries(nowMs);

        if (!session) {
          return { ok: false };
        }

        if (session.revokedAt !== null) {
          await this.store.revokeFamily(session.familyId, now, tx);
          return { ok: false, revokedFamilyId: session.familyId };
        }

        if (session.expiresAt.getTime() <= nowMs) {
          await this.store.revokeFamily(session.familyId, now, tx);
          return { ok: false, revokedFamilyId: session.familyId };
        }

        if (session.usedAt !== null) {
          const elapsedSinceUseMs = nowMs - session.usedAt.getTime();
          const withinTolerance =
            elapsedSinceUseMs >= 0 && elapsedSinceUseMs <= CONCURRENT_REUSE_TOLERANCE_MS;

          if (withinTolerance && session.successorId !== null) {
            const successor = await this.store.findRefreshSessionById(session.successorId, tx);
            const cached = this.graceCache.get(session.id);

            if (
              successor !== null &&
              successor.revokedAt === null &&
              successor.usedAt === null &&
              cached !== undefined &&
              cached.expiresAtMs >= nowMs
            ) {
              return { ok: true, pair: cached.pair };
            }
          }

          // ADR-007 (R17): Reuse outside the 60 s tolerance window (or after successor rotated)
          // revokes the entire refresh token family.
          await this.store.revokeFamily(session.familyId, now, tx);
          return { ok: false, revokedFamilyId: session.familyId };
        }

        const account = await this.store.findAccountById(session.accountId, tx);
        if (!account) {
          await this.store.revokeFamily(session.familyId, now, tx);
          return { ok: false, revokedFamilyId: session.familyId };
        }

        const issued = await this.issueSessionForAccount(
          account.id,
          account.role,
          tx,
          session.familyId,
        );
        await this.store.markRefreshSessionUsed(session.id, now, issued.sessionId, tx);
        await this.store.updateLastAccess(account.id, now, tx);

        // Populate the 60 s grace cache before COMMIT releases the FOR UPDATE lock so a waiting
        // concurrent retry immediately finds the issued pair; cleared in catch if COMMIT fails.
        provisionallyCachedSessionId = session.id;
        this.graceCache.set(session.id, {
          pair: issued.tokens,
          familyId: session.familyId,
          expiresAtMs: nowMs + CONCURRENT_REUSE_TOLERANCE_MS,
        });

        return {
          ok: true,
          pair: issued.tokens,
        };
      });
    } catch (error: unknown) {
      if (provisionallyCachedSessionId) {
        this.graceCache.delete(provisionallyCachedSessionId);
      }
      throw error;
    }

    if (!outcome.ok) {
      if (outcome.revokedFamilyId) {
        this.evictFamilyFromGraceCache(outcome.revokedFamilyId);
      }
      throw new ProblemError(invalidRefreshProblem());
    }

    return outcome.pair;
  }

  async revokeSessions(accountId: string): Promise<void> {
    const now = this.clock();
    const revokedFamilies = await this.store.revokeAccountSessions(accountId, now);
    for (const familyId of revokedFamilies) {
      this.evictFamilyFromGraceCache(familyId);
    }
  }

  private evictFamilyFromGraceCache(familyId: string): void {
    for (const [sessionId, entry] of this.graceCache.entries()) {
      if (entry.familyId === familyId) {
        this.graceCache.delete(sessionId);
      }
    }
  }

  private sweepExpiredGraceEntries(nowMs: number): void {
    for (const [sessionId, entry] of this.graceCache.entries()) {
      if (entry.expiresAtMs < nowMs) {
        this.graceCache.delete(sessionId);
      }
    }
  }
}
