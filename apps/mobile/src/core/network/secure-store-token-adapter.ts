import * as SecureStore from 'expo-secure-store';
import type { TokenPair, TokenStore } from './token-store';

const TOKENS_KEY = 'panelada.session.tokens.v1';

/** Session tokens in expo-secure-store, kept off backups and other devices (ADR-007, A5). */
export function createSecureStoreTokenStore(): TokenStore {
  const options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  return {
    async read() {
      const raw = await SecureStore.getItemAsync(TOKENS_KEY, options);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as TokenPair;
      } catch {
        // A corrupt entry is equivalent to no session; the app signs in again anonymously.
        return null;
      }
    },
    write: (pair) => SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(pair), options),
    clear: () => SecureStore.deleteItemAsync(TOKENS_KEY, options),
  };
}
