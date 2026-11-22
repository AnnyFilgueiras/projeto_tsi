import type { AllergenCode, AllergenState } from '@panelada/allergen-rules/rules';
import {
  type AnyPgColumn,
  boolean,
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

export type Continent = 'america' | 'africa' | 'europe' | 'asia' | 'oceania';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PublicationState = 'proposed' | 'approved' | 'deactivated';
export type PhotoLicense = 'public_domain' | 'cc0' | 'cc_by' | 'cc_by_sa' | 'own_work';
export type CatalogOrigin = 'manual' | 'ai';

// S8: catalog_* Drizzle table definitions live exclusively inside modules/catalog/internal.

export const catalogCuisines = pgTable('catalog_cuisines', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  continents: jsonb('continents').$type<Continent[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const catalogIngredients = pgTable('catalog_ingredients', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  allergens: jsonb('allergens').$type<AllergenCode[]>().notNull(),
  lactoseFree: boolean('lactose_free').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const catalogUtensils = pgTable('catalog_utensils', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const catalogIngredientSubstitutions = pgTable(
  'catalog_ingredient_substitutions',
  {
    id: uuid('id').primaryKey(),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => catalogIngredients.id, { onDelete: 'cascade' }),
    substituteId: uuid('substitute_id')
      .notNull()
      .references(() => catalogIngredients.id, { onDelete: 'cascade' }),
    substituteAllergens: jsonb('substitute_allergens').$type<AllergenCode[]>().notNull(),
    allergenState: text('allergen_state').$type<AllergenState>().notNull(),
    confirmedAllergenFree: boolean('confirmed_allergen_free').notNull().default(false),
    origin: text('origin').$type<CatalogOrigin>().notNull(),
    approvedBy: uuid('approved_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('catalog_ingredient_substitutions_pair_uidx').on(
      table.ingredientId,
      table.substituteId,
    ),
    index('catalog_ingredient_substitutions_ingredient_id_idx').on(table.ingredientId),
  ],
);

export const catalogDishes = pgTable(
  'catalog_dishes',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    cuisineId: uuid('cuisine_id')
      .notNull()
      .references(() => catalogCuisines.id),
    baseDishId: uuid('base_dish_id').references((): AnyPgColumn => catalogDishes.id),
    publicationState: text('publication_state').$type<PublicationState>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('catalog_dishes_cuisine_id_idx').on(table.cuisineId),
    index('catalog_dishes_base_dish_id_idx').on(table.baseDishId),
    index('catalog_dishes_publication_state_idx').on(table.publicationState),
  ],
);

export const catalogRecipes = pgTable('catalog_recipes', {
  dishId: uuid('dish_id')
    .primaryKey()
    .references(() => catalogDishes.id, { onDelete: 'cascade' }),
  prepTimeMinutes: integer('prep_time_minutes').notNull(),
  difficulty: text('difficulty').$type<Difficulty>().notNull(),
  steps: jsonb('steps').$type<string[]>().notNull(),
  allergens: jsonb('allergens').$type<AllergenCode[]>().notNull(),
  allergenState: text('allergen_state').$type<AllergenState>().notNull(),
  confirmedAllergenFree: boolean('confirmed_allergen_free').notNull().default(false),
  allergensUpdatedAt: timestamp('allergens_updated_at', { withTimezone: true }).notNull(),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  origin: text('origin').$type<CatalogOrigin>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const catalogRecipeIngredients = pgTable(
  'catalog_recipe_ingredients',
  {
    dishId: uuid('dish_id')
      .notNull()
      .references(() => catalogRecipes.dishId, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => catalogIngredients.id),
    position: integer('position').notNull(),
    quantity: text('quantity'),
    unit: text('unit'),
  },
  (table) => [
    primaryKey({
      name: 'catalog_recipe_ingredients_pk',
      columns: [table.dishId, table.ingredientId],
    }),
  ],
);

export const catalogRecipeUtensils = pgTable(
  'catalog_recipe_utensils',
  {
    dishId: uuid('dish_id')
      .notNull()
      .references(() => catalogRecipes.dishId, { onDelete: 'cascade' }),
    utensilId: uuid('utensil_id')
      .notNull()
      .references(() => catalogUtensils.id),
  },
  (table) => [
    primaryKey({
      name: 'catalog_recipe_utensils_pk',
      columns: [table.dishId, table.utensilId],
    }),
  ],
);

export const catalogDishPhotos = pgTable(
  'catalog_dish_photos',
  {
    dishId: uuid('dish_id')
      .primaryKey()
      .references(() => catalogDishes.id, { onDelete: 'cascade' }),
    fileHash: text('file_hash').notNull(),
    author: text('author').notNull(),
    title: text('title'),
    sourceUrl: text('source_url').notNull(),
    license: text('license').$type<PhotoLicense>().notNull(),
    licenseUrl: text('license_url'),
    modified: boolean('modified').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('catalog_dish_photos_file_hash_idx').on(table.fileHash)],
);
