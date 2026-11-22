export interface StoredPhoto {
  readonly bytes: Buffer;
  readonly contentType: 'image/webp';
}

/**
 * Pluggable dish photo persistence port (P02f, ADR-012).
 *
 * Implementations store immutable WebP binaries keyed strictly by their
 * 64-character lowercase SHA-256 hex digest.
 */
export interface PhotoStorage {
  save(hash: string, webpBytes: Buffer): Promise<void>;
  get(hash: string): Promise<StoredPhoto | null>;
}

export {
  createPhotoStorageFromEnv,
  InMemoryPhotoStorage,
  LocalDiskPhotoStorage,
  SupabasePhotoStorage,
  type SupabasePhotoStorageConfig,
} from '../internal/photo-storage.js';
