import type { AllergenState } from '@panelada/allergen-rules/rules';
import type { components } from '../../../core/network/openapi.generated';
import { pickCuriosityHint, type CuriosityHint, type HintContext } from './pick-curiosity-hint';

export type SuggestionItem = components['schemas']['SuggestionItem'];
export type Difficulty = components['schemas']['Difficulty'];

/** How a remote call ended, already stripped of transport details by the data layer. */
export type RemoteResult<T> =
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'offline' }
  | { readonly status: 'failed' };

/** Suggestion endpoints (implemented by `data/suggestions-gateway`). */
export interface SuggestionsGateway {
  fetchRound(limit: number): Promise<RemoteResult<readonly SuggestionItem[]>>;
  approve(suggestionId: string, idempotencyKey: string): Promise<RemoteResult<SuggestionItem>>;
  discard(suggestionId: string, idempotencyKey: string): Promise<RemoteResult<void>>;
}

/** Local copy reads/writes (implemented by `data/suggestions-local-store`). */
export interface SuggestionsLocalStore {
  saveCandidate(item: SuggestionItem): Promise<void>;
  readHintContext(): Promise<HintContext>;
  hasRestrictions(): Promise<boolean>;
}

/** Resolves a dish photo to a local file, downloading it when possible; null → placeholder. */
export interface DishPhotos {
  localUri(photoHash: string): Promise<string | null>;
}

export interface SuggestionCardData {
  readonly suggestionId: string;
  readonly dishId: string;
  readonly name: string;
  /** Null until the catalog index has been synced. */
  readonly cuisineName: string | null;
  readonly prepTimeMinutes: number;
  readonly difficulty: Difficulty;
  readonly allergenState: AllergenState;
  readonly photoHash: string | null;
  readonly hint: CuriosityHint | null;
}

export interface RoundSnapshot {
  readonly cards: readonly SuggestionCardData[];
  /** 1-based position of the first card within the round ("2 de 5"). */
  readonly position: number;
  readonly total: number;
  readonly hasRestrictions: boolean;
}

export type LoadOutcome =
  | ({ readonly status: 'ready' } & RoundSnapshot)
  | { readonly status: 'offline' }
  | { readonly status: 'failed' };

export type ActionOutcome = 'done' | 'offline' | 'failed';

export interface SuggestionRound {
  /** LoadSuggestions: fetches the round once per app session, then serves it from memory. */
  loadSuggestions(): Promise<LoadOutcome>;
  /** ApproveSuggestion: on 2xx stores the candidate locally and advances; otherwise keeps it. */
  approveSuggestion(suggestionId: string): Promise<ActionOutcome>;
  /** DiscardSuggestion: on 2xx advances; the dish does not return this session (RN11). */
  discardSuggestion(suggestionId: string): Promise<ActionOutcome>;
  snapshot(): RoundSnapshot;
  photoUri(photoHash: string): Promise<string | null>;
  /**
   * Drops the round kept in memory so the next load asks the server again: a restriction or
   * preference change makes the current cards stale (RN08, RN10).
   */
  invalidate(): void;
  /** Bumps on every `invalidate`, so a screen can tell its cards came from an older round. */
  version(): number;
}

export interface SuggestionRoundDeps {
  readonly gateway: SuggestionsGateway;
  readonly store: SuggestionsLocalStore;
  readonly photos: DishPhotos;
  /** UUID v7 generator for the contract's Idempotency-Key header. */
  readonly newIdempotencyKey: () => string;
}

// Decided in #79: a short round keeps the choice light (one card at a time, A03).
export const ROUND_SIZE = 5;

export function createSuggestionRound(deps: SuggestionRoundDeps): SuggestionRound {
  let loaded = false;
  let cards: SuggestionCardData[] = [];
  let total = 0;
  let hasRestrictions = false;
  let generation = 0;
  // One key per (action, suggestion): a retry after a lost response must not apply twice (P05).
  const keys = new Map<string, string>();

  const snapshot = (): RoundSnapshot => ({
    cards,
    position: total - cards.length + 1,
    total,
    hasRestrictions,
  });

  const keyFor = (action: 'approve' | 'discard', suggestionId: string) => {
    const id = `${action}:${suggestionId}`;
    let key = keys.get(id);
    if (!key) {
      key = deps.newIdempotencyKey();
      keys.set(id, key);
    }
    return key;
  };

  const advancePast = (suggestionId: string) => {
    cards = cards.filter((card) => card.suggestionId !== suggestionId);
  };

  const loadSuggestions = async (): Promise<LoadOutcome> => {
    hasRestrictions = await deps.store.hasRestrictions();
    if (!loaded) {
      const startedAt = generation;
      const result = await deps.gateway.fetchRound(ROUND_SIZE);
      if (result.status !== 'ok') return { status: result.status };
      const context = await deps.store.readHintContext();
      // Invalidated while the request was in flight: these cards predate the Profile change.
      if (startedAt !== generation) return loadSuggestions();
      // RN08: the server already filtered by restrictions; keep its list and order untouched.
      cards = result.value.map((item) => toCard(item, context));
      total = cards.length;
      loaded = true;
    }
    return { status: 'ready', ...snapshot() };
  };

  return {
    loadSuggestions,

    async approveSuggestion(suggestionId) {
      const result = await deps.gateway.approve(suggestionId, keyFor('approve', suggestionId));
      if (result.status !== 'ok') return result.status;
      try {
        await deps.store.saveCandidate({ ...result.value, status: 'candidate' });
      } catch {
        // The server already holds the candidate; the next download-set sync rewrites the copy.
      }
      advancePast(suggestionId);
      return 'done';
    },

    async discardSuggestion(suggestionId) {
      const result = await deps.gateway.discard(suggestionId, keyFor('discard', suggestionId));
      if (result.status !== 'ok') return result.status;
      advancePast(suggestionId);
      return 'done';
    },

    snapshot,

    photoUri: (photoHash) => deps.photos.localUri(photoHash),

    invalidate() {
      loaded = false;
      cards = [];
      total = 0;
      generation += 1;
    },

    version: () => generation,
  };
}

function toCard(item: SuggestionItem, context: HintContext): SuggestionCardData {
  const { dish } = item;
  return {
    suggestionId: item.id,
    dishId: dish.dishId,
    name: dish.name,
    cuisineName: context.catalog.cuisines.find((c) => c.id === dish.cuisineId)?.name ?? null,
    prepTimeMinutes: dish.prepTimeMinutes,
    difficulty: dish.difficulty,
    allergenState: dish.allergenState,
    photoHash: dish.photoHash ?? null,
    hint: pickCuriosityHint(dish, context),
  };
}
