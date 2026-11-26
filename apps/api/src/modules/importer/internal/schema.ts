import type { AllergenCode, AllergenState } from '@panelada/allergen-rules/rules';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export interface ProposalIngredientData {
  readonly ingredientId: string;
  readonly quantity?: string | null;
  readonly unit?: string | null;
}

export interface StoredProposalData {
  readonly name: string;
  readonly cuisineId: string;
  readonly baseDishId: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly ingredients: readonly ProposalIngredientData[];
  readonly utensilIds: readonly string[];
  readonly steps: readonly string[];
  readonly allergens: readonly AllergenCode[];
  readonly allergenState: AllergenState;
  readonly sourceName: string;
  readonly sourceUrl: string;
}

export interface StoredProposalPhoto {
  readonly hash: string;
  readonly author: string;
  readonly title?: string;
  readonly sourceUrl: string;
  readonly license: 'public_domain' | 'cc0' | 'cc_by' | 'cc_by_sa' | 'own_work';
  readonly licenseUrl?: string;
  readonly modified: boolean;
}

export interface StoredVerificationChecklist {
  readonly checkedIngredients: true;
  readonly secondSourceChecked: boolean;
  readonly secondSourceDescription?: string;
  readonly unionChecked: true;
  readonly lactoseFreeChecked?: boolean;
  readonly confirmedAllergenFree?: boolean;
}

// S8: importer_* Drizzle table definitions live exclusively inside modules/importer/internal.

export const importerProposals = pgTable(
  'importer_proposals',
  {
    id: uuid('id').primaryKey(),
    publicationState: text('publication_state')
      .$type<'proposed' | 'approved' | 'deactivated'>()
      .notNull(),
    origin: text('origin').$type<'manual' | 'ai'>().notNull(),
    data: jsonb('data').$type<StoredProposalData>().notNull(),
    confirmedAllergenFree: boolean('confirmed_allergen_free').notNull().default(false),
    photo: jsonb('photo').$type<StoredProposalPhoto | null>(),
    uncertainties: jsonb('uncertainties').$type<string[]>().notNull().default([]),
    rawOutput: jsonb('raw_output').$type<Record<string, unknown> | null>(),
    model: text('model'),
    schemaVersion: text('schema_version'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    verificationChecklist: jsonb(
      'verification_checklist',
    ).$type<StoredVerificationChecklist | null>(),
    verifiedBy: uuid('verified_by'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('importer_proposals_state_created_idx').on(table.publicationState, table.createdAt),
  ],
);

export const importerIdempotencyKeys = pgTable(
  'importer_idempotency_keys',
  {
    accountId: uuid('account_id').notNull(),
    idempotencyKey: uuid('idempotency_key').notNull(),
    endpoint: text('endpoint').notNull(),
    payloadHash: text('payload_hash').notNull(),
    statusCode: integer('status_code').notNull(),
    responseBody: jsonb('response_body').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'importer_idempotency_keys_pk',
      columns: [table.accountId, table.idempotencyKey],
    }),
  ],
);
