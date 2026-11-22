import { AesGcmFieldCipher } from './aes-gcm-field-cipher.js';
import type { KeyProvider } from './key-provider.js';

/**
 * Application-layer AES-256-GCM field encryption support boundary (ADR-006, A05, S5).
 *
 * Only `modules/profile` (and `src/app.ts` composition) may import this module.
 */
export interface EncryptedFieldPayload {
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyVersion: number;
}

export interface FieldCipher {
  encrypt(plaintext: string, associatedData: string): Promise<EncryptedFieldPayload>;
  decrypt(payload: EncryptedFieldPayload, associatedData: string): Promise<string>;
}

export function createFieldCipher(keyProvider: KeyProvider): FieldCipher {
  return new AesGcmFieldCipher(keyProvider);
}

export { AesGcmFieldCipher, FieldDecryptionError } from './aes-gcm-field-cipher.js';
export {
  AES_256_KEY_BYTES,
  EnvOrFileKeyProvider,
  InMemoryKeyProvider,
  KeyProviderError,
  type EncryptionKeyRecord,
  type InMemoryKeyProviderOptions,
  type KeyProvider,
} from './key-provider.js';
