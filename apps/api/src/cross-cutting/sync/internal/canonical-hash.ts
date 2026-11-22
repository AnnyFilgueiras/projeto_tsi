import { createHash } from 'node:crypto';
import type { OperationType } from '../../../shared/operation-applier.js';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry !== undefined) {
        sorted[key] = canonicalize(entry);
      }
    }
    return sorted;
  }
  return value;
}

/**
 * Produces a deterministic SHA-256 hex digest of an operation's type and payload
 * independent of JSON property order (P05).
 */
export function hashOperationPayload(type: OperationType, payload: unknown): string {
  const canonicalJson = JSON.stringify({
    type,
    payload: canonicalize(payload),
  });
  return createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}
