import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PhotoStorage, StoredPhoto } from '../public/photo-storage.js';

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;
// A hung Storage request would otherwise hold the HTTP handler until the platform kills it.
export const DEFAULT_PHOTO_STORAGE_TIMEOUT_MS = 10_000;

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
  readonly timeoutMs?: number;
}

// Supabase error bodies carry the cause ("Bucket not found", RLS denial) and never echo our
// headers, so a short excerpt makes a misconfigured deploy diagnosable from the log alone.
async function describeFailure(response: Response): Promise<string> {
  const body = await response.text().catch(() => '');
  const excerpt = body.replace(/\s+/g, ' ').trim().slice(0, 200);
  return excerpt ? `HTTP ${response.status}: ${excerpt}` : `HTTP ${response.status}`;
}

async function isLegacyNotFound(response: Response): Promise<boolean> {
  // Supabase Storage historically answers a missing object with HTTP 400 and a body whose
  // `statusCode` is "404"; only that shape means "absent", any other 400 is a real error.
  try {
    const body = (await response.json()) as { statusCode?: unknown; error?: unknown };
    return body.statusCode === '404' || body.error === 'not_found';
  } catch {
    return false;
  }
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
  private readonly timeoutMs: number;

  constructor(config: SupabasePhotoStorageConfig) {
    this.baseUrl = config.supabaseUrl.replace(/\/+$/, '');
    this.serviceRoleKey = config.serviceRoleKey;
    this.bucket = config.bucket;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_PHOTO_STORAGE_TIMEOUT_MS;
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
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Supabase photo upload failed with ${await describeFailure(response)}.`);
    }
  }

  async get(hash: string): Promise<StoredPhoto | null> {
    const response = await this.fetchImpl(this.objectUrl(hash), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 400 && (await isLegacyNotFound(response.clone()))) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Supabase photo fetch failed with ${await describeFailure(response)}.`);
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

/**
 * Fails fast on the two Cloud 4C misconfigurations that otherwise surface only as opaque
 * Storage errors at first upload: a URL with a path (every object URL 404s) and a public key
 * (RLS hides the private bucket). Only the key's public `role` claim is read, never logged.
 */
function assertSupabaseConfig(supabaseUrl: string, key: string): void {
  let url: URL;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error('SUPABASE_URL must be a valid URL, e.g. https://<project-ref>.supabase.co.');
  }
  if (url.pathname.replace(/\/+$/, '') !== '' || url.search || url.hash) {
    throw new Error(
      'SUPABASE_URL must be the project URL without a path, e.g. https://<project-ref>.supabase.co.',
    );
  }

  if (key.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY holds a publishable key; use the secret (sb_secret_) or service_role key.',
    );
  }
  if (key.startsWith('eyJ')) {
    let role: unknown;
    try {
      const payload = key.split('.')[1] ?? '';
      role = (JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: unknown })
        .role;
    } catch {
      role = undefined;
    }
    if (role !== 'service_role') {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY has role "${String(role)}"; the private photo bucket needs the service_role key.`,
      );
    }
  }
}

export function createPhotoStorageFromEnv(env: NodeJS.ProcessEnv = process.env): PhotoStorage {
  const driver = (env.PHOTO_STORAGE_DRIVER ?? 'local').trim().toLowerCase();

  if (driver === 'supabase') {
    const supabaseUrl = env.SUPABASE_URL?.trim();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const bucket = (env.SUPABASE_PHOTOS_BUCKET ?? 'dish-photos').trim();
    const timeoutRaw = env.PHOTO_STORAGE_TIMEOUT_MS?.trim();
    const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_PHOTO_STORAGE_TIMEOUT_MS;
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('PHOTO_STORAGE_TIMEOUT_MS must be a positive integer (milliseconds).');
    }
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when PHOTO_STORAGE_DRIVER=supabase.',
      );
    }
    assertSupabaseConfig(supabaseUrl, serviceRoleKey);
    return new SupabasePhotoStorage({ supabaseUrl, serviceRoleKey, bucket, timeoutMs });
  }

  if (driver !== 'local') {
    throw new Error(
      `Unsupported PHOTO_STORAGE_DRIVER "${driver}". Expected "local" or "supabase".`,
    );
  }

  const dir = env.PHOTO_STORAGE_DIR?.trim() || path.resolve(process.cwd(), '.data/photos');
  return new LocalDiskPhotoStorage(dir);
}
