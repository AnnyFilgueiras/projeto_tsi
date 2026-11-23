import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export type BadgeMilestone =
  | { readonly type: 'dish'; readonly dishId: string }
  | { readonly type: 'cuisine'; readonly cuisineId: string }
  | { readonly type: 'n_cuisines'; readonly quantity: number }
  | { readonly type: 'all_continents' }
  | { readonly type: 'set'; readonly cuisineIds: readonly string[] }
  | { readonly type: 'total_dishes'; readonly quantity: number }
  | { readonly type: 'evolution_level'; readonly minLevel: number }
  | { readonly type: 'adaptation_count'; readonly quantity: number };

// S8: progress_* Drizzle table definitions live exclusively inside modules/progress/internal.
export const progressBadgeDefinitions = pgTable('progress_badge_definitions', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  milestone: jsonb('milestone').$type<BadgeMilestone>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
