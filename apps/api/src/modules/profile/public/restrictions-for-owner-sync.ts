import type { AllergenCode } from '@panelada/allergen-rules/rules';

export interface DecryptedRestrictionWithConsent {
  readonly restrictionType: AllergenCode;
  readonly consentAt: string;
}

/**
 * Restricted facade exposing decrypted dietary restrictions exclusively to
 * `cross-cutting/sync` (`DownloadSetBuilder`) so the authenticated owner receives
 * their own restrictions on device sync (A05, ADR-006, OpenAPI DownloadSet).
 *
 * Domain modules and `identity` must never import this file (enforced by ESLint).
 */
export interface RestrictionsForOwnerSyncPort {
  getDecryptedRestrictionsWithConsent(
    accountId: string,
  ): Promise<readonly DecryptedRestrictionWithConsent[]>;
}
