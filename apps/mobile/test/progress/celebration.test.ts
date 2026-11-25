import {
  buildCelebration,
  parseCelebrationParams,
  type CelebrationParams,
} from '../../src/features/progress/domain/celebration';
import type {
  ProgressSnapshot,
  StoredRating,
} from '../../src/features/progress/domain/progress-model';
import { BADGE, CATALOG, DISH } from './fixtures';

const RATING_ID = 'r0000000-0000-4000-8000-000000000001';

function rating(overrides: Partial<StoredRating> = {}): StoredRating {
  return { id: RATING_ID, dishId: DISH.feijoada, score: 9, date: '2026-11-25', ...overrides };
}

function snapshot(ratings: StoredRating[]): ProgressSnapshot {
  return { catalog: CATALOG, ratings, unlocks: [], lastSyncAt: null };
}

function params(overrides: Partial<CelebrationParams> = {}): CelebrationParams {
  return {
    dishId: DISH.feijoada,
    ratingId: RATING_ID,
    evolutionIds: [],
    badgeIds: [],
    isRepeat: false,
    ...overrides,
  };
}

describe('parseCelebrationParams (navigation contract from #83)', () => {
  it('splits the comma-separated ids and reads repeat', () => {
    expect(
      parseCelebrationParams({
        dishId: DISH.feijoada,
        ratingId: RATING_ID,
        evolutions: `${DISH.feijoadaLight},${DISH.moqueca}`,
        badges: BADGE.firstDish,
        repeat: '1',
      }),
    ).toEqual({
      dishId: DISH.feijoada,
      ratingId: RATING_ID,
      evolutionIds: [DISH.feijoadaLight, DISH.moqueca],
      badgeIds: [BADGE.firstDish],
      isRepeat: true,
    });
  });

  it('treats empty or missing lists as none and anything but "1" as a first preparation', () => {
    expect(parseCelebrationParams({ dishId: DISH.feijoada, evolutions: '', repeat: '0' })).toEqual({
      dishId: DISH.feijoada,
      ratingId: '',
      evolutionIds: [],
      badgeIds: [],
      isRepeat: false,
    });
  });

  it('takes the first value when a param arrives as an array', () => {
    expect(parseCelebrationParams({ dishId: [DISH.sushi, DISH.lamen] }).dishId).toBe(DISH.sushi);
  });
});

describe('buildCelebration (§9 blocks A–E)', () => {
  it('first preparation: dish name, stars and the cuisine moving from before to after (RN07)', () => {
    const view = buildCelebration(
      snapshot([rating(), rating({ id: 'r-old', dishId: DISH.moqueca })]),
      params(),
    );

    expect(view.dishName).toBe('Feijoada');
    expect(view.stars).toBe(4.5);
    expect(view.isRepeat).toBe(false);
    expect(view.cuisine).toEqual({
      name: 'Brasileira',
      before: { completed: 1, total: 4, percent: 25, missing: 3 },
      after: { completed: 2, total: 4, percent: 50, missing: 2 },
    });
  });

  it('repeat: no cuisine block (nothing changed) and counts every preparation of the dish', () => {
    const view = buildCelebration(
      snapshot([rating(), rating({ id: 'r-old', date: '2026-11-01' })]),
      params({ isRepeat: true }),
    );

    expect(view.isRepeat).toBe(true);
    expect(view.cuisine).toBeNull();
    expect(view.repeatCount).toBe(2);
  });

  it('resolves evolutions and badges from the catalog, ignoring unknown ids', () => {
    const view = buildCelebration(
      snapshot([rating()]),
      params({
        evolutionIds: [DISH.feijoadaLight, 'd-unknown'],
        badgeIds: ['b-unknown', BADGE.firstDish],
      }),
    );

    expect(view.evolutions).toEqual([{ dishId: DISH.feijoadaLight, name: 'Feijoada leve' }]);
    expect(view.badges).toEqual([
      { badgeId: BADGE.firstDish, name: 'Primeiro prato', description: 'Conclua um prato.' },
    ]);
  });

  it('opens the Collection on badges when one was earned, else on cuisines', () => {
    expect(buildCelebration(snapshot([rating()]), params()).collectionView).toBe('cuisines');
    expect(
      buildCelebration(snapshot([rating()]), params({ badgeIds: [BADGE.firstDish] }))
        .collectionView,
    ).toBe('badges');
  });

  it('degrades without breaking when the rating or dish is not in the local copy', () => {
    const view = buildCelebration(snapshot([]), params({ dishId: 'd-gone', ratingId: 'r-gone' }));

    expect(view.dishName).toBeNull();
    expect(view.stars).toBeNull();
    expect(view.cuisine).toBeNull();
    expect(view.repeatCount).toBe(0);
  });

  it('a completed cuisine reaches zero missing dishes', () => {
    const view = buildCelebration(
      snapshot([rating({ dishId: DISH.sushi }), rating({ id: 'r-2', dishId: DISH.lamen })]),
      params({ dishId: DISH.sushi }),
    );

    expect(view.cuisine?.name).toBe('Japonesa');
    expect(view.cuisine?.after).toEqual({ completed: 2, total: 2, percent: 100, missing: 0 });
  });
});
