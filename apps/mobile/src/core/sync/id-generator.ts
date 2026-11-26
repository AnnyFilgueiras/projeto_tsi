export interface UuidV7Sources {
  /** Cryptographically secure random bytes (expo-crypto on device). */
  readonly randomBytes: (count: number) => Uint8Array;
  readonly now: () => number;
}

/**
 * UUID v7 (RFC 9562) generator for operation ids. The contract requires v7 (`Operation.opId`):
 * time-ordered ids keep the server's ProcessedOperation index append-friendly. expo-crypto only
 * offers v4, hence this small implementation.
 */
export function createUuidV7Generator(sources: UuidV7Sources): () => string {
  return () => {
    const bytes = new Uint8Array(16);
    bytes.set(sources.randomBytes(10).subarray(0, 10), 6);

    // 48-bit big-endian Unix milliseconds. Division instead of bit shifts: JS bitwise ops are 32-bit.
    let ms = sources.now();
    for (let i = 5; i >= 0; i--) {
      bytes[i] = ms % 256;
      ms = Math.floor(ms / 256);
    }

    bytes[6] = 0x70 | (bytes[6]! & 0x0f); // version 7
    bytes[8] = 0x80 | (bytes[8]! & 0x3f); // RFC 9562 variant (10xx)

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
}
