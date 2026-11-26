import { createCipheriv, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ALLERGEN_CODES } from '@panelada/allergen-rules/rules';
import { describe, expect, it } from 'vitest';
import {
  AesGcmFieldCipher,
  EnvOrFileKeyProvider,
  FieldDecryptionError,
  InMemoryKeyProvider,
} from '../../src/support/field-encryption/index.js';

function makeKeyBase64(seedByte: number): string {
  return Buffer.alloc(32, seedByte).toString('base64');
}

describe('FieldCipher AES-256-GCM and KeyProvider (A05, ADR-006, P02c)', () => {
  it('A05: encrypts and decrypts a dietary restriction bound to accountId as AAD', async () => {
    const keyProvider = new InMemoryKeyProvider({
      currentVersion: 1,
      keys: { 1: randomBytes(32) },
    });
    const cipher = new AesGcmFieldCipher(keyProvider);
    const accountId = '11111111-1111-4111-8111-111111111111';

    const encrypted = await cipher.encrypt('amendoim', accountId);

    expect(encrypted.keyVersion).toBe(1);
    expect(encrypted.ciphertext).not.toContain('amendoim');
    expect(Buffer.from(encrypted.iv, 'base64')).toHaveLength(12);
    expect(Buffer.from(encrypted.authTag, 'base64')).toHaveLength(16);

    const decrypted = await cipher.decrypt(encrypted, accountId);
    expect(decrypted).toBe('amendoim');
  });

  it('ADR-006: generates a unique 12-byte IV on consecutive encryptions of the same plaintext', async () => {
    const keyProvider = new InMemoryKeyProvider({
      currentVersion: 1,
      keys: { 1: randomBytes(32) },
    });
    const cipher = new AesGcmFieldCipher(keyProvider);
    const accountId = '22222222-2222-4222-8222-222222222222';

    const first = await cipher.encrypt('amendoim', accountId);
    const second = await cipher.encrypt('amendoim', accountId);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(await cipher.decrypt(first, accountId)).toBe('amendoim');
    expect(await cipher.decrypt(second, accountId)).toBe('amendoim');
  });

  it('A05: rejects tampered ciphertext, IV, or authTag without leaking secrets', async () => {
    const keyProvider = new InMemoryKeyProvider({
      currentVersion: 1,
      keys: { 1: randomBytes(32) },
    });
    const cipher = new AesGcmFieldCipher(keyProvider);
    const accountId = '33333333-3333-4333-8333-333333333333';

    const encrypted = await cipher.encrypt('lactose', accountId);

    const tamperedCiphertextBytes = Buffer.from(encrypted.ciphertext, 'base64');
    tamperedCiphertextBytes[0] = (tamperedCiphertextBytes[0] ?? 0) ^ 0xff;
    await expect(
      cipher.decrypt(
        { ...encrypted, ciphertext: tamperedCiphertextBytes.toString('base64') },
        accountId,
      ),
    ).rejects.toBeInstanceOf(FieldDecryptionError);

    const tamperedTagBytes = Buffer.from(encrypted.authTag, 'base64');
    tamperedTagBytes[0] = (tamperedTagBytes[0] ?? 0) ^ 0xff;
    await expect(
      cipher.decrypt({ ...encrypted, authTag: tamperedTagBytes.toString('base64') }, accountId),
    ).rejects.toBeInstanceOf(FieldDecryptionError);

    const tamperedIvBytes = Buffer.from(encrypted.iv, 'base64');
    tamperedIvBytes[0] = (tamperedIvBytes[0] ?? 0) ^ 0xff;
    await expect(
      cipher.decrypt({ ...encrypted, iv: tamperedIvBytes.toString('base64') }, accountId),
    ).rejects.toBeInstanceOf(FieldDecryptionError);

    // Strict base64 validation must reject injected non-base64 characters instead of stripping them.
    await expect(
      cipher.decrypt({ ...encrypted, authTag: `!${encrypted.authTag}` }, accountId),
    ).rejects.toBeInstanceOf(FieldDecryptionError);
  });

  it('ADR-006: fails decryption when associatedData (accountId AAD) differs', async () => {
    const keyProvider = new InMemoryKeyProvider({
      currentVersion: 1,
      keys: { 1: randomBytes(32) },
    });
    const cipher = new AesGcmFieldCipher(keyProvider);
    const ownerAccountId = '44444444-4444-4444-8444-444444444444';
    const otherAccountId = '55555555-5555-4555-8555-555555555555';

    const encrypted = await cipher.encrypt('leite', ownerAccountId);

    await expect(cipher.decrypt(encrypted, otherAccountId)).rejects.toBeInstanceOf(
      FieldDecryptionError,
    );
  });

  it('ADR-006 / P02c: supports key rotation by decrypting v1 payloads after rotating current key to v2', async () => {
    const keyProvider = new InMemoryKeyProvider({
      currentVersion: 1,
      keys: {
        1: randomBytes(32),
        2: randomBytes(32),
      },
    });
    const cipher = new AesGcmFieldCipher(keyProvider);
    const accountId = '66666666-6666-4666-8666-666666666666';

    const v1Payload = await cipher.encrypt('soja', accountId);
    expect(v1Payload.keyVersion).toBe(1);

    keyProvider.setCurrentVersion(2);

    const v2Payload = await cipher.encrypt('soja', accountId);
    expect(v2Payload.keyVersion).toBe(2);

    expect(await cipher.decrypt(v1Payload, accountId)).toBe('soja');
    expect(await cipher.decrypt(v2Payload, accountId)).toBe('soja');
  });

  it('P02c: EnvOrFileKeyProvider loads rotated keys from a JSON key file or env vars and rejects invalid lengths', async () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'panelada-keys-'));
    try {
      const keyFilePath = path.join(tempDir, 'keys.json');
      writeFileSync(
        keyFilePath,
        JSON.stringify({
          currentVersion: 2,
          keys: {
            '1': makeKeyBase64(0x11),
            '2': makeKeyBase64(0x22),
          },
        }),
      );

      const fileProvider = EnvOrFileKeyProvider.fromEnv({
        FIELD_ENCRYPTION_KEYS_FILE: keyFilePath,
      });
      const current = await fileProvider.getCurrentKey();
      const previous = await fileProvider.getKeyByVersion(1);
      expect(current.version).toBe(2);
      expect(current.key).toEqual(Buffer.alloc(32, 0x22));
      expect(previous.version).toBe(1);
      expect(previous.key).toEqual(Buffer.alloc(32, 0x11));

      const envProvider = EnvOrFileKeyProvider.fromEnv({
        FIELD_ENCRYPTION_KEY: makeKeyBase64(0x33),
        FIELD_ENCRYPTION_KEY_VERSION: '3',
      });
      const envKey = await envProvider.getCurrentKey();
      expect(envKey.version).toBe(3);
      expect(envKey.key).toEqual(Buffer.alloc(32, 0x33));

      expect(() =>
        EnvOrFileKeyProvider.fromEnv({
          FIELD_ENCRYPTION_KEY: Buffer.from('too-short').toString('base64'),
        }),
      ).toThrow(/32 bytes/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('FieldCipher length-hiding padding (A05, ADR-006 item 3, #116)', () => {
  const accountId = '77777777-7777-4777-8777-777777777777';

  function makeCipher(key: Buffer = randomBytes(32)): AesGcmFieldCipher {
    return new AesGcmFieldCipher(new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: key } }));
  }

  it('A05: shortest, typical and longest restriction codes all produce a 32-byte ciphertext', async () => {
    const cipher = makeCipher();

    for (const code of ['ovo', 'leite', 'trigo_centeio_cevada_aveia']) {
      const encrypted = await cipher.encrypt(code, accountId);
      expect(Buffer.from(encrypted.ciphertext, 'base64')).toHaveLength(32);
      expect(encrypted.ciphertext).toHaveLength(44);
    }
  });

  it('A05: every ALLERGEN_CODES entry encrypts to 32 bytes and round-trips', async () => {
    const cipher = makeCipher();
    expect(ALLERGEN_CODES).toHaveLength(19);

    for (const code of ALLERGEN_CODES) {
      const encrypted = await cipher.encrypt(code, accountId);
      expect(Buffer.from(encrypted.ciphertext, 'base64')).toHaveLength(32);
      expect(await cipher.decrypt(encrypted, accountId)).toBe(code);
    }
  });

  it('pads at the 32-byte block boundary: 32 bytes stay 32, 33 bytes become 64', async () => {
    const cipher = makeCipher();
    const exactBlock = 'a'.repeat(32);
    const overBlock = 'a'.repeat(33);

    const exact = await cipher.encrypt(exactBlock, accountId);
    const over = await cipher.encrypt(overBlock, accountId);

    expect(Buffer.from(exact.ciphertext, 'base64')).toHaveLength(32);
    expect(Buffer.from(over.ciphertext, 'base64')).toHaveLength(64);
    expect(await cipher.decrypt(exact, accountId)).toBe(exactBlock);
    expect(await cipher.decrypt(over, accountId)).toBe(overBlock);
  });

  it('decrypts legacy payloads written without padding (no migration needed)', async () => {
    const key = randomBytes(32);
    const cipher = makeCipher(key);

    // Reproduces the pre-#116 cipher: AES-256-GCM over the raw UTF-8 code, no padding.
    const iv = randomBytes(12);
    const legacy = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    legacy.setAAD(Buffer.from(accountId, 'utf8'));
    const ciphertext = Buffer.concat([legacy.update('leite', 'utf8'), legacy.final()]);
    expect(ciphertext).toHaveLength(5);

    const decrypted = await cipher.decrypt(
      {
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: legacy.getAuthTag().toString('base64'),
        keyVersion: 1,
      },
      accountId,
    );
    expect(decrypted).toBe('leite');
  });

  it('A13: fails closed on empty or NUL-containing plaintext without echoing it', async () => {
    const cipher = makeCipher();

    await expect(cipher.encrypt('', accountId)).rejects.toThrow(Error);

    const withNul = 'amendoim\u0000secreto';
    const error: unknown = await cipher.encrypt(withNul, accountId).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain('amendoim');
    expect((error as Error).message).not.toContain('secreto');
  });
});
