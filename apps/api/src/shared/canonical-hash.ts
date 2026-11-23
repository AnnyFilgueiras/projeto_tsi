import { createHash } from 'node:crypto';

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
 * Produces a deterministic SHA-256 hex digest for an idempotent scope/type and payload
 * independent of JSON property order (P05).
 *
 * Preserves `{ type, payload }` JSON shape for backwards compatibility with existing
 * `sync_processed_operations.payload_hash` records.
 */
export function hashCanonicalPayload(type: string, payload: unknown): string {
  const canonicalJson = JSON.stringify({
    type,
    payload: canonicalize(payload),
  });
  return createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}
