import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../shared/password-hash.js';
import { createTechnicalLogger } from '../support/technical-log/logger.js';
import { createDatabaseClient, DEFAULT_DEV_DATABASE_URL } from './client.js';

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

/**
 * Deterministic, idempotent development seed entrypoint.
 *
 * MVP-04A seeds the 19 controlled restriction types (ANVISA RDC 727/2022 + lactose)
 * and the default curator account (`CURATOR_EMAIL` / `CURATOR_PASSWORD`) for MVP-04B curation flows.
 */
export async function runSeed(connectionString: string): Promise<void> {
  const client = createDatabaseClient(connectionString);
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
      logger.info('Database seed completed (idempotent MVP-04A fixtures)');
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Database seed failed');
      process.exit(1);
    });
}
