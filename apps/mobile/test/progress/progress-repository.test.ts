import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createProgressRepository } from '../../src/features/progress/data/progress-repository';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { BADGE, CATALOG, CUISINE, DISH, seedCatalog, seedRating, seedUnlock } from './fixtures';

const LONG_COMMENT = `${'Muito saborosa, '.repeat(10)}fim.`;

describe('progress-repository read model (US12, US14–US16, RN02–RN07)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  /** 2 cuisines, a 3-level chain (feijoada -> leve -> vegana) and 1 earned badge. */
  async function seedExample() {
    await seedCatalog(db, CATALOG);
    await seedRating(db, {
      id: 'r1',
      dishId: DISH.feijoada,
      score: 9,
      date: '2026-11-10T12:00:00.000Z',
      comment: LONG_COMMENT,
    });
    await seedRating(db, {
      id: 'r2',
      dishId: DISH.feijoadaLight,
      score: 7,
      date: '2026-11-12T12:00:00.000Z',
      changes: 'Sem bacon',
    });
    await seedRating(db, {
      id: 'r3',
      dishId: DISH.feijoada,
      score: 10,
      date: '2026-11-15T12:00:00.000Z',
    });
    await seedUnlock(db, 'evolution', DISH.feijoadaLight, null);
    await seedUnlock(db, 'evolution', DISH.feijoadaVegana, '2026-11-12T12:00:00.000Z');
    await seedUnlock(db, 'badge', BADGE.firstDish, '2026-11-10T12:00:00.000Z');
    await db.execute("INSERT INTO meta_sync (key, value) VALUES ('lastSyncAt', ?)", [
      '2026-11-16T08:00:00.000Z',
    ]);
  }

  const load = () => createProgressRepository(db).loadProgress();

  it('RN07: counts distinct rated dishes per cuisine, started cuisines first then alphabetical', async () => {
    await seedExample();

    const { cuisines } = await load();

    expect(cuisines.map(({ dishes: _dishes, ...counts }) => counts)).toEqual([
      {
        cuisineId: CUISINE.brasileira,
        name: 'Brasileira',
        completedDishes: 2,
        totalDishes: 4,
        percent: 50,
        missingDishes: 2,
      },
      {
        cuisineId: CUISINE.japonesa,
        name: 'Japonesa',
        completedDishes: 0,
        totalDishes: 2,
        percent: 0,
        missingDishes: 2,
      },
    ]);
  });

  it('RN02: builds the evolution chain from baseDishId with each node status', async () => {
    await seedExample();

    const { evolutionChains } = await load();

    expect(evolutionChains).toEqual([
      {
        rootDishId: DISH.feijoada,
        nodes: [
          {
            dishId: DISH.feijoada,
            name: 'Feijoada',
            level: 1,
            status: 'completed',
            baseDish: null,
          },
          {
            dishId: DISH.feijoadaLight,
            name: 'Feijoada leve',
            level: 2,
            status: 'completed',
            baseDish: null,
          },
          {
            dishId: DISH.feijoadaVegana,
            name: 'Feijoada vegana',
            level: 3,
            status: 'unlocked',
            baseDish: null,
          },
        ],
      },
    ]);
  });

  it('RN02: a locked node names the dish that unlocks it', async () => {
    await seedCatalog(db, CATALOG);
    await seedRating(db, { id: 'r1', dishId: DISH.feijoada, score: 8, date: '2026-11-10' });
    await seedUnlock(db, 'evolution', DISH.feijoadaLight, null);

    const [chain] = (await load()).evolutionChains;

    expect(chain?.nodes.map((node) => [node.dishId, node.status, node.baseDish])).toEqual([
      [DISH.feijoada, 'completed', null],
      [DISH.feijoadaLight, 'unlocked', null],
      [DISH.feijoadaVegana, 'locked', { dishId: DISH.feijoadaLight, name: 'Feijoada leve' }],
    ]);
  });

  it('RN03/RN04: lists earned badges with their date and the next milestones by closeness', async () => {
    await seedExample();

    const { badges } = await load();

    expect(badges.earned).toEqual([
      {
        badgeId: BADGE.firstDish,
        name: 'Primeiro prato',
        description: 'Conclua um prato.',
        unlockedAt: '2026-11-10T12:00:00.000Z',
      },
    ]);
    expect(badges.next.map((badge) => [badge.badgeId, badge.progress])).toEqual([
      [BADGE.firstAdaptation, { current: 1, target: 1 }],
      [BADGE.twoCuisines, { current: 1, target: 2 }],
    ]);
  });

  it('RN06: lists every rating newest first with stars and short excerpts', async () => {
    await seedExample();

    const { history } = await load();

    expect(history.map((entry) => [entry.ratingId, entry.stars, entry.hasChanges])).toEqual([
      ['r3', 5, false],
      ['r2', 3.5, true],
      ['r1', 4.5, false],
    ]);
    expect(history[1]).toMatchObject({
      dishId: DISH.feijoadaLight,
      dishName: 'Feijoada leve',
      date: '2026-11-12T12:00:00.000Z',
      commentExcerpt: null,
      changesExcerpt: 'Sem bacon',
    });
    const excerpt = history[2]?.commentExcerpt ?? '';
    expect(excerpt.length).toBeLessThanOrEqual(121);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(LONG_COMMENT.startsWith(excerpt.slice(0, -1))).toBe(true);
  });

  it('summarizes dishes, started cuisines, continents of 5 and the last sync', async () => {
    await seedExample();

    const { summary } = await load();

    expect(summary).toEqual({
      completedDishes: 2,
      cuisinesStarted: 1,
      continentsReached: 1,
      totalContinents: 5,
      lastSyncAt: '2026-11-16T08:00:00.000Z',
    });
  });

  it('returns an empty model before the first download set', async () => {
    const model = await load();

    expect(model).toEqual({
      cuisines: [],
      evolutionChains: [],
      badges: { earned: [], next: [] },
      history: [],
      summary: {
        completedDishes: 0,
        cuisinesStarted: 0,
        continentsReached: 0,
        totalContinents: 5,
        lastSyncAt: null,
      },
    });
  });
});
