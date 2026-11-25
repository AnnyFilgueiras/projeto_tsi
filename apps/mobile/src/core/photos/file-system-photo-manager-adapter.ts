import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { createPhotoManager, type PhotoFileSystem, type PhotoManager } from './photo-manager';

/**
 * PhotoManager on expo-file-system. Uses `documentDirectory` (persistent) rather than
 * `cacheDirectory`, which Android may clear under storage pressure (ADR-012 item 6).
 */
export function createFileSystemPhotoManager(
  resolveUrl: (hash: string) => string,
  requestHeaders?: () => Promise<Readonly<Record<string, string>>>,
): PhotoManager {
  if (!FileSystem.documentDirectory) {
    throw new Error('Persistent document storage is unavailable on this platform.');
  }
  const directory = `${FileSystem.documentDirectory}photos/`;

  const fs: PhotoFileSystem = {
    directory,
    async ensureDirectory() {
      if (!(await FileSystem.getInfoAsync(directory)).exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
    },
    exists: async (uri) => (await FileSystem.getInfoAsync(uri)).exists,
    download: async (url, toUri, headers) =>
      (await FileSystem.downloadAsync(url, toUri, { headers: { ...headers } })).status,
    move: (from, to) => FileSystem.moveAsync({ from, to }),
    delete: (uri) => FileSystem.deleteAsync(uri, { idempotent: true }),
    list: () => FileSystem.readDirectoryAsync(directory),
    async sha256Hex(uri) {
      // Photos are capped at 1024 px WebP (ADR-012), small enough to hash in memory.
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const hash = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, bytes));
      return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
    },
  };

  return createPhotoManager({ fs, resolveUrl, requestHeaders });
}
