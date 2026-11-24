import type { components } from './openapi.generated';

export type TokenPair = components['schemas']['TokenPair'];

/** Persists the session tokens (ADR-007). The concrete adapter keeps them in expo-secure-store (A5). */
export interface TokenStore {
  read(): Promise<TokenPair | null>;
  write(pair: TokenPair): Promise<void>;
  clear(): Promise<void>;
}
