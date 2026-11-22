import type { AllergenCode } from '@panelada/allergen-rules/rules';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// S8: profile_* Drizzle table definitions stay private inside modules/profile/internal.
export const profileUsers = pgTable('profile_users', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  culinaryPreferences: jsonb('culinary_preferences').$type<string[]>().notNull().default([]),
  reminderActive: boolean('reminder_active').notNull().default(false),
  reminderTypes: jsonb('reminder_types').$type<string[]>().notNull().default([]),
  reminderFrequency: text('reminder_frequency'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Fixed catalog of 19 restriction types (ANVISA RDC 727/2022 Annex III + lactose). Non-sensitive seed data.
export const profileRestrictionTypes = pgTable('profile_restriction_types', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  associatedAllergens: jsonb('associated_allergens').$type<AllergenCode[]>().notNull(),
});

// ADR-006 / A05: Stores ONLY AES-256-GCM encrypted restriction types with per-write random IV and keyVersion.
// Never stores plaintext restriction codes; revocation executes a physical DELETE (RN09).
export const profileRestrictions = pgTable(
  'profile_restrictions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profileUsers.id, { onDelete: 'cascade' }),
    encryptedType: text('encrypted_type').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    keyVersion: integer('key_version').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('profile_restrictions_user_id_idx').on(table.userId)],
);
