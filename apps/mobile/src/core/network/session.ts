import type { HttpClient } from './http-client';
import type { TokenStore } from './token-store';

export interface SessionGate {
  /** Creates an anonymous account on first use (RNF02, ADR-007); no-op when a session exists. */
  ensureSession(): Promise<void>;
}

export function createSessionGate(http: HttpClient, tokens: TokenStore): SessionGate {
  let pending: Promise<void> | null = null;

  return {
    ensureSession() {
      // Two screens asking at once must not create two anonymous accounts.
      pending ??= (async () => {
        if (await tokens.read()) {
          return;
        }
        const { data } = await http.call('createAnonymousAccount', {});
        if (!data) {
          throw new Error('Anonymous account creation returned no tokens.');
        }
        await tokens.write(data.tokens);
      })().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
