/**
 * Restricted facade exposing decrypted dietary restrictions exclusively for
 * suggestion/search filtering (S3, A05, ADR-006).
 *
 * Only `cross-cutting/suggestion-search` (and composition wiring) may import this file.
 */
export interface RestrictionsForFilterPort {
  getActiveRestrictionCodes(accountId: string): Promise<readonly string[]>;
}
