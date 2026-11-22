import { randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2idAsync } from '@noble/hashes/argon2.js';

/**
 * OWASP minimum Argon2id parameters required by ADR-007 item 4:
 * 19 MiB (19456 KiB), 2 iterations, parallelism 1, 16-byte random salt, 32-byte digest.
 * Stored in standard PHC format (`$argon2id$v=19$m=...,t=...,p=...$<salt>$<hash>`) so a future
 * migration to Node 24+ native `crypto.argon2` remains backwards-compatible with existing hashes.
 */
const OWASP_MEMORY_KIB = 19_456;
const OWASP_ITERATIONS = 2;
const OWASP_PARALLELISM = 1;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const ARGON2_VERSION = 19;

// Standard base64 without padding, as mandated by the PHC string format specification.
function toPhcBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/=+$/g, '');
}

function fromPhcBase64(encoded: string): Buffer {
  return Buffer.from(encoded, 'base64');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await argon2idAsync(Buffer.from(password, 'utf8'), salt, {
    m: OWASP_MEMORY_KIB,
    t: OWASP_ITERATIONS,
    p: OWASP_PARALLELISM,
    dkLen: HASH_BYTES,
    version: ARGON2_VERSION,
  });

  return `$argon2id$v=${ARGON2_VERSION}$m=${OWASP_MEMORY_KIB},t=${OWASP_ITERATIONS},p=${OWASP_PARALLELISM}$${toPhcBase64(salt)}$${toPhcBase64(derived)}`;
}

// Precomputed valid PHC hash used to equalize work when sign-in receives an unknown email.
const DUMMY_PHC_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function verifyPassword(password: string, storedPhcHash: string): Promise<boolean> {
  const parts = storedPhcHash.split('$');
  if (parts.length !== 6 || parts[1] !== 'argon2id') {
    return false;
  }

  const versionMatch = /^v=(\d+)$/.exec(parts[2] ?? '');
  const paramsMatch = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(parts[3] ?? '');
  if (!versionMatch || !paramsMatch) {
    return false;
  }

  const version = Number(versionMatch[1]);
  const memory = Number(paramsMatch[1]);
  const iterations = Number(paramsMatch[2]);
  const parallelism = Number(paramsMatch[3]);
  const salt = fromPhcBase64(parts[4] ?? '');
  const expected = fromPhcBase64(parts[5] ?? '');

  if (
    version !== ARGON2_VERSION ||
    !Number.isInteger(memory) ||
    memory < 8 ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    !Number.isInteger(parallelism) ||
    parallelism < 1 ||
    salt.length < 8 ||
    expected.length < 16
  ) {
    return false;
  }

  const derived = await argon2idAsync(Buffer.from(password, 'utf8'), salt, {
    m: memory,
    t: iterations,
    p: parallelism,
    dkLen: expected.length,
    version,
  });

  const derivedBuffer = Buffer.from(derived);
  if (derivedBuffer.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(derivedBuffer, expected);
}

/**
 * Runs a constant-cost Argon2id derivation against a dummy hash when an email does not exist,
 * reducing timing side-channels during credential verification.
 */
export async function verifyPasswordDummy(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_PHC_HASH);
}
