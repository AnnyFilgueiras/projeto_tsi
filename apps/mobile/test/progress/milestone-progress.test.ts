import { milestoneProgress } from '../../src/features/progress/domain/milestone-progress';
import type {
  BadgeMilestone,
  CatalogIndexForUnlock,
  UnlockState,
} from '../../src/features/progress/domain/unlock-calculator';

// Catalog: feijoada (BR) -> feijoada vegana (evolution) -> feijoada vegana defumada,
// ramen (JP), tajine (MA), pavlova (AU) and paella (ES): one dish per catalog continent.
const index: CatalogIndexForUnlock = {
  dishes: [
    { id: 'feijoada', cuisineId: 'brazilian', baseDishId: null },
    { id: 'feijoada-vegana', cuisineId: 'brazilian', baseDishId: 'feijoada' },
    { id: 'feijoada-defumada', cuisineId: 'brazilian', baseDishId: 'feijoada-vegana' },
    { id: 'ramen', cuisineId: 'japanese', baseDishId: null },
    { id: 'tajine', cuisineId: 'moroccan', baseDishId: null },
    { id: 'pavlova', cuisineId: 'australian', baseDishId: null },
    { id: 'paella', cuisineId: 'spanish', baseDishId: null },
  ],
  cuisines: [
    { id: 'brazilian', continents: ['america'] },
    { id: 'japanese', continents: ['asia'] },
    { id: 'moroccan', continents: ['africa'] },
    { id: 'australian', continents: ['oceania'] },
    { id: 'spanish', continents: ['europe'] },
  ],
  badgeDefinitions: [],
};

function stateWith(
  completedDishIds: readonly string[],
  adaptationRatingIds: readonly string[] = [],
): UnlockState {
  return {
    completedDishIds,
    adaptationRatingIds,
    unlockedEvolutionDishIds: [],
    awardedBadgeIds: [],
  };
}

function progressOf(milestone: BadgeMilestone, state: UnlockState) {
  return milestoneProgress({ id: 'badge', milestone }, state, index);
}

describe('milestoneProgress', () => {
  describe('dish', () => {
    const milestone: BadgeMilestone = { type: 'dish', dishId: 'ramen' };

    it('is 0 of 1 before the dish is completed', () => {
      expect(progressOf(milestone, stateWith(['feijoada']))).toEqual({ current: 0, target: 1 });
    });

    it('is 1 of 1 once completed', () => {
      expect(progressOf(milestone, stateWith(['ramen']))).toEqual({ current: 1, target: 1 });
    });
  });

  describe('cuisine', () => {
    const milestone: BadgeMilestone = { type: 'cuisine', cuisineId: 'brazilian' };

    it('is 0 of 1 without a dish of the cuisine', () => {
      expect(progressOf(milestone, stateWith(['ramen']))).toEqual({ current: 0, target: 1 });
    });

    it('is 1 of 1 once any dish of the cuisine is completed', () => {
      expect(progressOf(milestone, stateWith(['feijoada-vegana']))).toEqual({
        current: 1,
        target: 1,
      });
    });
  });

  describe('n_cuisines', () => {
    const milestone: BadgeMilestone = { type: 'n_cuisines', quantity: 3 };

    it('counts distinct cuisines only', () => {
      expect(progressOf(milestone, stateWith(['feijoada', 'feijoada-vegana', 'ramen']))).toEqual({
        current: 2,
        target: 3,
      });
    });

    it('caps current at target once achieved', () => {
      expect(progressOf(milestone, stateWith(['feijoada', 'ramen', 'tajine', 'pavlova']))).toEqual({
        current: 3,
        target: 3,
      });
    });
  });

  describe('all_continents', () => {
    const milestone: BadgeMilestone = { type: 'all_continents' };

    it('counts covered catalog continents out of 5', () => {
      expect(progressOf(milestone, stateWith(['feijoada', 'ramen']))).toEqual({
        current: 2,
        target: 5,
      });
    });

    it('is 5 of 5 when every continent is covered', () => {
      expect(
        progressOf(milestone, stateWith(['feijoada', 'ramen', 'tajine', 'pavlova', 'paella'])),
      ).toEqual({ current: 5, target: 5 });
    });
  });

  describe('set', () => {
    const milestone: BadgeMilestone = { type: 'set', cuisineIds: ['brazilian', 'japanese'] };

    it('counts completed cuisines of the set', () => {
      expect(progressOf(milestone, stateWith(['ramen', 'paella']))).toEqual({
        current: 1,
        target: 2,
      });
    });

    it('is complete when every cuisine of the set is completed', () => {
      expect(progressOf(milestone, stateWith(['ramen', 'feijoada']))).toEqual({
        current: 2,
        target: 2,
      });
    });

    it('treats an empty set as never achievable (parity with calculateUnlocks)', () => {
      expect(progressOf({ type: 'set', cuisineIds: [] }, stateWith(['ramen', 'feijoada']))).toEqual(
        { current: 0, target: 1 },
      );
    });
  });

  describe('total_dishes', () => {
    const milestone: BadgeMilestone = { type: 'total_dishes', quantity: 3 };

    it('counts distinct known dishes, ignoring ids outside the catalog (RN01)', () => {
      expect(
        progressOf(milestone, stateWith(['ramen', 'ramen', 'unknown-dish', 'tajine'])),
      ).toEqual({ current: 2, target: 3 });
    });

    it('caps current at target once achieved', () => {
      expect(progressOf(milestone, stateWith(['ramen', 'tajine', 'pavlova', 'paella']))).toEqual({
        current: 3,
        target: 3,
      });
    });
  });

  describe('evolution_level', () => {
    const milestone: BadgeMilestone = { type: 'evolution_level', minLevel: 3 };

    it('reports the deepest completed evolution level', () => {
      expect(progressOf(milestone, stateWith(['ramen', 'feijoada-vegana']))).toEqual({
        current: 2,
        target: 3,
      });
    });

    it('is complete when a level-3 dish is completed', () => {
      expect(progressOf(milestone, stateWith(['feijoada-defumada']))).toEqual({
        current: 3,
        target: 3,
      });
    });
  });

  describe('adaptation_count', () => {
    const milestone: BadgeMilestone = { type: 'adaptation_count', quantity: 2 };

    it('counts distinct adaptation ratings', () => {
      expect(progressOf(milestone, stateWith(['ramen'], ['rating-1', 'rating-1']))).toEqual({
        current: 1,
        target: 2,
      });
    });

    it('caps current at target once achieved', () => {
      expect(
        progressOf(milestone, stateWith(['ramen'], ['rating-1', 'rating-2', 'rating-3'])),
      ).toEqual({ current: 2, target: 2 });
    });
  });

  it('does not mutate the state', () => {
    const state = Object.freeze(stateWith(Object.freeze(['ramen']) as readonly string[]));
    expect(() => progressOf({ type: 'total_dishes', quantity: 1 }, state)).not.toThrow();
  });
});
