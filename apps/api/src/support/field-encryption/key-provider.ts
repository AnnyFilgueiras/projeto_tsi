import { readFileSync } from 'node:fs';

export const AES_256_KEY_BYTES = 32;

/**
 * Versioned 256-bit encryption key returned by a KeyProvider (P02c, ADR-006).
 */
export interface EncryptionKeyRecord {
  readonly version: number;
  readonly key: Buffer;
}

/**
 * Port isolating key storage (env/file in local dev vs Secret Manager in cloud) from FieldCipher (P02c).
 */
export interface KeyProvider {
  getCurrentKey(): Promise<EncryptionKeyRecord>;
  getKeyByVersion(version: number): Promise<EncryptionKeyRecord>;
}

export class KeyProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyProviderError';
  }
}

function assertValidKeyVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new KeyProviderError(
      `Invalid encryption key version: ${version}. Expected integer >= 1.`,
    );
  }
}

function assertKeyLength(key: Buffer, version: number): Buffer {
  if (key.length !== AES_256_KEY_BYTES) {
    throw new KeyProviderError(
      `Encryption key version ${version} must be exactly ${AES_256_KEY_BYTES} bytes (256 bits).`,
    );
  }
  return Buffer.from(key);
}

const STRICT_BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

function decodeKeyMaterial(encoded: string, version: number): Buffer {
  const trimmed = encoded.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return assertKeyLength(Buffer.from(trimmed, 'hex'), version);
  }
  if (trimmed.length % 4 !== 0 || !STRICT_BASE64_REGEX.test(trimmed)) {
    throw new KeyProviderError(
      `Encryption key version ${version} must be valid base64 or 64-char hex.`,
    );
  }
  const decoded = Buffer.from(trimmed, 'base64');
  if (decoded.toString('base64') !== trimmed) {
    throw new KeyProviderError(
      `Encryption key version ${version} must be canonical base64 or 64-char hex.`,
    );
  }
  return assertKeyLength(decoded, version);
}

export interface InMemoryKeyProviderOptions {
  readonly currentVersion: number;
  readonly keys: Readonly<Record<number, Buffer>>;
}

/**
 * Deterministic in-memory KeyProvider fake for unit and integration tests (P02c).
 */
export class InMemoryKeyProvider implements KeyProvider {
  private currentVersion: number;
  private readonly keys = new Map<number, Buffer>();

  constructor(options: InMemoryKeyProviderOptions) {
    assertValidKeyVersion(options.currentVersion);
    for (const [rawVersion, rawKey] of Object.entries(options.keys)) {
      const version = Number(rawVersion);
      assertValidKeyVersion(version);
      this.keys.set(version, assertKeyLength(rawKey, version));
    }
    if (!this.keys.has(options.currentVersion)) {
      throw new KeyProviderError(
        `Current key version ${options.currentVersion} is missing from configured keys.`,
      );
    }
    this.currentVersion = options.currentVersion;
  }

  setCurrentVersion(version: number): void {
    assertValidKeyVersion(version);
    if (!this.keys.has(version)) {
      throw new KeyProviderError(`Cannot rotate to unknown encryption key version ${version}.`);
    }
    this.currentVersion = version;
  }

  async getCurrentKey(): Promise<EncryptionKeyRecord> {
    const key = this.keys.get(this.currentVersion);
    if (!key) {
      throw new KeyProviderError(`Encryption key version ${this.currentVersion} not found.`);
    }
    return { version: this.currentVersion, key: Buffer.from(key) };
  }

  async getKeyByVersion(version: number): Promise<EncryptionKeyRecord> {
    assertValidKeyVersion(version);
    const key = this.keys.get(version);
    if (!key) {
      throw new KeyProviderError(`Encryption key version ${version} not found.`);
    }
    return { version, key: Buffer.from(key) };
  }
}

interface KeyFileSchema {
  readonly currentVersion: number;
  readonly keys: Readonly<Record<string, string>>;
}

// Non-secret deterministic key used only when NODE_ENV is development or test and no key env is provided.
const DEV_FALLBACK_KEY_BASE64 = Buffer.alloc(AES_256_KEY_BYTES, 0x42).toString('base64');

/**
 * Production/dev KeyProvider adapter reading versioned 256-bit keys from a JSON secret file
 * (`FIELD_ENCRYPTION_KEYS_FILE`) or environment variables (`FIELD_ENCRYPTION_KEYS` / `FIELD_ENCRYPTION_KEY`)
 * so encryption keys always stay outside PostgreSQL (ADR-006, P02c).
 */
export class EnvOrFileKeyProvider implements KeyProvider {
  private readonly inner: InMemoryKeyProvider;

  private constructor(inner: InMemoryKeyProvider) {
    this.inner = inner;
  }

  static fromEnv(
    env: Readonly<Record<string, string | undefined>> = process.env,
  ): EnvOrFileKeyProvider {
    const keysFilePath = env.FIELD_ENCRYPTION_KEYS_FILE?.trim();
    if (keysFilePath) {
      const rawJson = readFileSync(keysFilePath, 'utf8');
      return EnvOrFileKeyProvider.fromJson(rawJson);
    }

    const keysJson = env.FIELD_ENCRYPTION_KEYS?.trim();
    if (keysJson) {
      return EnvOrFileKeyProvider.fromJson(keysJson);
    }

    const singleKey = env.FIELD_ENCRYPTION_KEY?.trim();
    if (singleKey) {
      const version = Number(env.FIELD_ENCRYPTION_KEY_VERSION ?? '1');
      assertValidKeyVersion(version);
      return new EnvOrFileKeyProvider(
        new InMemoryKeyProvider({
          currentVersion: version,
          keys: { [version]: decodeKeyMaterial(singleKey, version) },
        }),
      );
    }

    // ADR-006: Only allow dev fallback key in explicit development/test environments.
    if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
      throw new KeyProviderError(
        'Missing field encryption key configuration (set FIELD_ENCRYPTION_KEYS_FILE, FIELD_ENCRYPTION_KEYS, or FIELD_ENCRYPTION_KEY).',
      );
    }

    return new EnvOrFileKeyProvider(
      new InMemoryKeyProvider({
        currentVersion: 1,
        keys: { 1: decodeKeyMaterial(DEV_FALLBACK_KEY_BASE64, 1) },
      }),
    );
  }

  private static fromJson(rawJson: string): EnvOrFileKeyProvider {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new KeyProviderError('Invalid JSON format for field encryption keys.');
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as KeyFileSchema).currentVersion !== 'number' ||
      typeof (parsed as KeyFileSchema).keys !== 'object' ||
      (parsed as KeyFileSchema).keys === null
    ) {
      throw new KeyProviderError(
        'Encryption key JSON must contain numeric `currentVersion` and a `keys` version map.',
      );
    }

    const schema = parsed as KeyFileSchema;
    const decodedKeys: Record<number, Buffer> = {};
    for (const [rawVersion, encoded] of Object.entries(schema.keys)) {
      const version = Number(rawVersion);
      assertValidKeyVersion(version);
      if (typeof encoded !== 'string') {
        throw new KeyProviderError(`Key material for version ${version} must be a string.`);
      }
      decodedKeys[version] = decodeKeyMaterial(encoded, version);
    }

    return new EnvOrFileKeyProvider(
      new InMemoryKeyProvider({
        currentVersion: schema.currentVersion,
        keys: decodedKeys,
      }),
    );
  }

  getCurrentKey(): Promise<EncryptionKeyRecord> {
    return this.inner.getCurrentKey();
  }

  getKeyByVersion(version: number): Promise<EncryptionKeyRecord> {
    return this.inner.getKeyByVersion(version);
  }
}
