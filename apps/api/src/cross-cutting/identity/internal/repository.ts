import { and, eq, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../../db/client.js';
import type { AccountRole } from '../../../shared/auth.js';
import type { Tx } from '../../../shared/tx.js';
import { identityAccounts, identityRefreshSessions } from './schema.js';

export interface AccountRecord {
  readonly id: string;
  readonly role: AccountRole;
  readonly email: string | null;
  readonly passwordHash: string | null;
  readonly createdAt: Date;
  readonly lastAccessAt: Date;
}

export interface RefreshSessionRecord {
  readonly id: string;
  readonly accountId: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly successorId: string | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface IdentityStore {
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  createAccount(account: AccountRecord, tx: Tx): Promise<void>;
  findAccountById(accountId: string, tx?: Tx): Promise<AccountRecord | null>;
  findAccountByEmail(email: string, tx?: Tx): Promise<AccountRecord | null>;
  updateLastAccess(accountId: string, at: Date, tx?: Tx): Promise<void>;
  createRefreshSession(session: RefreshSessionRecord, tx: Tx): Promise<void>;
  findRefreshSessionByTokenHashForUpdate(
    tokenHash: string,
    tx: Tx,
  ): Promise<RefreshSessionRecord | null>;
  findRefreshSessionById(sessionId: string, tx: Tx): Promise<RefreshSessionRecord | null>;
  markRefreshSessionUsed(
    sessionId: string,
    usedAt: Date,
    successorId: string,
    tx: Tx,
  ): Promise<void>;
  revokeFamily(familyId: string, revokedAt: Date, tx?: Tx): Promise<void>;
  revokeAccountSessions(accountId: string, revokedAt: Date, tx?: Tx): Promise<readonly string[]>;
}

/**
 * Drizzle repository strictly scoped to `identity_*` tables (S8).
 */
export class DrizzleIdentityRepository implements IdentityStore {
  constructor(private readonly dbClient: DatabaseClient) {}

  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.dbClient.withTransaction(fn);
  }

  async createAccount(account: AccountRecord, tx: Tx): Promise<void> {
    await tx.insert(identityAccounts).values({
      id: account.id,
      role: account.role,
      email: account.email,
      passwordHash: account.passwordHash,
      createdAt: account.createdAt,
      lastAccessAt: account.lastAccessAt,
    });
  }

  async findAccountById(accountId: string, tx?: Tx): Promise<AccountRecord | null> {
    const executor = tx ?? this.dbClient.db;
    const rows = await executor
      .select()
      .from(identityAccounts)
      .where(eq(identityAccounts.id, accountId));
    return rows[0] ?? null;
  }

  async findAccountByEmail(email: string, tx?: Tx): Promise<AccountRecord | null> {
    const executor = tx ?? this.dbClient.db;
    const normalized = email.trim().toLowerCase();
    const rows = await executor
      .select()
      .from(identityAccounts)
      .where(eq(identityAccounts.email, normalized));
    return rows[0] ?? null;
  }

  async updateLastAccess(accountId: string, at: Date, tx?: Tx): Promise<void> {
    const executor = tx ?? this.dbClient.db;
    await executor
      .update(identityAccounts)
      .set({ lastAccessAt: at })
      .where(eq(identityAccounts.id, accountId));
  }

  async createRefreshSession(session: RefreshSessionRecord, tx: Tx): Promise<void> {
    await tx.insert(identityRefreshSessions).values({
      id: session.id,
      accountId: session.accountId,
      familyId: session.familyId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      usedAt: session.usedAt,
      successorId: session.successorId,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
    });
  }

  async findRefreshSessionByTokenHashForUpdate(
    tokenHash: string,
    tx: Tx,
  ): Promise<RefreshSessionRecord | null> {
    const rows = await tx
      .select()
      .from(identityRefreshSessions)
      .where(eq(identityRefreshSessions.tokenHash, tokenHash))
      .for('update');
    return rows[0] ?? null;
  }

  async findRefreshSessionById(sessionId: string, tx: Tx): Promise<RefreshSessionRecord | null> {
    const rows = await tx
      .select()
      .from(identityRefreshSessions)
      .where(eq(identityRefreshSessions.id, sessionId));
    return rows[0] ?? null;
  }

  async markRefreshSessionUsed(
    sessionId: string,
    usedAt: Date,
    successorId: string,
    tx: Tx,
  ): Promise<void> {
    await tx
      .update(identityRefreshSessions)
      .set({ usedAt, successorId })
      .where(eq(identityRefreshSessions.id, sessionId));
  }

  async revokeFamily(familyId: string, revokedAt: Date, tx?: Tx): Promise<void> {
    const executor = tx ?? this.dbClient.db;
    await executor
      .update(identityRefreshSessions)
      .set({ revokedAt })
      .where(
        and(
          eq(identityRefreshSessions.familyId, familyId),
          isNull(identityRefreshSessions.revokedAt),
        ),
      );
  }

  async revokeAccountSessions(
    accountId: string,
    revokedAt: Date,
    tx?: Tx,
  ): Promise<readonly string[]> {
    const executor = tx ?? this.dbClient.db;
    const rows = await executor
      .update(identityRefreshSessions)
      .set({ revokedAt })
      .where(
        and(
          eq(identityRefreshSessions.accountId, accountId),
          isNull(identityRefreshSessions.revokedAt),
        ),
      )
      .returning({ familyId: identityRefreshSessions.familyId });

    return [...new Set(rows.map((row) => row.familyId))];
  }
}
