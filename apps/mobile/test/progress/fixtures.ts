import type { SqlExecutor } from '../../src/core/local-db/local-database';
import type { CatalogIndex } from '../../src/features/progress/domain/progress-model';

export const CUISINE = {
  brasileira: 'c0000000-0000-4000-8000-000000000001',
  japonesa: 'c0000000-0000-4000-8000-000000000002',
} as const;

export const DISH = {
  // Chain of 3 levels: feijoada -> feijoadaLight -> feijoadaVegana (RN02).
  feijoada: 'd0000000-0000-4000-8000-000000000001',
  feijoadaLight: 'd0000000-0000-4000-8000-000000000002',
  feijoadaVegana: 'd0000000-0000-4000-8000-000000000003',
  moqueca: 'd0000000-0000-4000-8000-000000000004',
  sushi: 'd0000000-0000-4000-8000-000000000005',
  lamen: 'd0000000-0000-4000-8000-000000000006',
} as const;

export const BADGE = {
  firstDish: 'b0000000-0000-4000-8000-000000000001',
  twoCuisines: 'b0000000-0000-4000-8000-000000000002',
  firstAdaptation: 'b0000000-0000-4000-8000-000000000003',
} as const;

export const CATALOG: CatalogIndex = {
  dishes: [
    { id: DISH.feijoada, name: 'Feijoada', cuisineId: CUISINE.brasileira, baseDishId: null },
    {
      id: DISH.feijoadaLight,
      name: 'Feijoada leve',
      cuisineId: CUISINE.brasileira,
      baseDishId: DISH.feijoada,
    },
    {
      id: DISH.feijoadaVegana,
      name: 'Feijoada vegana',
      cuisineId: CUISINE.brasileira,
      baseDishId: DISH.feijoadaLight,
    },
    { id: DISH.moqueca, name: 'Moqueca', cuisineId: CUISINE.brasileira, baseDishId: null },
    { id: DISH.sushi, name: 'Sushi', cuisineId: CUISINE.japonesa, baseDishId: null },
    { id: DISH.lamen, name: 'Lámen', cuisineId: CUISINE.japonesa },
  ],
  cuisines: [
    { id: CUISINE.japonesa, name: 'Japonesa', continents: ['asia'], totalDishes: 2 },
    { id: CUISINE.brasileira, name: 'Brasileira', continents: ['america'], totalDishes: 4 },
  ],
  badgeDefinitions: [
    {
      id: BADGE.firstDish,
      name: 'Primeiro prato',
      description: 'Conclua um prato.',
      milestone: { type: 'total_dishes', quantity: 1 },
    },
    {
      id: BADGE.twoCuisines,
      name: 'Dupla cozinha',
      description: 'Conclua pratos de 2 culinárias.',
      milestone: { type: 'n_cuisines', quantity: 2 },
    },
    {
      id: BADGE.firstAdaptation,
      name: 'Do meu jeito',
      description: 'Adapte uma receita.',
      milestone: { type: 'adaptation_count', quantity: 1 },
    },
  ],
};

export async function seedCatalog(db: SqlExecutor, catalog: CatalogIndex): Promise<void> {
  await db.execute('INSERT INTO catalog_index_local (id, data, generated_at) VALUES (1, ?, ?)', [
    JSON.stringify(catalog),
    '2026-11-20T00:00:00.000Z',
  ]);
}

export async function seedRating(
  db: SqlExecutor,
  rating: {
    id: string;
    dishId: string;
    score: number;
    date: string;
    comment?: string;
    changes?: string;
  },
): Promise<void> {
  await db.execute('INSERT INTO ratings_local (id, dish_id, data, rated_on) VALUES (?, ?, ?, ?)', [
    rating.id,
    rating.dishId,
    JSON.stringify(rating),
    rating.date,
  ]);
}

export async function seedUnlock(
  db: SqlExecutor,
  kind: 'evolution' | 'badge',
  targetId: string,
  unlockedAt: string | null,
): Promise<void> {
  await db.execute('INSERT INTO unlocks_local (kind, target_id, unlocked_at) VALUES (?, ?, ?)', [
    kind,
    targetId,
    unlockedAt,
  ]);
}
