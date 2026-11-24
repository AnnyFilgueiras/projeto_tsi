import type { TokenPair, TokenStore } from '../../src/core/network/token-store';

export function createFakeTokenStore(initial: TokenPair | null = null) {
  let current = initial;
  const store: TokenStore & { readonly current: TokenPair | null } = {
    get current() {
      return current;
    },
    read: async () => current,
    write: async (pair) => {
      current = pair;
    },
    clear: async () => {
      current = null;
    },
  };
  return store;
}

export function tokenPair(suffix: string, expiresAt = '2099-01-01T00:00:00.000Z'): TokenPair {
  return {
    accessToken: `access-${suffix}`,
    expiresAt,
    refreshToken: `refresh-${suffix}`,
    refreshExpiresAt: '2099-12-01T00:00:00.000Z',
  };
}
