/**
 * PhotoManager (ADR-012 item 6 and the 23/11/2026 detail): recipe photos are WebP files named by
 * the SHA-256 of their content, stored in persistent app storage — outside the encrypted database
 * (ADR-005, they hold no personal data) and outside the OS cache, which may be purged and would
 * break offline recipes.
 */
export interface PhotoManager {
  /** `file://` URI of the local copy, or null when it has not been downloaded. */
  getLocalUri(hash: string): Promise<string | null>;
  /** Downloads missing photos. Network failures throw; a corrupt or missing photo is skipped. */
  ensureDownloaded(hashes: readonly string[]): Promise<PhotoDownloadReport>;
  /** Deletes photos no longer referenced by any downloaded recipe. */
  prune(keepHashes: readonly string[]): Promise<void>;
}

export interface PhotoDownloadReport {
  readonly downloaded: readonly string[];
  readonly skipped: readonly {
    readonly hash: string;
    readonly reason: 'not-found' | 'integrity';
  }[];
}

/** File-system operations the manager needs; the adapter maps them onto expo-file-system. */
export interface PhotoFileSystem {
  readonly directory: string;
  ensureDirectory(): Promise<void>;
  exists(uri: string): Promise<boolean>;
  /** Returns the HTTP status; rejects only when the network is unreachable. */
  download(url: string, toUri: string, headers?: Readonly<Record<string, string>>): Promise<number>;
  move(fromUri: string, toUri: string): Promise<void>;
  delete(uri: string): Promise<void>;
  list(): Promise<readonly string[]>;
  sha256Hex(uri: string): Promise<string>;
}

export interface PhotoManagerDeps {
  readonly fs: PhotoFileSystem;
  /** Demo: `{API}/v1/photos/{hash}`; cloud: static Storage URL (ADR-012 item 5). */
  readonly resolveUrl: (hash: string) => string;
  /**
   * Headers for each download. The demo route `GET /v1/photos/{hash}` inherits the contract's
   * global bearerAuth; the cloud target serves static URLs and needs none.
   */
  readonly requestHeaders?: () => Promise<Readonly<Record<string, string>>>;
}

const SHA256_HEX = /^[0-9a-f]{64}$/;

export function createPhotoManager({
  fs,
  resolveUrl,
  requestHeaders,
}: PhotoManagerDeps): PhotoManager {
  const uriFor = (hash: string) => `${fs.directory}${hash}.webp`;

  return {
    async getLocalUri(hash) {
      if (!SHA256_HEX.test(hash)) return null;
      const uri = uriFor(hash);
      return (await fs.exists(uri)) ? uri : null;
    },

    async ensureDownloaded(hashes) {
      await fs.ensureDirectory();
      const downloaded: string[] = [];
      const skipped: { hash: string; reason: 'not-found' | 'integrity' }[] = [];

      for (const hash of new Set(hashes)) {
        // The hash becomes a file name: accept only real SHA-256 hex to rule out path tricks.
        if (!SHA256_HEX.test(hash)) {
          skipped.push({ hash, reason: 'integrity' });
          continue;
        }
        const target = uriFor(hash);
        if (await fs.exists(target)) continue; // immutable by hash: present means current

        // Download beside the target and move only once verified, so a crash never leaves a
        // truncated file under the final name.
        const partial = `${target}.part`;
        const status = await fs.download(resolveUrl(hash), partial, await requestHeaders?.());
        if (status !== 200) {
          await fs.delete(partial);
          skipped.push({ hash, reason: 'not-found' });
          continue;
        }
        if ((await fs.sha256Hex(partial)) !== hash) {
          await fs.delete(partial);
          skipped.push({ hash, reason: 'integrity' });
          continue;
        }
        await fs.move(partial, target);
        downloaded.push(hash);
      }

      return { downloaded, skipped };
    },

    async prune(keepHashes) {
      const keep = new Set(keepHashes.map((hash) => `${hash}.webp`));
      for (const name of await fs.list()) {
        if (!keep.has(name)) {
          await fs.delete(`${fs.directory}${name}`);
        }
      }
    },
  };
}
