import {
  pickCuriosityHint,
  type HintContext,
} from '../../src/features/suggestions/domain/pick-curiosity-hint';

const THAI = 'cuisine-thai';
const FRENCH = 'cuisine-french';

const context = (overrides: Partial<HintContext> = {}): HintContext => ({
  catalog: {
    dishes: [
      { id: 'pad-thai', name: 'Pad Thai', cuisineId: THAI, baseDishId: null },
      { id: 'ratatouille', name: 'Ratatouille', cuisineId: FRENCH, baseDishId: null },
      { id: 'tian', name: 'Tian provençal', cuisineId: FRENCH, baseDishId: 'ratatouille' },
      { id: 'quiche', name: 'Quiche', cuisineId: FRENCH },
    ],
    cuisines: [
      { id: THAI, name: 'Tailandesa' },
      { id: FRENCH, name: 'Francesa' },
    ],
  },
  ratedDishIds: [],
  unlockedEvolutionIds: [],
  ...overrides,
});

describe('pickCuriosityHint (N04/N05: at most one hint per card)', () => {
  it('1st priority: points at the locked evolution without naming it (mystery dish, #86)', () => {
    expect(pickCuriosityHint({ dishId: 'ratatouille', cuisineId: FRENCH }, context())).toEqual({
      kind: 'evolution',
    });
  });

  it('2nd priority: first dish of a cuisine the user has never rated', () => {
    expect(pickCuriosityHint({ dishId: 'pad-thai', cuisineId: THAI }, context())).toEqual({
      kind: 'first-cuisine',
      cuisineName: 'Tailandesa',
    });
  });

  it('falls back to the cuisine hint once the evolution is already unlocked', () => {
    const hint = pickCuriosityHint(
      { dishId: 'ratatouille', cuisineId: FRENCH },
      context({ unlockedEvolutionIds: ['tian'] }),
    );

    expect(hint).toEqual({ kind: 'first-cuisine', cuisineName: 'Francesa' });
  });

  it('3rd priority: no hint when nothing is locked and the cuisine was already rated', () => {
    const hint = pickCuriosityHint(
      { dishId: 'quiche', cuisineId: FRENCH },
      context({ ratedDishIds: ['ratatouille'] }),
    );

    expect(hint).toBeNull();
  });

  it('shows no hint before the catalog index has been synced (nothing to name)', () => {
    const hint = pickCuriosityHint(
      { dishId: 'pad-thai', cuisineId: THAI },
      context({ catalog: { dishes: [], cuisines: [] } }),
    );

    expect(hint).toBeNull();
  });
});
