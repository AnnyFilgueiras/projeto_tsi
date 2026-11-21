import { PACKAGE_VERSION, type AllergenState } from './rules.js';

/**
 * Server-only catalog publication invariants entrypoint (ADR-014, S6, A7).
 *
 * Never imported by apps/mobile. Full publication gate invariant rules are
 * implemented in MVP-03 alongside the shared allergen vector suite.
 */
export const INVARIANTS_PACKAGE_VERSION = PACKAGE_VERSION;

export interface CatalogInvariantCheckResult {
  readonly ok: boolean;
  readonly allergenState: AllergenState;
}
