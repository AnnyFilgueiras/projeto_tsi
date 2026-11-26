import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { OperationApplyResult } from '../../../shared/operation-applier.js';

// S8 / P05: sync_* Drizzle table definitions stay private inside cross-cutting/sync/internal.
// Stores payloadHash and non-sensitive OperationApplyResult only — never raw dietary restriction payloads (A05).
export const syncProcessedOperations = pgTable(
  'sync_processed_operations',
  {
    accountId: uuid('account_id').notNull(),
    opId: uuid('op_id').notNull(),
    type: text('type').notNull(),
    payloadHash: text('payload_hash').notNull(),
    status: text('status').$type<'confirmed' | 'rejected'>().notNull(),
    response: jsonb('response').$type<OperationApplyResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'sync_processed_operations_pk',
      columns: [table.accountId, table.opId],
    }),
  ],
);
