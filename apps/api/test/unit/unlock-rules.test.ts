import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  calculateUnlocks,
  type CatalogIndexForUnlock,
  type RatingForUnlock,
  type UnlockCalculationResult,
  type UnlockState,
} from '../../src/modules/progress/internal/unlock-rules.js';

interface UnlockVectorCase {
  readonly id: string;
  readonly description: string;
  readonly input: {
    readonly rating: RatingForUnlock;
    readonly index: CatalogIndexForUnlock;
    readonly state: UnlockState;
  };
  readonly expectedOutput: UnlockCalculationResult;
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const vectorsPath = path.resolve(currentDir, '../../../../tests/vectors/unlock-vectors.json');
const unlockVectors = JSON.parse(readFileSync(vectorsPath, 'utf8')) as readonly UnlockVectorCase[];

describe('UnlockRules shared JSON vectors (ADR-016, RN01-RN07, RN18, R03)', () => {
  it('loads all 8 RN03 (a-h) milestone variants from the shared vector suite', () => {
    const milestoneTypes = new Set(
      unlockVectors.flatMap((vector) =>
        vector.input.index.badgeDefinitions.map((badge) => badge.milestone.type),
      ),
    );

    expect(milestoneTypes).toEqual(
      new Set([
        'dish',
        'cuisine',
        'n_cuisines',
        'all_continents',
        'set',
        'total_dishes',
        'evolution_level',
        'adaptation_count',
      ]),
    );
  });

  for (const vector of unlockVectors) {
    it(`${vector.id}: ${vector.description}`, () => {
      const actual = calculateUnlocks(vector.input.rating, vector.input.index, vector.input.state);
      expect(actual).toEqual(vector.expectedOutput);
    });
  }

  it('RN04: preserves input state immutability across calculations', () => {
    const firstVector = unlockVectors[0]!;
    const completedSnapshot = [...firstVector.input.state.completedDishIds];
    const adaptationSnapshot = [...firstVector.input.state.adaptationRatingIds];
    const evolutionSnapshot = [...firstVector.input.state.unlockedEvolutionDishIds];
    const badgeSnapshot = [...firstVector.input.state.awardedBadgeIds];

    calculateUnlocks(firstVector.input.rating, firstVector.input.index, firstVector.input.state);

    expect(firstVector.input.state.completedDishIds).toEqual(completedSnapshot);
    expect(firstVector.input.state.adaptationRatingIds).toEqual(adaptationSnapshot);
    expect(firstVector.input.state.unlockedEvolutionDishIds).toEqual(evolutionSnapshot);
    expect(firstVector.input.state.awardedBadgeIds).toEqual(badgeSnapshot);
  });
});
