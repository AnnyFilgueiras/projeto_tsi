import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createDirectOnlineOperationEnqueuer } from '../../src/core/sync/direct-online-operation-enqueuer-adapter';
import type {
  ClientOperation,
  EnqueueResult,
  OperationEnqueuer,
} from '../../src/core/sync/operation-enqueuer';
import { projectRatingRegistered } from '../../src/features/progress/data/rating-repository';
import { createProgressRepository } from '../../src/features/progress/data/progress-repository';
import { createRegisterRating } from '../../src/features/progress/domain/register-rating';
import { createFakeFetch, type FakeReply, type RecordedRequest } from '../support/fake-fetch';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';
import { BADGE, CATALOG, CUISINE, DISH, seedCatalog, seedRating, seedUnlock } from './fixtures';

const OP_ID = '0192f0a0-0000-7000-8000-000000000001';
const NOW = new Date('2026-11-23T12:00:00.000Z');
const SYNC = 'POST /v1/sync/operations';
const anyOp: ClientOperation = {
  opId: OP_ID,
  type: 'rating.register',
  createdAt: NOW.toISOString(),
  payload: { dishId: DISH.feijoada, score: 8, itemId: null },
};

type SyncHandler = (request: RecordedRequest) => FakeReply;

/** Confirms whatever operation was sent, echoing its opId. */
function confirmed(unlocks = {}): SyncHandler {
  return (request) => {
    const [operation] = (request.body as { operations: ClientOperation[] }).operations;
    return {
      status: 200,
      body: {
        results: [{ opId: operation?.opId, status: 'confirmed', repeated: false, unlocks }],
        minPackageVersion: '1.0.0',
      },
    };
  };
}

describe('RegisterRating (UC10, RN05, RN06, P04)', () => {
  let db: FakeLocalDatabase;
  let completed: string[];

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
    await seedCatalog(db, CATALOG);
    completed = [];
  });

  afterEach(() => db.close());

  function onlineEnqueuer(reply: SyncHandler) {
    const fake = createFakeFetch({ [SYNC]: reply });
    let sequence = 0;
    const http = createFetchHttpClient({
      baseUrl: 'http://api.test',
      fetch: fake.fetch,
      tokenStore: createFakeTokenStore(tokenPair('1')),
      packageVersion: PACKAGE_VERSION,
      now: () => NOW,
    });
    const enqueuer = createDirectOnlineOperationEnqueuer({
      http,
      localDatabase: db,
      projectors: { 'rating.register': projectRatingRegistered },
      // First id is OP_ID; later ones only need to differ (RN06 repeats).
      newOperationId: () => `0192f0a0-0000-7000-8000-${String(++sequence).padStart(12, '0')}`,
      now: () => NOW,
    });
    return { enqueuer, requests: fake.requests };
  }

  function registerRating(enqueuer: OperationEnqueuer) {
    return createRegisterRating({
      enqueuer,
      progress: createProgressRepository(db),
      completionListener: {
        onDishCompleted: async (dishId) => {
          completed.push(dishId);
        },
      },
    });
  }

  /** Stands in for an enqueuer that never touches the local copy (Stage 2 outbox, failures). */
  function fakeEnqueuer(result: EnqueueResult): OperationEnqueuer {
    return { enqueue: async () => result };
  }

  const unlockRows = () =>
    db.rows('SELECT kind, target_id, unlocked_at FROM unlocks_local ORDER BY kind, target_id');

  const ratingRows = () =>
    db.rows<{ id: string; dish_id: string; data: string; rated_on: string }>(
      'SELECT id, dish_id, data, rated_on FROM ratings_local ORDER BY rated_on',
    );

  it('RN05: sends stars x 2 as the score and saves the rating locally once confirmed', async () => {
    const { enqueuer, requests } = onlineEnqueuer(confirmed());

    const result = await registerRating(enqueuer).execute({ dishId: DISH.feijoada, stars: 3.5 });

    expect(requests[0]?.body).toMatchObject({
      operations: [
        {
          type: 'rating.register',
          payload: { dishId: DISH.feijoada, score: 7, itemId: null },
        },
      ],
    });
    expect(result).toMatchObject({
      status: 'saved',
      ratingId: OP_ID,
      dishId: DISH.feijoada,
      isRepeat: false,
    });
    expect(ratingRows()).toEqual([
      {
        id: OP_ID,
        dish_id: DISH.feijoada,
        data: JSON.stringify({
          id: OP_ID,
          dishId: DISH.feijoada,
          score: 7,
          date: NOW.toISOString(),
        }),
        rated_on: NOW.toISOString(),
      },
    ]);
  });

  it('RN04: records the unlocks reported by the server and returns them', async () => {
    const { enqueuer } = onlineEnqueuer(
      confirmed({ evolutions: [DISH.feijoadaLight], badgeAwards: [BADGE.firstDish] }),
    );

    const result = await registerRating(enqueuer).execute({ dishId: DISH.feijoada, stars: 5 });

    expect(result).toMatchObject({
      status: 'saved',
      unlocks: { evolutions: [DISH.feijoadaLight], badgeAwards: [BADGE.firstDish] },
    });
    expect(unlockRows()).toEqual([
      { kind: 'badge', target_id: BADGE.firstDish, unlocked_at: NOW.toISOString() },
      { kind: 'evolution', target_id: DISH.feijoadaLight, unlocked_at: NOW.toISOString() },
    ]);
  });

  it('RN07: reports the cuisine progress before and after this dish', async () => {
    await seedRating(db, { id: 'r-old', dishId: DISH.moqueca, score: 8, date: '2026-11-01' });
    const { enqueuer } = onlineEnqueuer(confirmed());

    const result = await registerRating(enqueuer).execute({ dishId: DISH.feijoada, stars: 4 });

    expect(result).toMatchObject({
      cuisineProgressBefore: { cuisineId: CUISINE.brasileira, completedDishes: 1, totalDishes: 4 },
      cuisineProgressAfter: {
        cuisineId: CUISINE.brasileira,
        completedDishes: 2,
        totalDishes: 4,
        percent: 50,
        missingDishes: 2,
      },
    });
  });

  it('returns offline and leaves the local copy untouched when the network is unavailable', async () => {
    const result = await registerRating(
      fakeEnqueuer({ status: 'unavailable', opId: OP_ID, reason: 'offline', operation: anyOp }),
    ).execute({ dishId: DISH.feijoada, stars: 4 });

    expect(result).toEqual({ status: 'offline' });
    expect(ratingRows()).toEqual([]);
    expect(unlockRows()).toEqual([]);
    expect(completed).toEqual([]);
  });

  it('returns the server problem when the rating is rejected', async () => {
    const problem = { type: 'about:blank', title: 'Prato não encontrado', status: 404 };
    const result = await registerRating(
      fakeEnqueuer({ status: 'rejected', opId: OP_ID, problem }),
    ).execute({ dishId: DISH.feijoada, stars: 4 });

    expect(result).toEqual({ status: 'rejected', problem });
    expect(ratingRows()).toEqual([]);
    expect(completed).toEqual([]);
  });

  it('RN06: repeating a dish adds a new rating row, flags isRepeat and unlocks no evolution again', async () => {
    await seedRating(db, { id: 'r-old', dishId: DISH.feijoada, score: 8, date: '2026-11-01' });
    await seedUnlock(db, 'evolution', DISH.feijoadaLight, null);
    // The server reports nothing new for a repeat (UnlockRules is additive, RN02/RN04).
    const { enqueuer } = onlineEnqueuer(confirmed({ evolutions: [], badgeAwards: [] }));

    const result = await registerRating(enqueuer).execute({ dishId: DISH.feijoada, stars: 4 });

    expect(result).toMatchObject({ status: 'saved', isRepeat: true, unlocks: { evolutions: [] } });
    expect(ratingRows().map((row) => row.id)).toEqual(['r-old', OP_ID]);
    expect(unlockRows()).toEqual([
      { kind: 'evolution', target_id: DISH.feijoadaLight, unlocked_at: null },
    ]);
  });

  it('RN06: replaying a confirmed operation keeps a single row and the local copy updated', async () => {
    await db.transaction((tx) => projectRatingRegistered(tx, anyOp));

    await db.transaction((tx) => projectRatingRegistered(tx, anyOp));

    expect(ratingRows().map((row) => row.id)).toEqual([OP_ID]);
  });

  describe('Stage 2 queued branch (ADR-008)', () => {
    it('RN02/RN03: computes the unlocks locally with the UnlockCalculator', async () => {
      const result = await registerRating(fakeEnqueuer({ status: 'queued', opId: OP_ID })).execute({
        dishId: DISH.feijoada,
        stars: 4,
        changes: 'Sem linguiça',
      });

      expect(result).toMatchObject({
        status: 'saved',
        ratingId: OP_ID,
        isRepeat: false,
        unlocks: {
          evolutions: [DISH.feijoadaLight],
          badgeAwards: [BADGE.firstDish, BADGE.firstAdaptation],
        },
        cuisineProgressAfter: { completedDishes: 1 },
      });
      expect(completed).toEqual([DISH.feijoada]);
    });

    it('RN02/RN04: a queued repeat unlocks nothing already unlocked', async () => {
      await seedRating(db, { id: 'r-old', dishId: DISH.feijoada, score: 8, date: '2026-11-01' });
      await seedUnlock(db, 'evolution', DISH.feijoadaLight, null);
      await seedUnlock(db, 'badge', BADGE.firstDish, '2026-11-01T00:00:00.000Z');

      const result = await registerRating(fakeEnqueuer({ status: 'queued', opId: OP_ID })).execute({
        dishId: DISH.feijoada,
        stars: 4,
      });

      expect(result).toMatchObject({
        isRepeat: true,
        unlocks: { evolutions: [], badgeAwards: [] },
      });
    });
  });

  describe('DishCompletionListener (#86 port)', () => {
    it('is notified once per saved rating', async () => {
      const { enqueuer } = onlineEnqueuer(confirmed());

      await registerRating(enqueuer).execute({ dishId: DISH.sushi, stars: 4 });

      expect(completed).toEqual([DISH.sushi]);
    });

    it('a failing listener does not undo the saved rating', async () => {
      const { enqueuer } = onlineEnqueuer(confirmed());
      const useCase = createRegisterRating({
        enqueuer,
        progress: createProgressRepository(db),
        completionListener: {
          onDishCompleted: async () => {
            throw new Error('recipe state unavailable');
          },
        },
      });

      const result = await useCase.execute({ dishId: DISH.sushi, stars: 4 });

      expect(result.status).toBe('saved');
      expect(ratingRows()).toHaveLength(1);
    });
  });

  describe('input validation (RN05, RNF10)', () => {
    const neverEnqueues: OperationEnqueuer = {
      enqueue: jest.fn(async () => {
        throw new Error('must not enqueue an invalid rating');
      }),
    };

    it('RN05: accepts 0 stars as score 0', async () => {
      const { enqueuer, requests } = onlineEnqueuer(confirmed());

      const result = await registerRating(enqueuer).execute({ dishId: DISH.sushi, stars: 0 });

      expect(result.status).toBe('saved');
      expect(requests[0]?.body).toMatchObject({ operations: [{ payload: { score: 0 } }] });
    });

    it.each([
      ['off the half-point grid', 5.2],
      ['above 5', 5.5],
      ['negative', -0.5],
      ['missing', undefined],
      ['not a number', Number.NaN],
    ])('RN05: rejects stars %s before enqueuing', async (_label, stars) => {
      const result = await registerRating(neverEnqueues).execute({
        dishId: DISH.sushi,
        stars: stars as number,
      });

      expect(result).toEqual({ status: 'invalid', field: 'stars' });
      expect(neverEnqueues.enqueue).not.toHaveBeenCalled();
      expect(ratingRows()).toEqual([]);
    });

    it('RNF10: trims comment and changes and omits them when blank', async () => {
      const { enqueuer, requests } = onlineEnqueuer(confirmed());

      await registerRating(enqueuer).execute({
        dishId: DISH.sushi,
        stars: 4,
        comment: '  Ficou ótimo  ',
        changes: '   ',
      });

      const payload = (requests[0]?.body as { operations: { payload: object }[] }).operations[0]
        ?.payload;
      expect(payload).toEqual({
        dishId: DISH.sushi,
        score: 8,
        comment: 'Ficou ótimo',
        itemId: null,
      });
    });

    it.each(['comment', 'changes'] as const)(
      'rejects a %s longer than 2000 characters',
      async (field) => {
        const result = await registerRating(neverEnqueues).execute({
          dishId: DISH.sushi,
          stars: 4,
          [field]: 'a'.repeat(2001),
        });

        expect(result).toEqual({ status: 'invalid', field });
        expect(neverEnqueues.enqueue).not.toHaveBeenCalled();
      },
    );
  });
});
