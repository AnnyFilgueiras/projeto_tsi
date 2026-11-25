import type { ApiOperationId, HttpClient } from '../../src/core/network/http-client';
import { HttpError, NetworkUnavailableError } from '../../src/core/network/http-errors';
import type { components } from '../../src/core/network/openapi.generated';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createSuggestionsGateway } from '../../src/features/suggestions/data/suggestions-gateway';
import { createSuggestionsLocalStore } from '../../src/features/suggestions/data/suggestions-local-store';
import {
  createSuggestionRound,
  type SuggestionRound,
} from '../../src/features/suggestions/domain/suggestion-round';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';

type SuggestionItem = components['schemas']['SuggestionItem'];

const THAI = '00000000-0000-4000-8000-0000000000c1';

function item(n: number): SuggestionItem {
  return {
    id: `s-${n}`,
    status: 'presented',
    dish: {
      dishId: `d-${n}`,
      name: `Prato ${n}`,
      cuisineId: THAI,
      prepTimeMinutes: 30,
      difficulty: 'easy',
      allergenState: 'verified',
    },
  };
}

interface Call {
  readonly operationId: ApiOperationId;
  readonly options: Record<string, unknown>;
}

/** HttpClient double answering by operationId; a handler may throw to simulate failures. */
function fakeHttp(handlers: Partial<Record<ApiOperationId, (call: Call) => unknown>>) {
  const calls: Call[] = [];
  const http: HttpClient = {
    async call(operationId, options) {
      const call = { operationId, options: options as Record<string, unknown> };
      calls.push(call);
      const handler = handlers[operationId];
      if (!handler) throw new Error(`Unexpected call ${operationId}`);
      return { status: 200, data: (await handler(call)) as never };
    },
  };
  return { http, calls };
}

const offline = () => {
  throw new NetworkUnavailableError('offline');
};

describe('Suggestion round (UX-01B: LoadSuggestions, ApproveSuggestion, DiscardSuggestion)', () => {
  let db: FakeLocalDatabase;
  let keys: number;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    keys = 0;
  });

  afterEach(() => db.close());

  function round(handlers: Parameters<typeof fakeHttp>[0]): {
    round: SuggestionRound;
    calls: Call[];
  } {
    const { http, calls } = fakeHttp({
      getSuggestions: () => ({
        suggestions: [item(1), item(2), item(3)],
        noResult: false,
        minPackageVersion: '1.0.0',
      }),
      ...handlers,
    });
    return {
      calls,
      round: createSuggestionRound({
        gateway: createSuggestionsGateway({
          http,
          sessions: { ensureSession: async () => undefined },
        }),
        store: createSuggestionsLocalStore(db),
        photos: { localUri: async () => null },
        newIdempotencyKey: () => `key-${++keys}`,
      }),
    };
  }

  const candidates = () =>
    db.rows<{ suggestion_id: string; dish_id: string; data: string }>(
      'SELECT suggestion_id, dish_id, data FROM candidates_local',
    );

  it('loads one round of 5 and keeps it in memory for the app session', async () => {
    const { round: subject, calls } = round({});

    const first = await subject.loadSuggestions();
    await subject.loadSuggestions();

    expect(first).toMatchObject({ status: 'ready', total: 3 });
    expect(first.status === 'ready' && first.cards.map((card) => card.dishId)).toEqual([
      'd-1',
      'd-2',
      'd-3',
    ]);
    expect(calls.filter((call) => call.operationId === 'getSuggestions')).toHaveLength(1);
    expect(calls[0]?.options).toMatchObject({ query: { limit: 5 } });
  });

  it('keeps the server order untouched (RN08: the app never filters or reorders)', async () => {
    const { round: subject } = round({
      getSuggestions: () => ({
        suggestions: [item(3), item(1)],
        noResult: false,
        minPackageVersion: '1.0.0',
      }),
    });

    const result = await subject.loadSuggestions();

    expect(result.status === 'ready' && result.cards.map((card) => card.dishId)).toEqual([
      'd-3',
      'd-1',
    ]);
  });

  it('reports offline when the round cannot be fetched, and fetches again on retry', async () => {
    let online = false;
    const { round: subject } = round({
      getSuggestions: () => {
        if (!online) offline();
        return { suggestions: [item(1)], noResult: false, minPackageVersion: '1.0.0' };
      },
    });

    expect(await subject.loadSuggestions()).toEqual({ status: 'offline' });
    online = true;
    expect(await subject.loadSuggestions()).toMatchObject({ status: 'ready', total: 1 });
  });

  it('approve writes candidates_local only after the 2xx and advances', async () => {
    const { round: subject, calls } = round({
      approveSuggestion: () => {
        expect(candidates()).toHaveLength(0);
        return { ...item(1), status: 'candidate' };
      },
    });
    await subject.loadSuggestions();

    const outcome = await subject.approveSuggestion('s-1');

    expect(outcome).toBe('done');
    const approveCall = calls.find((call) => call.operationId === 'approveSuggestion');
    expect(approveCall?.options).toEqual({
      path: { suggestionId: 's-1' },
      header: { 'Idempotency-Key': 'key-1' },
    });
    expect(candidates()).toEqual([
      expect.objectContaining({ suggestion_id: 's-1', dish_id: 'd-1' }),
    ]);
    expect(JSON.parse(candidates()[0]!.data)).toMatchObject({ id: 's-1', status: 'candidate' });
    expect(subject.snapshot().cards.map((card) => card.suggestionId)).toEqual(['s-2', 's-3']);
  });

  it('approve offline keeps the card, writes nothing and retries with the same key', async () => {
    let online = false;
    const { round: subject, calls } = round({
      approveSuggestion: () => {
        if (!online) offline();
        return { ...item(1), status: 'candidate' };
      },
    });
    await subject.loadSuggestions();

    expect(await subject.approveSuggestion('s-1')).toBe('offline');
    expect(candidates()).toHaveLength(0);
    expect(subject.snapshot().cards[0]?.suggestionId).toBe('s-1');

    online = true;
    expect(await subject.approveSuggestion('s-1')).toBe('done');
    const keysSent = calls
      .filter((call) => call.operationId === 'approveSuggestion')
      .map((call) => (call.options.header as Record<string, string>)['Idempotency-Key']);
    expect(keysSent).toEqual(['key-1', 'key-1']);
  });

  it('approve rejected by the server keeps the card and reports failed', async () => {
    const { round: subject } = round({
      approveSuggestion: () => {
        throw new HttpError(422, undefined);
      },
    });
    await subject.loadSuggestions();

    expect(await subject.approveSuggestion('s-1')).toBe('failed');
    expect(candidates()).toHaveLength(0);
    expect(subject.snapshot().cards).toHaveLength(3);
  });

  it('discard advances and the dish never comes back in the same session (RN11)', async () => {
    const { round: subject } = round({ discardSuggestion: () => null });
    await subject.loadSuggestions();

    expect(await subject.discardSuggestion('s-1')).toBe('done');
    await subject.loadSuggestions();

    expect(subject.snapshot().cards.map((card) => card.suggestionId)).toEqual(['s-2', 's-3']);
    expect(subject.snapshot().position).toBe(2);
    expect(candidates()).toHaveLength(0);
  });

  it('discard offline keeps the card', async () => {
    const { round: subject } = round({ discardSuggestion: offline });
    await subject.loadSuggestions();

    expect(await subject.discardSuggestion('s-1')).toBe('offline');
    expect(subject.snapshot().cards[0]?.suggestionId).toBe('s-1');
  });

  it('builds card data with cuisine name, hint and restriction flag from the local copy', async () => {
    await db.execute('INSERT INTO catalog_index_local (id, data, generated_at) VALUES (1, ?, ?)', [
      JSON.stringify({
        dishes: [{ id: 'd-1', name: 'Prato 1', cuisineId: THAI, baseDishId: null }],
        cuisines: [{ id: THAI, name: 'Tailandesa', continents: ['asia'], totalDishes: 1 }],
        badgeDefinitions: [],
      }),
      '2026-11-24T00:00:00.000Z',
    ]);
    await db.execute(
      'INSERT INTO restrictions_local (restriction_type, consent_at) VALUES (?, ?)',
      ['amendoim', '2026-11-24T00:00:00.000Z'],
    );
    const { round: subject } = round({});

    const result = await subject.loadSuggestions();

    expect(result).toMatchObject({ status: 'ready', hasRestrictions: true });
    expect(result.status === 'ready' && result.cards[0]).toMatchObject({
      cuisineName: 'Tailandesa',
      hint: { kind: 'first-cuisine', cuisineName: 'Tailandesa' },
    });
  });
});
