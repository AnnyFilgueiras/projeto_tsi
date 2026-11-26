import {
  buildProgressModel,
  type ProgressSnapshot,
  type StoredRating,
} from '../../src/features/progress/domain/progress-model';
import { CATALOG, CUISINE, DISH } from './fixtures';

function snapshotWith(ratings: StoredRating[]): ProgressSnapshot {
  return { catalog: CATALOG, ratings, unlocks: [], lastSyncAt: null };
}

describe('buildProgressModel for the Collection tab (US12, US14)', () => {
  it('US14: lists the cuisine dishes, completed first with the stars of the latest preparation', () => {
    const model = buildProgressModel(
      snapshotWith([
        { id: 'r1', dishId: DISH.moqueca, score: 6, date: '2026-11-10T12:00:00.000Z' },
        { id: 'r2', dishId: DISH.moqueca, score: 9, date: '2026-11-14T12:00:00.000Z' },
        { id: 'r3', dishId: DISH.feijoadaLight, score: 8, date: '2026-11-12T12:00:00.000Z' },
      ]),
    );

    const brasileira = model.cuisines.find((cuisine) => cuisine.cuisineId === CUISINE.brasileira);

    expect(brasileira?.dishes).toEqual([
      { dishId: DISH.feijoadaLight, name: 'Feijoada leve', completed: true, stars: 4 },
      { dishId: DISH.moqueca, name: 'Moqueca', completed: true, stars: 4.5 },
      { dishId: DISH.feijoada, name: 'Feijoada', completed: false, stars: null },
      { dishId: DISH.feijoadaVegana, name: 'Feijoada vegana', completed: false, stars: null },
    ]);
  });

  it('US14: a cuisine without ratings lists every dish as pending', () => {
    const model = buildProgressModel(snapshotWith([]));

    const japonesa = model.cuisines.find((cuisine) => cuisine.cuisineId === CUISINE.japonesa);

    expect(japonesa?.dishes.map((dish) => [dish.name, dish.completed])).toEqual([
      ['Lámen', false],
      ['Sushi', false],
    ]);
  });

  it('#86 format C: an evolution whose base dish was not cooked is a nameless mystery tile', () => {
    const model = buildProgressModel(snapshotWith([]));

    const brasileira = model.cuisines.find((cuisine) => cuisine.cuisineId === CUISINE.brasileira);

    // Mysteries go last; the RN07 counts still include them, so nothing shrinks on reveal.
    expect(brasileira?.dishes).toEqual([
      { dishId: DISH.feijoada, name: 'Feijoada', completed: false, stars: null },
      { dishId: DISH.moqueca, name: 'Moqueca', completed: false, stars: null },
      { dishId: DISH.feijoadaLight, name: null, completed: false, stars: null },
      { dishId: DISH.feijoadaVegana, name: null, completed: false, stars: null },
    ]);
    expect(brasileira).toMatchObject({ totalDishes: 4, missingDishes: 4 });
  });

  it('#86 format C: every level shows; a mystery names its base only when the base is revealed', () => {
    const [chain] = buildProgressModel(snapshotWith([])).evolutionChains;

    expect(
      chain?.nodes.map((node) => [node.dishId, node.name, node.status, node.baseDish]),
    ).toEqual([
      [DISH.feijoada, 'Feijoada', 'unlocked', null],
      [DISH.feijoadaLight, null, 'locked', { dishId: DISH.feijoada, name: 'Feijoada' }],
      [DISH.feijoadaVegana, null, 'locked', { dishId: DISH.feijoadaLight, name: null }],
    ]);
  });

  it('#86 format C: cooking the base reveals the next level even before its unlock syncs', () => {
    const model = buildProgressModel(
      snapshotWith([
        { id: 'r1', dishId: DISH.feijoada, score: 8, date: '2026-11-10T12:00:00.000Z' },
      ]),
    );

    const [chain] = model.evolutionChains;
    expect(chain?.nodes.map((node) => [node.name, node.status])).toEqual([
      ['Feijoada', 'completed'],
      ['Feijoada leve', 'unlocked'],
      [null, 'locked'],
    ]);
    const brasileira = model.cuisines.find((cuisine) => cuisine.cuisineId === CUISINE.brasileira);
    expect(brasileira?.dishes.map((dish) => dish.name)).toEqual([
      'Feijoada',
      'Feijoada leve',
      'Moqueca',
      null,
    ]);
  });

  it('US12: keeps the full comment and changes for the history sheet, trimmed', () => {
    const comment = `${'Muito saborosa, '.repeat(10)}fim.`;
    const model = buildProgressModel(
      snapshotWith([
        {
          id: 'r1',
          dishId: DISH.sushi,
          score: 7,
          date: '2026-11-10',
          comment: `  ${comment} `,
          changes: 'Sem pepino',
        },
        { id: 'r2', dishId: DISH.lamen, score: 8, date: '2026-11-11', changes: '   ' },
      ]),
    );

    expect(model.history.map((entry) => [entry.ratingId, entry.comment, entry.changes])).toEqual([
      ['r2', null, null],
      ['r1', comment, 'Sem pepino'],
    ]);
  });
});
