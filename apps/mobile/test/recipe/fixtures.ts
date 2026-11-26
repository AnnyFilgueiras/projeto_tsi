import type { Recipe } from '../../src/features/recipe/domain';

export const DISH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const BASE_DISH_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const CUISINE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const PEANUT_ID = '11111111-1111-4111-8111-111111111111';
export const NOODLE_ID = '22222222-2222-4222-8222-222222222222';
export const PHOTO_HASH = 'a'.repeat(64);

export function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    dishId: DISH_ID,
    name: 'Pad Thai',
    cuisineId: CUISINE_ID,
    baseDishId: null,
    prepTimeMinutes: 30,
    difficulty: 'medium',
    ingredients: [
      { ingredientId: NOODLE_ID, name: 'Talharim de arroz', allergens: [], quantity: '200 g' },
      { ingredientId: PEANUT_ID, name: 'Amendoim', allergens: ['amendoim'], quantity: '50 g' },
    ],
    utensils: [],
    steps: ['Hidrate o talharim.', 'Refogue.', 'Misture.', 'Sirva com amendoim.'],
    allergens: ['amendoim'],
    allergenState: 'verified',
    allergensUpdatedAt: '2026-11-01T00:00:00.000Z',
    sourceName: 'Receitas da Vó',
    sourceUrl: 'https://example.org/pad-thai',
    photo: {
      hash: PHOTO_HASH,
      author: 'Autora',
      sourceUrl: 'https://example.org/foto',
      license: 'cc_by',
      modified: false,
    },
    substitutions: [],
    updatedAt: '2026-11-20T00:00:00.000Z',
    ...overrides,
  };
}

export const CATALOG_INDEX = {
  dishes: [
    { id: BASE_DISH_ID, name: 'Aglio e Olio', cuisineId: CUISINE_ID, baseDishId: null },
    { id: DISH_ID, name: 'Pad Thai', cuisineId: CUISINE_ID, baseDishId: null },
  ],
  cuisines: [{ id: CUISINE_ID, name: 'Tailandesa', continents: ['asia'], totalDishes: 2 }],
  badgeDefinitions: [],
};
