import { LOCAL_MIGRATIONS } from '../../src/core/local-db/migrations';
import { runMigrations } from '../../src/core/local-db/migrator';
import { createProgressRepository } from '../../src/features/progress/data/progress-repository';
import { loadRatingContext } from '../../src/features/progress/domain/rating-context';
import { createFakeLocalDatabase, type FakeLocalDatabase } from '../support/fake-local-database';
import { CATALOG, DISH, seedCatalog, seedRating } from './fixtures';

describe('loadRatingContext (RN06)', () => {
  let db: FakeLocalDatabase;

  beforeEach(async () => {
    db = createFakeLocalDatabase();
    await runMigrations(db, LOCAL_MIGRATIONS);
  });

  afterEach(() => db.close());

  const load = (dishId: string) => loadRatingContext(createProgressRepository(db), dishId);

  it('returns the dish name and no previous preparation for a first rating', async () => {
    await seedCatalog(db, CATALOG);

    await expect(load(DISH.feijoada)).resolves.toEqual({
      dishName: 'Feijoada',
      previousCount: 0,
    });
  });

  it('counts only the earlier ratings of the same dish', async () => {
    await seedCatalog(db, CATALOG);
    await seedRating(db, { id: 'r1', dishId: DISH.feijoada, score: 8, date: '2026-11-01' });
    await seedRating(db, { id: 'r2', dishId: DISH.feijoada, score: 6, date: '2026-11-10' });
    await seedRating(db, { id: 'r3', dishId: DISH.moqueca, score: 10, date: '2026-11-12' });

    await expect(load(DISH.feijoada)).resolves.toEqual({
      dishName: 'Feijoada',
      previousCount: 2,
    });
  });

  it('has no name before the first download set (the screen falls back to a generic title)', async () => {
    await expect(load(DISH.feijoada)).resolves.toEqual({ dishName: null, previousCount: 0 });
  });
});
