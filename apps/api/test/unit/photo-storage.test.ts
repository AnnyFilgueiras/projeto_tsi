import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InMemoryPhotoStorage,
  LocalDiskPhotoStorage,
  SupabasePhotoStorage,
  type PhotoStorage,
} from '../../src/modules/catalog/public/photo-storage.js';
import {
  isWebpBuffer,
  MAX_PHOTO_DIMENSION_PX,
  processDishPhoto,
} from '../../src/modules/importer/internal/photo-processor.js';

function runPhotoStorageContractSuite(
  name: string,
  factory: () => Promise<{ storage: PhotoStorage; cleanup?: () => Promise<void> }>,
) {
  describe(`PhotoStorage contract suite — ${name} (P02f, ADR-012)`, () => {
    let cleanup: (() => Promise<void>) | undefined;

    afterEach(async () => {
      if (cleanup) {
        await cleanup();
        cleanup = undefined;
      }
    });

    it('stores and retrieves WebP bytes idempotently by 64-char SHA-256 hash', async () => {
      const ctx = await factory();
      cleanup = ctx.cleanup;

      const webp = await sharp({
        create: { width: 16, height: 16, channels: 3, background: { r: 220, g: 120, b: 40 } },
      })
        .webp()
        .toBuffer();
      const hash = createHash('sha256').update(webp).digest('hex');

      expect(await ctx.storage.get(hash)).toBeNull();

      await ctx.storage.save(hash, webp);
      await ctx.storage.save(hash, webp);

      const loaded = await ctx.storage.get(hash);
      expect(loaded).not.toBeNull();
      expect(loaded?.contentType).toBe('image/webp');
      expect(loaded?.bytes.equals(webp)).toBe(true);
    });

    it('rejects malformed hashes to prevent path traversal', async () => {
      const ctx = await factory();
      cleanup = ctx.cleanup;

      await expect(ctx.storage.get('../etc/passwd')).rejects.toThrow();
      await expect(ctx.storage.save('not-a-sha256', Buffer.from('abc'))).rejects.toThrow();
    });
  });
}

runPhotoStorageContractSuite('InMemoryPhotoStorage', async () => ({
  storage: new InMemoryPhotoStorage(),
}));

runPhotoStorageContractSuite('LocalDiskPhotoStorage', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'panelada-photos-test-'));
  return {
    storage: new LocalDiskPhotoStorage(dir),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
});

runPhotoStorageContractSuite('SupabasePhotoStorage', async () => {
  const objects = new Map<string, Buffer>();
  const mockFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = url.split('/storage/v1/object/')[1] ?? '';

    if (method === 'POST') {
      const body = init?.body;
      const bytes = Buffer.isBuffer(body)
        ? body
        : body instanceof Uint8Array
          ? Buffer.from(body)
          : Buffer.from(String(body ?? ''));
      objects.set(key, bytes);
      return new Response(JSON.stringify({ Key: key }), { status: 200 });
    }

    const found = objects.get(key);
    if (!found) {
      return new Response(JSON.stringify({ statusCode: '404', error: 'not_found' }), {
        status: 404,
      });
    }
    return new Response(new Uint8Array(found), {
      status: 200,
      headers: { 'content-type': 'image/webp' },
    });
  });

  return {
    storage: new SupabasePhotoStorage({
      supabaseUrl: 'https://demo.supabase.co',
      serviceRoleKey: 'test-service-role-key',
      bucket: 'dish-photos',
      fetchImpl: mockFetch as unknown as typeof fetch,
    }),
  };
});

describe('PhotoProcessor (ADR-012)', () => {
  it('converts JPEG fixtures (including Bruno dish-example.jpg) into WebP with SHA-256 hash', async () => {
    const fixturePath = path.resolve(
      process.cwd(),
      '../../docs/fase2/04-contratos/bruno/panelada-curadoria/fixtures/dish-example.jpg',
    );
    const jpegBytes = await readFile(fixturePath);

    const processed = await processDishPhoto(jpegBytes);
    expect(isWebpBuffer(processed.webpBytes)).toBe(true);
    expect(processed.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(processed.hash).toBe(createHash('sha256').update(processed.webpBytes).digest('hex'));
  });

  it('resizes oversized images to fit within MAX_PHOTO_DIMENSION_PX preserving aspect ratio', async () => {
    const bigPng = await sharp({
      create: { width: 2048, height: 1024, channels: 3, background: { r: 30, g: 140, b: 90 } },
    })
      .png()
      .toBuffer();

    const processed = await processDishPhoto(bigPng);
    const meta = await sharp(processed.webpBytes).metadata();

    expect(isWebpBuffer(processed.webpBytes)).toBe(true);
    expect(meta.width).toBe(MAX_PHOTO_DIMENSION_PX);
    expect(meta.height).toBe(512);
  });

  it('rejects unsupported file formats (non-image magic bytes) with 415 ProblemError', async () => {
    const plainText = Buffer.from('<svg><script>alert(1)</script></svg>', 'utf8');

    await expect(processDishPhoto(plainText)).rejects.toMatchObject({
      problem: {
        status: 415,
        type: 'unsupported-media-type',
      },
    });
  });
});
