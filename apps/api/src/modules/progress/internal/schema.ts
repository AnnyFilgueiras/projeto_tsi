import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

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

// RN05 / RN06: Each rating uses composite PK (user_id, id = opId) so client-supplied opIds
// are strictly tenant-scoped and never overwrite prior preparations of the same dish.
export const progressRatings = pgTable(
  'progress_ratings',
  {
    id: uuid('id').notNull(),
    userId: uuid('user_id').notNull(),
    dishId: uuid('dish_id').notNull(),
    score: integer('score').notNull(),
    comment: text('comment'),
    changes: text('changes'),
    itemId: uuid('item_id'),
    ratedAt: timestamp('rated_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'progress_ratings_pk',
      columns: [table.userId, table.id],
    }),
    index('progress_ratings_user_id_idx').on(table.userId),
    index('progress_ratings_user_dish_idx').on(table.userId, table.dishId),
  ],
);

// RN02: Additive-only evolution unlocks keyed by (user_id, dish_id).
export const progressEvolutionUnlocks = pgTable(
  'progress_evolution_unlocks',
  {
    userId: uuid('user_id').notNull(),
    dishId: uuid('dish_id').notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'progress_evolution_unlocks_pk',
      columns: [table.userId, table.dishId],
    }),
  ],
);

// RN04: Additive-only badge awards keyed by (user_id, definition_id); never revoked.
export const progressBadgeAwards = pgTable(
  'progress_badge_awards',
  {
    userId: uuid('user_id').notNull(),
    definitionId: uuid('definition_id')
      .notNull()
      .references(() => progressBadgeDefinitions.id),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'progress_badge_awards_pk',
      columns: [table.userId, table.definitionId],
    }),
  ],
);
