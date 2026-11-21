/**
 * Shared pure allergen evaluation entrypoint (ADR-014, A06).
 *
 * Full allergen taxonomy, classification, filtering, and substitute checks are
 * implemented in the dedicated allergen-rules slice (MVP-03) backed by shared JSON vectors.
 */
export const PACKAGE_VERSION = '0.1.0' as const;

export type AllergenState = 'verified' | 'unverified';

export type RecipeSafetyClassification = 'safe' | 'unsafe' | 'unconfirmed';
