import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export type SuggestionStatus = 'presented' | 'candidate' | 'discarded';

// S8: routine_* Drizzle table definitions live exclusively inside modules/routine/internal.
// Wave 1A owns the Suggestion lifecycle (RN11); meal plans and shopping lists arrive in Wave 1B.
export const routineSuggestions = pgTable(
  'routine_suggestions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    dishId: uuid('dish_id').notNull(),
    status: text('status').$type<SuggestionStatus>().notNull(),
    sessionKey: text('session_key').notNull(),
    presentedAt: timestamp('presented_at', { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (table) => [
    index('routine_suggestions_user_status_idx').on(table.userId, table.status),
    index('routine_suggestions_user_session_idx').on(table.userId, table.sessionKey),
    uniqueIndex('routine_suggestions_user_dish_candidate_uidx')
      .on(table.userId, table.dishId)
      .where(sql`${table.status} = 'candidate'`),
  ],
);

// P05: Module-owned Idempotency-Key table for online suggestion approve/discard mutations (90-day TTL).
export const routineIdempotencyKeys = pgTable(
  'routine_idempotency_keys',
  {
    accountId: uuid('account_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    endpoint: text('endpoint').notNull(),
    payloadHash: text('payload_hash').notNull(),
    statusCode: integer('status_code').notNull(),
    responseBody: jsonb('response_body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'routine_idempotency_keys_pk',
      columns: [table.accountId, table.idempotencyKey],
    }),
    index('routine_idempotency_keys_expires_at_idx').on(table.expiresAt),
  ],
);
