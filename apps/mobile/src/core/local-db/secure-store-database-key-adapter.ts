import { getRandomBytesAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { DatabaseKeyStore } from './database-key-store';

const KEY_NAME = 'panelada.localDb.key.v1';
const KEY_BYTES = 32;

/**
 * Keeps the SQLCipher key in expo-secure-store (A5: only core/local-db and core/network may
 * import it). `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps the key off backups and other devices, so a
 * restored backup of the database file alone is useless (ADR-005).
 */
export function createSecureStoreDatabaseKeyStore(): DatabaseKeyStore {
  const options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  return {
    async getOrCreateKey() {
      const stored = await SecureStore.getItemAsync(KEY_NAME, options);
      if (stored) {
        return stored;
      }
      const key = toHex(await getRandomBytesAsync(KEY_BYTES));
      await SecureStore.setItemAsync(KEY_NAME, key, options);
      return key;
    },
  };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
