/**
 * Application-layer AES-256-GCM field encryption support boundary (ADR-006, A05, S5).
 *
 * Only `modules/profile` (and `src/app.ts` composition) may import this module.
 * Concrete `FieldCipher` and `KeyProvider` implementations are added in MVP-04A.
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
