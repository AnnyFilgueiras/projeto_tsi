import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AccountRole } from '../../../shared/auth.js';

// S8: identity_* Drizzle table definitions stay private inside cross-cutting/identity/internal.
export const identityAccounts = pgTable('identity_accounts', {
  id: uuid('id').primaryKey(),
  role: text('role').$type<AccountRole>().notNull(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastAccessAt: timestamp('last_access_at', { withTimezone: true }).notNull().defaultNow(),
});

// ADR-007: Refresh tokens are stored strictly as SHA-256 hashes (never plaintext).
export const identityRefreshSessions = pgTable(
  'identity_refresh_sessions',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => identityAccounts.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    successorId: uuid('successor_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('identity_refresh_sessions_account_id_idx').on(table.accountId),
    index('identity_refresh_sessions_family_id_idx').on(table.familyId),
  ],
);
