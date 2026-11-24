import { createPhotoManager, type PhotoFileSystem } from '../../src/core/photos/photo-manager';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const DIR = 'file:///docs/photos/';

/** In-memory file system whose files "contain" the hash the server said they have. */
function memoryFs(serverFiles: Record<string, { status: number; contentHash?: string }>) {
  const files = new Map<string, string>();
  const downloads: string[] = [];
  const fs: PhotoFileSystem = {
    directory: DIR,
    ensureDirectory: async () => undefined,
    exists: async (uri) => files.has(uri),
    download: async (url, toUri) => {
      downloads.push(url);
      const hash = url.split('/').pop()!;
      const remote = serverFiles[hash] ?? { status: 404 };
      if (remote.status === 200) files.set(toUri, remote.contentHash ?? hash);
      return remote.status;
    },
    move: async (from, to) => {
      files.set(to, files.get(from)!);
      files.delete(from);
    },
    delete: async (uri) => {
      files.delete(uri);
    },
    list: async () => [...files.keys()].map((uri) => uri.replace(DIR, '')),
    sha256Hex: async (uri) => files.get(uri)!,
  };
  return { fs, files, downloads };
}

const resolveUrl = (hash: string) => `http://api.test/v1/photos/${hash}`;

describe('PhotoManager (ADR-012: WebP by SHA-256, persistent offline storage)', () => {
  it('downloads missing photos once and serves them from disk afterwards', async () => {
    const { fs, downloads } = memoryFs({ [HASH_A]: { status: 200 } });
    const photos = createPhotoManager({ fs, resolveUrl });

    const first = await photos.ensureDownloaded([HASH_A, HASH_A]);
    await photos.ensureDownloaded([HASH_A]);

    expect(first.downloaded).toEqual([HASH_A]);
    expect(downloads).toHaveLength(1);
    expect(await photos.getLocalUri(HASH_A)).toBe(`${DIR}${HASH_A}.webp`);
  });

  it('discards a file whose content does not match its hash name', async () => {
    const { fs, files } = memoryFs({ [HASH_A]: { status: 200, contentHash: HASH_B } });
    const photos = createPhotoManager({ fs, resolveUrl });

    const report = await photos.ensureDownloaded([HASH_A]);

    expect(report.skipped).toEqual([{ hash: HASH_A, reason: 'integrity' }]);
    expect(files.size).toBe(0);
  });

  it('skips a photo the server does not have without failing the batch', async () => {
    const { fs } = memoryFs({ [HASH_B]: { status: 200 } });
    const photos = createPhotoManager({ fs, resolveUrl });

    const report = await photos.ensureDownloaded([HASH_A, HASH_B]);

    expect(report).toEqual({
      downloaded: [HASH_B],
      skipped: [{ hash: HASH_A, reason: 'not-found' }],
    });
  });

  it('refuses names that are not SHA-256 hex (no path traversal)', async () => {
    const { fs, downloads } = memoryFs({});
    const photos = createPhotoManager({ fs, resolveUrl });

    const report = await photos.ensureDownloaded(['../../databases/panelada']);

    expect(report.skipped[0]?.reason).toBe('integrity');
    expect(downloads).toHaveLength(0);
  });

  it('prunes photos no longer referenced', async () => {
    const { fs, files } = memoryFs({ [HASH_A]: { status: 200 }, [HASH_B]: { status: 200 } });
    const photos = createPhotoManager({ fs, resolveUrl });
    await photos.ensureDownloaded([HASH_A, HASH_B]);

    await photos.prune([HASH_B]);

    expect([...files.keys()]).toEqual([`${DIR}${HASH_B}.webp`]);
  });
});
