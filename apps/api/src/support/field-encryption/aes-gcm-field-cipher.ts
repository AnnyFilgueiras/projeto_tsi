import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedFieldPayload, FieldCipher } from './index.js';
import type { KeyProvider } from './key-provider.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const STRICT_BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
// GCM ciphertext is as long as its plaintext, so unpadded restriction codes leak which restriction
// was stored (3 bytes → ovo/noz, 6 bytes → pinoli). Every catalog code fits in one 32-byte block (#116).
const PADDING_BLOCK_BYTES = 32;
const PADDING_BYTE = 0x00;

// Zero padding is only unambiguous because encrypt() rejects plaintext containing NUL; legacy
// unpadded rows never end in NUL either, so they decrypt unchanged without a migration.
function padPlaintext(plaintext: Buffer): Buffer {
  const paddedLength = Math.ceil(plaintext.length / PADDING_BLOCK_BYTES) * PADDING_BLOCK_BYTES;
  const padded = Buffer.alloc(paddedLength, PADDING_BYTE);
  plaintext.copy(padded);
  return padded;
}

function unpadPlaintext(padded: Buffer): Buffer {
  let end = padded.length;
  while (end > 0 && padded[end - 1] === PADDING_BYTE) {
    end -= 1;
  }
  return padded.subarray(0, end);
}

/**
 * Thrown whenever AES-256-GCM decryption or authentication fails (A05, A13).
 * Error messages intentionally omit plaintext, key material, and payload contents.
 */
export class FieldDecryptionError extends Error {
  constructor(message = 'Failed to decrypt or authenticate encrypted field payload.') {
    super(message);
    this.name = 'FieldDecryptionError';
  }
}

// Node's Buffer.from(str, 'base64') silently ignores invalid characters; validate strictly so
// tampered encodings cannot bypass GCM verification (A05).
function decodeStrictBase64(value: unknown): Buffer {
  if (typeof value !== 'string' || value.length % 4 !== 0 || !STRICT_BASE64_REGEX.test(value)) {
    throw new FieldDecryptionError();
  }
  const buffer = Buffer.from(value, 'base64');
  if (buffer.toString('base64') !== value) {
    throw new FieldDecryptionError();
  }
  return buffer;
}

/**
 * Application-layer AES-256-GCM field cipher (ADR-006, A05).
 *
 * Uses a fresh random 12-byte IV per write, a 16-byte authentication tag,
 * `associatedData` (accountId) as GCM AAD to prevent cross-account row swapping,
 * `keyVersion` from KeyProvider to support seamless key rotation, and zero padding to
 * 32-byte blocks so ciphertext length does not reveal which restriction was stored.
 */
export class AesGcmFieldCipher implements FieldCipher {
  constructor(private readonly keyProvider: KeyProvider) {}

  async encrypt(plaintext: string, associatedData: string): Promise<EncryptedFieldPayload> {
    if (associatedData.length === 0) {
      throw new Error('Associated data (accountId) must be a non-empty string.');
    }
    // Fail closed so padding removal can never be ambiguous; the message never echoes the plaintext (A13).
    if (plaintext.length === 0 || plaintext.includes('\u0000')) {
      throw new Error('Plaintext must be a non-empty string without NUL characters.');
    }

    const { version, key } = await this.keyProvider.getCurrentKey();
    // ADR-006: Every encryption must use a freshly generated 96-bit random IV.
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    cipher.setAAD(Buffer.from(associatedData, 'utf8'));

    const padded = padPlaintext(Buffer.from(plaintext, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion: version,
    };
  }

  async decrypt(payload: EncryptedFieldPayload, associatedData: string): Promise<string> {
    if (associatedData.length === 0) {
      throw new FieldDecryptionError();
    }

    let key: Buffer;
    try {
      const record = await this.keyProvider.getKeyByVersion(payload.keyVersion);
      key = record.key;
    } catch {
      throw new FieldDecryptionError('Unable to resolve encryption key version for payload.');
    }

    try {
      const iv = decodeStrictBase64(payload.iv);
      const authTag = decodeStrictBase64(payload.authTag);
      const ciphertext = decodeStrictBase64(payload.ciphertext);

      if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
        throw new FieldDecryptionError();
      }

      const decipher = createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH_BYTES,
      });
      decipher.setAAD(Buffer.from(associatedData, 'utf8'));
      decipher.setAuthTag(authTag);

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return unpadPlaintext(plaintext).toString('utf8');
    } catch (error: unknown) {
      if (error instanceof FieldDecryptionError) {
        throw error;
      }
      throw new FieldDecryptionError();
    }
  }
}
