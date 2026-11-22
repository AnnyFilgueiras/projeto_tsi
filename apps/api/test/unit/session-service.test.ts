import { describe, expect, it } from 'vitest';
import {
  AccountService,
  Hs256TokenIssuer,
  SessionService,
  type AccountRecord,
  type IdentityStore,
  type RefreshSessionRecord,
} from '../../src/cross-cutting/identity/index.js';
import type { ProfileLifecyclePort } from '../../src/modules/profile/public/profile-lifecycle.js';
import { hashPassword } from '../../src/shared/password-hash.js';
import { ProblemError } from '../../src/shared/problem.js';
import type { Tx } from '../../src/shared/tx.js';

const FAKE_TX = {} as Tx;
const JWT_SECRET = 'test-jwt-secret-at-least-32-bytes-long-0001';

class InMemoryIdentityStore implements IdentityStore {
  readonly accounts = new Map<string, AccountRecord>();
  readonly sessions = new Map<string, RefreshSessionRecord>();

  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return fn(FAKE_TX);
  }

  async createAccount(account: AccountRecord, _tx: Tx): Promise<void> {
    this.accounts.set(account.id, { ...account });
  }

  async findAccountById(accountId: string, _tx?: Tx): Promise<AccountRecord | null> {
    const account = this.accounts.get(accountId);
    return account ? { ...account } : null;
  }

  async findAccountByEmail(email: string, _tx?: Tx): Promise<AccountRecord | null> {
    const normalized = email.trim().toLowerCase();
    for (const account of this.accounts.values()) {
      if (account.email?.toLowerCase() === normalized) {
        return { ...account };
      }
    }
    return null;
  }

  async updateLastAccess(accountId: string, at: Date, _tx?: Tx): Promise<void> {
    const existing = this.accounts.get(accountId);
    if (existing) {
      this.accounts.set(accountId, { ...existing, lastAccessAt: at });
    }
  }

  async createRefreshSession(session: RefreshSessionRecord, _tx: Tx): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async findRefreshSessionByTokenHashForUpdate(
    tokenHash: string,
    _tx: Tx,
  ): Promise<RefreshSessionRecord | null> {
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash) {
        return { ...session };
      }
    }
    return null;
  }

  async findRefreshSessionById(sessionId: string, _tx: Tx): Promise<RefreshSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : null;
  }

  async markRefreshSessionUsed(
    sessionId: string,
    usedAt: Date,
    successorId: string,
    _tx: Tx,
  ): Promise<void> {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      this.sessions.set(sessionId, { ...existing, usedAt, successorId });
    }
  }

  async revokeFamily(familyId: string, revokedAt: Date, _tx?: Tx): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.familyId === familyId && session.revokedAt === null) {
        this.sessions.set(id, { ...session, revokedAt });
      }
    }
  }

  async revokeAccountSessions(
    accountId: string,
    revokedAt: Date,
    _tx?: Tx,
  ): Promise<readonly string[]> {
    const families = new Set<string>();
    for (const [id, session] of this.sessions.entries()) {
      if (session.accountId === accountId && session.revokedAt === null) {
        this.sessions.set(id, { ...session, revokedAt });
        families.add(session.familyId);
      }
    }
    return [...families];
  }
}

describe('AccountService, SessionService and TokenIssuer (A02, ADR-007, ADR-008, T01)', () => {
  it('A02 / T01: creates an anonymous account and user profile in the same transaction and issues a 45-min JWT with only accountId and role', async () => {
    let now = new Date('2026-11-21T12:00:00.000Z');
    const store = new InMemoryIdentityStore();
    const createdProfiles: Array<{ accountId: string; tx: Tx }> = [];
    const profileLifecycle: ProfileLifecyclePort = {
      async createProfile(accountId, tx) {
        createdProfiles.push({ accountId, tx });
      },
      async deleteData() {},
    };
    const tokenIssuer = new Hs256TokenIssuer({ secret: JWT_SECRET, clock: () => now });
    const sessionService = new SessionService({ store, tokenIssuer, clock: () => now });
    const accountService = new AccountService({
      store,
      profileLifecycle,
      sessionService,
      clock: () => now,
    });

    const result = await accountService.createAnonymousAccount();

    expect(createdProfiles).toEqual([{ accountId: result.accountId, tx: FAKE_TX }]);
    expect(result.tokens.expiresAt).toBe('2026-11-21T12:45:00.000Z');
    expect(result.tokens.refreshExpiresAt).toBe('2026-12-21T12:00:00.000Z');

    const verified = tokenIssuer.verify(result.tokens.accessToken);
    expect(verified).toEqual({ accountId: result.accountId, role: 'user' });

    // Decode payload segment to assert minimal claims (ADR-007: no email or restrictions).
    const payloadSegment = result.tokens.accessToken.split('.')[1] ?? '';
    const decoded = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >;
    expect(Object.keys(decoded).sort()).toEqual(['exp', 'iat', 'role', 'sub']);

    // Token must fail verification once 45 minutes have elapsed.
    now = new Date('2026-11-21T12:45:01.000Z');
    expect(() => tokenIssuer.verify(result.tokens.accessToken)).toThrow(ProblemError);
  });

  it('ADR-007: rotates refresh tokens, returns the same TokenPair within 60s concurrent reuse, and revokes the whole family on reuse after 60s', async () => {
    let now = new Date('2026-11-21T12:00:00.000Z');
    const store = new InMemoryIdentityStore();
    const profileLifecycle: ProfileLifecyclePort = {
      async createProfile() {},
      async deleteData() {},
    };
    const tokenIssuer = new Hs256TokenIssuer({ secret: JWT_SECRET, clock: () => now });
    const sessionService = new SessionService({ store, tokenIssuer, clock: () => now });
    const accountService = new AccountService({
      store,
      profileLifecycle,
      sessionService,
      clock: () => now,
    });

    const initial = await accountService.createAnonymousAccount();
    const firstRefresh = initial.tokens.refreshToken;

    // First rotation at t = +10s.
    now = new Date('2026-11-21T12:00:10.000Z');
    const rotated = await sessionService.refresh(firstRefresh);
    expect(rotated.refreshToken).not.toBe(firstRefresh);
    expect(rotated.accessToken).not.toBe(initial.tokens.accessToken);

    // Concurrent retry of firstRefresh at t = +69s (59s after first use -> within 60s tolerance).
    now = new Date('2026-11-21T12:01:09.000Z');
    const withinWindow = await sessionService.refresh(firstRefresh);
    expect(withinWindow).toEqual(rotated);

    // Replay of firstRefresh at t = +71s (61s after first use -> outside 60s tolerance).
    now = new Date('2026-11-21T12:01:11.000Z');
    await expect(sessionService.refresh(firstRefresh)).rejects.toMatchObject({
      problem: { type: 'invalid-refresh', status: 401 },
    });

    // Family revocation must also invalidate the previously valid successor token.
    await expect(sessionService.refresh(rotated.refreshToken)).rejects.toMatchObject({
      problem: { type: 'invalid-refresh', status: 401 },
    });
  });

  it('ADR-007 / ADR-008: signIn verifies curator Argon2id password, revokes prior sessions (single active device), and signOut revokes current sessions', async () => {
    let now = new Date('2026-11-21T12:00:00.000Z');
    const store = new InMemoryIdentityStore();
    const tokenIssuer = new Hs256TokenIssuer({ secret: JWT_SECRET, clock: () => now });
    const sessionService = new SessionService({ store, tokenIssuer, clock: () => now });

    const curatorId = '99999999-9999-4999-8999-999999999999';
    const passwordHash = await hashPassword('curador-senha-segura');
    await store.createAccount(
      {
        id: curatorId,
        role: 'curator',
        email: 'curador@panelada.local',
        passwordHash,
        createdAt: now,
        lastAccessAt: now,
      },
      FAKE_TX,
    );

    await expect(
      sessionService.signIn('curador@panelada.local', 'senha-errada-123'),
    ).rejects.toMatchObject({
      problem: { type: 'invalid-credentials', status: 401 },
    });

    const firstLogin = await sessionService.signIn(
      'CURADOR@panelada.local',
      'curador-senha-segura',
    );
    expect(tokenIssuer.verify(firstLogin.tokens.accessToken)).toEqual({
      accountId: curatorId,
      role: 'curator',
    });

    // Second login revokes first device's refresh token (ADR-008 single active device).
    now = new Date('2026-11-21T12:05:00.000Z');
    const secondLogin = await sessionService.signIn(
      'curador@panelada.local',
      'curador-senha-segura',
    );

    await expect(sessionService.refresh(firstLogin.tokens.refreshToken)).rejects.toMatchObject({
      problem: { type: 'invalid-refresh', status: 401 },
    });

    // Sign-out revokes the active session.
    await sessionService.revokeSessions(curatorId);
    await expect(sessionService.refresh(secondLogin.tokens.refreshToken)).rejects.toMatchObject({
      problem: { type: 'invalid-refresh', status: 401 },
    });
  });
});
