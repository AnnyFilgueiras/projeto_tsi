import type { AllergenCode } from '@panelada/allergen-rules/rules';

/**
 * Public non-sensitive profile read facade (P06).
 * Exposes culinary preferences, reminders, pantry, utensils, and fixed restriction
 * metadata without exposing user dietary restrictions (A05).
 */
export interface ProfilePantryAndUtensils {
  readonly pantryIngredientIds: readonly string[];
  readonly utensilIds: readonly string[];
}

export type ReminderType = 'purchase' | 'preparation';

export interface ProfileRemindersDto {
  readonly active: boolean;
  readonly types: readonly ReminderType[];
  readonly frequency?: string;
}

export interface ProfileSummaryDto {
  readonly name?: string;
  readonly culinaryPreferences: readonly string[];
  readonly reminders?: ProfileRemindersDto;
}

export interface RestrictionTypeDto {
  readonly code: AllergenCode;
  readonly name: string;
  readonly associatedAllergens: readonly AllergenCode[];
}

export interface ProfileQueryPort {
  getPreferences(accountId: string): Promise<readonly string[]>;
  getPantryAndUtensils(accountId: string): Promise<ProfilePantryAndUtensils>;
  getProfileSummary(accountId: string): Promise<ProfileSummaryDto>;
  listRestrictionTypes(): Promise<readonly RestrictionTypeDto[]>;
}
