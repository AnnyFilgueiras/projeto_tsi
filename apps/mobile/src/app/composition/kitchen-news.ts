/**
 * The Kitchen tab's "news" dot (ux-onda1a §1.1 rule 4): set when a suggestion is approved,
 * cleared when the Kitchen tab gains focus. Memory only, on purpose: it is a nudge for this
 * session, not a counter to catch up on after reopening the app (RN12: no pending-work pressure).
 */
export interface KitchenNews {
  hasNews(): boolean;
  mark(): void;
  clear(): void;
  /** `useSyncExternalStore` contract: returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export function createKitchenNews(): KitchenNews {
  let news = false;
  const listeners = new Set<() => void>();

  const set = (next: boolean) => {
    if (news === next) return;
    news = next;
    for (const listener of listeners) listener();
  };

  return {
    hasNews: () => news,
    mark: () => set(true),
    clear: () => set(false),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
