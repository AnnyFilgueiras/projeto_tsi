import { createHash } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { hashPassword } from '../shared/password-hash.js';
import { createTechnicalLogger } from '../support/technical-log/logger.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './client.js';
import {
  SEED_BADGES,
  SEED_CUISINES,
  SEED_DISHES,
  SEED_INGREDIENTS,
  SEED_SUBSTITUTIONS,
  SEED_UTENSILS,
} from './seed-catalog-data.js';

export const SEED_CURATOR_ACCOUNT_ID = '00000000-0000-4000-8000-000000000001';
export const DEFAULT_SEED_CURATOR_EMAIL = 'curador@panelada.local';
export const DEFAULT_SEED_CURATOR_PASSWORD = 'panelada-curador-dev';

interface RestrictionTypeSeedRow {
  readonly code: string;
  readonly name: string;
  readonly associatedAllergens: readonly string[];
}

// Fixed 19-entry catalog: 18 mandatory allergens from ANVISA RDC 727/2022 Annex III + lactose (ADR-014, ADR-015).
const RESTRICTION_TYPE_SEEDS: readonly RestrictionTypeSeedRow[] = [
  {
    code: 'trigo_centeio_cevada_aveia',
    name: 'Trigo, centeio, cevada e aveia (glúten)',
    associatedAllergens: ['trigo_centeio_cevada_aveia'],
  },
  { code: 'crustaceos', name: 'Crustáceos', associatedAllergens: ['crustaceos'] },
  { code: 'ovo', name: 'Ovo', associatedAllergens: ['ovo'] },
  { code: 'peixe', name: 'Peixe', associatedAllergens: ['peixe'] },
  { code: 'amendoim', name: 'Amendoim', associatedAllergens: ['amendoim'] },
  { code: 'soja', name: 'Soja', associatedAllergens: ['soja'] },
  { code: 'leite', name: 'Leite', associatedAllergens: ['leite'] },
  { code: 'amendoa', name: 'Amêndoa', associatedAllergens: ['amendoa'] },
  { code: 'avela', name: 'Avelã', associatedAllergens: ['avela'] },
  { code: 'castanha_caju', name: 'Castanha-de-caju', associatedAllergens: ['castanha_caju'] },
  {
    code: 'castanha_brasil',
    name: 'Castanha-do-brasil / Castanha-do-pará',
    associatedAllergens: ['castanha_brasil'],
  },
  { code: 'macadamia', name: 'Macadâmia', associatedAllergens: ['macadamia'] },
  { code: 'noz', name: 'Noz', associatedAllergens: ['noz'] },
  { code: 'peca', name: 'Pecã', associatedAllergens: ['peca'] },
  { code: 'pistache', name: 'Pistache', associatedAllergens: ['pistache'] },
  { code: 'pinoli', name: 'Pinoli', associatedAllergens: ['pinoli'] },
  {
    code: 'castanha_castanea',
    name: 'Castanha (Castanea)',
    associatedAllergens: ['castanha_castanea'],
  },
  { code: 'latex', name: 'Látex natural', associatedAllergens: ['latex'] },
  { code: 'lactose', name: 'Lactose', associatedAllergens: ['lactose'] },
];

export interface RunSeedOptions {
  readonly photoStorageDir?: string;
}

async function generateSeedWebpPhoto(
  rgb: readonly [number, number, number],
): Promise<{ readonly hash: string; readonly bytes: Buffer }> {
  const bytes = await sharp({
    create: {
      width: 320,
      height: 240,
      channels: 3,
      background: { r: rgb[0], g: rgb[1], b: rgb[2] },
    },
  })
    .webp({ quality: 82 })
    .toBuffer();

  const hash = createHash('sha256').update(bytes).digest('hex');
  return { hash, bytes };
}

async function writeSeedPhotoFile(directory: string, hash: string, bytes: Buffer): Promise<void> {
  await mkdir(directory, { recursive: true });
  const targetPath = path.join(directory, `${hash}.webp`);
  const tmpPath = `${targetPath}.tmp-${process.pid}`;
  await writeFile(tmpPath, bytes);
  await rename(tmpPath, targetPath);
}

/**
 * Deterministic, idempotent development seed entrypoint.
 *
 * Populates:
 * - 19 controlled restriction types (ANVISA RDC 727/2022 + lactose)
 * - Default curator account (`CURATOR_EMAIL` / `CURATOR_PASSWORD`)
 * - 10 cuisines across all 5 continents, canonical ingredients, utensils, and safe/unsafe substitutions
 * - 20 dishes (18 verified, 1 source_declared, 1 unverified), including a 3-level evolution chain and
 *   allergen-free dishes, + WebP photos
 * - 11 declarative badge definitions exercising all 8 RN03 (a-h) milestone types
 */
export async function runSeed(
  connectionString: string,
  options: RunSeedOptions = {},
): Promise<void> {
  const client = createDatabaseClient(connectionString);
  const photoDir =
    options.photoStorageDir ??
    process.env.PHOTO_STORAGE_DIR?.trim() ??
    path.resolve(process.cwd(), '.data/photos');

  try {
    const healthy = await client.checkHealth();
    if (!healthy) {
      throw new Error('Database connectivity check failed during seed.');
    }

    for (const item of RESTRICTION_TYPE_SEEDS) {
      await client.pool.query(
        `INSERT INTO profile_restriction_types (code, name, associated_allergens)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (code) DO NOTHING`,
        [item.code, item.name, JSON.stringify(item.associatedAllergens)],
      );
    }

    const curatorEmail = (process.env.CURATOR_EMAIL ?? DEFAULT_SEED_CURATOR_EMAIL)
      .trim()
      .toLowerCase();
    const curatorPassword = process.env.CURATOR_PASSWORD ?? DEFAULT_SEED_CURATOR_PASSWORD;

    const existingCurator = await client.pool.query<{ id: string }>(
      `SELECT id FROM identity_accounts WHERE id = $1 OR email = $2 LIMIT 1`,
      [SEED_CURATOR_ACCOUNT_ID, curatorEmail],
    );

    if (existingCurator.rows.length === 0) {
      const passwordHash = await hashPassword(curatorPassword);
      await client.pool.query(
        `INSERT INTO identity_accounts (id, role, email, password_hash)
         VALUES ($1, 'curator', $2, $3)
         ON CONFLICT DO NOTHING`,
        [SEED_CURATOR_ACCOUNT_ID, curatorEmail, passwordHash],
      );
    }

    for (const cuisine of SEED_CUISINES) {
      await client.pool.query(
        `INSERT INTO catalog_cuisines (id, name, continents)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [cuisine.id, cuisine.name, JSON.stringify(cuisine.continents)],
      );
    }

    const ingredientAllergensById = new Map<string, readonly string[]>();
    for (const ingredient of SEED_INGREDIENTS) {
      ingredientAllergensById.set(ingredient.id, ingredient.allergens);
      await client.pool.query(
        `INSERT INTO catalog_ingredients (id, name, allergens, lactose_free)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (id) DO NOTHING`,
        [
          ingredient.id,
          ingredient.name,
          JSON.stringify(ingredient.allergens),
          ingredient.lactoseFree,
        ],
      );
    }

    for (const utensil of SEED_UTENSILS) {
      await client.pool.query(
        `INSERT INTO catalog_utensils (id, name)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [utensil.id, utensil.name],
      );
    }

    for (const sub of SEED_SUBSTITUTIONS) {
      await client.pool.query(
        `INSERT INTO catalog_ingredient_substitutions (
           id, ingredient_id, substitute_id, substitute_allergens,
           allergen_state, confirmed_allergen_free, origin, approved_by
         )
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
         ON CONFLICT (ingredient_id, substitute_id) DO NOTHING`,
        [
          sub.id,
          sub.ingredientId,
          sub.substituteId,
          JSON.stringify(sub.substituteAllergens),
          sub.allergenState,
          sub.confirmedAllergenFree,
          sub.origin,
          SEED_CURATOR_ACCOUNT_ID,
        ],
      );
    }

    const seedTimestamp = new Date('2026-11-22T00:00:00.000Z');
    for (const dish of SEED_DISHES) {
      const allergenUnion = [
        ...new Set(
          dish.ingredients.flatMap((item) => ingredientAllergensById.get(item.ingredientId) ?? []),
        ),
      ];
      const allergenState = dish.allergenState ?? 'verified';
      // ADR-014 invariant: only a verified recipe may assert it is free of allergens.
      const confirmedAllergenFree = allergenState === 'verified' && allergenUnion.length === 0;
      const photo = await generateSeedWebpPhoto(dish.photoColor);

      if (photoDir) {
        await writeSeedPhotoFile(photoDir, photo.hash, photo.bytes);
      }

      await client.pool.query(
        `INSERT INTO catalog_dishes (
           id, name, cuisine_id, base_dish_id, publication_state, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, 'approved', $5, $5)
         ON CONFLICT (id) DO NOTHING`,
        [dish.id, dish.name, dish.cuisineId, dish.baseDishId, seedTimestamp],
      );

      await client.pool.query(
        `INSERT INTO catalog_recipes (
           dish_id, prep_time_minutes, difficulty, steps, allergens, allergen_state,
           confirmed_allergen_free, allergens_updated_at, source_name, source_url, origin, updated_at
         )
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $10, $6, $7, $8, $9, 'manual', $7)
         ON CONFLICT (dish_id) DO NOTHING`,
        [
          dish.id,
          dish.prepTimeMinutes,
          dish.difficulty,
          JSON.stringify(dish.steps),
          JSON.stringify(allergenUnion),
          confirmedAllergenFree,
          seedTimestamp,
          dish.sourceName,
          dish.sourceUrl,
          allergenState,
        ],
      );

      for (let position = 0; position < dish.ingredients.length; position += 1) {
        const ing = dish.ingredients[position]!;
        await client.pool.query(
          `INSERT INTO catalog_recipe_ingredients (dish_id, ingredient_id, position, quantity, unit)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (dish_id, ingredient_id) DO NOTHING`,
          [dish.id, ing.ingredientId, position, ing.quantity, ing.unit],
        );
      }

      for (const utensilId of dish.utensilIds) {
        await client.pool.query(
          `INSERT INTO catalog_recipe_utensils (dish_id, utensil_id)
           VALUES ($1, $2)
           ON CONFLICT (dish_id, utensil_id) DO NOTHING`,
          [dish.id, utensilId],
        );
      }

      await client.pool.query(
        `INSERT INTO catalog_dish_photos (
           dish_id, file_hash, author, title, source_url, license, license_url, modified, created_at
         )
         VALUES ($1, $2, $3, $4, $5, 'own_work', NULL, false, $6)
         ON CONFLICT (dish_id) DO NOTHING`,
        [dish.id, photo.hash, 'Equipe Panelada', dish.name, dish.sourceUrl, seedTimestamp],
      );
    }

    for (const badge of SEED_BADGES) {
      await client.pool.query(
        `INSERT INTO progress_badge_definitions (id, name, description, milestone)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [badge.id, badge.name, badge.description, JSON.stringify(badge.milestone)],
      );
    }
  } finally {
    await client.close();
  }
}

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const logger = createTechnicalLogger();
  const connectionString = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
  runSeed(connectionString)
    .then(() => {
      logger.info('Database seed completed (idempotent MVP-04B catalog, badges, and fixtures)');
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Database seed failed');
      process.exit(1);
    });
}
