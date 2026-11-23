import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PhotoStorage, StoredPhoto } from '../public/photo-storage.js';

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

export function assertValidPhotoHash(hash: string): void {
  if (!SHA256_HEX_REGEX.test(hash)) {
    throw new Error('Invalid photo hash: expected a 64-character lowercase SHA-256 hex digest.');
  }
}

/**
 * Local disk photo storage adapter for Docker Compose and local development (P02f, ADR-012).
 */
export class LocalDiskPhotoStorage implements PhotoStorage {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = path.resolve(directory);
  }

  private resolveTargetPath(hash: string): string {
    assertValidPhotoHash(hash);
    return path.join(this.directory, `${hash}.webp`);
  }

  async save(hash: string, webpBytes: Buffer): Promise<void> {
    const targetPath = this.resolveTargetPath(hash);
    await mkdir(this.directory, { recursive: true });

    // Write to a sibling temp file then atomically rename so concurrent readers never observe partial files.
    const tmpPath = `${targetPath}.tmp-${process.pid}-${randomBytes(6).toString('hex')}`;
    try {
      await writeFile(tmpPath, webpBytes);
      await rename(tmpPath, targetPath);
    } catch (error) {
      await unlink(tmpPath).catch(() => undefined);
      throw error;
    }
  }

  async get(hash: string): Promise<StoredPhoto | null> {
    const targetPath = this.resolveTargetPath(hash);
    try {
      const bytes = await readFile(targetPath);
      return {
        bytes,
        contentType: 'image/webp',
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

export interface SupabasePhotoStorageConfig {
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
  readonly bucket: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Supabase Object Storage adapter over direct HTTP REST (P02f, ADR-012, Option 4C).
 * Uses native fetch without any client BaaS SDK.
 */
export class SupabasePhotoStorage implements PhotoStorage {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: SupabasePhotoStorageConfig) {
    this.baseUrl = config.supabaseUrl.replace(/\/+$/, '');
    this.serviceRoleKey = config.serviceRoleKey;
    this.bucket = config.bucket;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private objectUrl(hash: string): string {
    assertValidPhotoHash(hash);
    return `${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${hash}.webp`;
  }

  async save(hash: string, webpBytes: Buffer): Promise<void> {
    const response = await this.fetchImpl(this.objectUrl(hash), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
        'cache-control': 'public, max-age=31536000, immutable',
      },
      body: new Uint8Array(webpBytes),
    });

    if (!response.ok) {
      throw new Error(`Supabase photo upload failed with HTTP ${response.status}.`);
    }
  }

  async get(hash: string): Promise<StoredPhoto | null> {
    const response = await this.fetchImpl(this.objectUrl(hash), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Supabase photo fetch failed with HTTP ${response.status}.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      bytes: Buffer.from(arrayBuffer),
      contentType: 'image/webp',
    };
  }
}

/**
 * In-memory PhotoStorage fake for deterministic unit and HTTP integration tests.
 */
export class InMemoryPhotoStorage implements PhotoStorage {
  private readonly store = new Map<string, Buffer>();

  async save(hash: string, webpBytes: Buffer): Promise<void> {
    assertValidPhotoHash(hash);
    this.store.set(hash, Buffer.from(webpBytes));
  }

  async get(hash: string): Promise<StoredPhoto | null> {
    assertValidPhotoHash(hash);
    const bytes = this.store.get(hash);
    if (!bytes) {
      return null;
    }
    return {
      bytes: Buffer.from(bytes),
      contentType: 'image/webp',
    };
  }
}

export function createPhotoStorageFromEnv(env: NodeJS.ProcessEnv = process.env): PhotoStorage {
  const driver = (env.PHOTO_STORAGE_DRIVER ?? 'local').trim().toLowerCase();

  if (driver === 'supabase') {
    const supabaseUrl = env.SUPABASE_URL?.trim();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const bucket = (env.SUPABASE_PHOTOS_BUCKET ?? 'dish-photos').trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when PHOTO_STORAGE_DRIVER=supabase.',
      );
    }
    return new SupabasePhotoStorage({ supabaseUrl, serviceRoleKey, bucket });
  }

  if (driver !== 'local') {
    throw new Error(
      `Unsupported PHOTO_STORAGE_DRIVER "${driver}". Expected "local" or "supabase".`,
    );
  }

  const dir = env.PHOTO_STORAGE_DIR?.trim() || path.resolve(process.cwd(), '.data/photos');
  return new LocalDiskPhotoStorage(dir);
}
