/**
 * Public non-sensitive profile read facade (P06).
 * Exposes culinary preferences, pantry, and utensils without exposing dietary restrictions (A05).
 */
export interface ProfilePantryAndUtensils {
  readonly pantryIngredientIds: readonly string[];
  readonly utensilIds: readonly string[];
}

export interface ProfileQueryPort {
  getPreferences(accountId: string): Promise<readonly string[]>;
  getPantryAndUtensils(accountId: string): Promise<ProfilePantryAndUtensils>;
}
