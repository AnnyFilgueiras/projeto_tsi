import { hashCanonicalPayload } from '../../../shared/canonical-hash.js';
import type { OperationType } from '../../../shared/operation-applier.js';

/**
 * Produces a deterministic SHA-256 hex digest of an operation's type and payload
 * independent of JSON property order (P05).
 */
export function hashOperationPayload(type: OperationType, payload: unknown): string {
  return hashCanonicalPayload(type, payload);
}
