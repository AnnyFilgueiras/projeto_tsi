import { DEFAULT_DEV_DATABASE_URL } from './db/client.js';
import { runSeed } from './db/seed.js';
import { createPhotoStorageFromEnv } from './modules/catalog/public/photo-storage.js';
import { createTechnicalLogger } from './support/technical-log/logger.js';

// Composition root for `pnpm db:seed`: wiring the catalog PhotoStorage here lets the same seed
// publish photos to local disk (Docker) or Supabase Storage (Cloud 4C) via PHOTO_STORAGE_DRIVER.
const logger = createTechnicalLogger();
const connectionString = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
const photoStorage = createPhotoStorageFromEnv();

runSeed(connectionString, { savePhoto: (hash, bytes) => photoStorage.save(hash, bytes) })
  .then(() => {
    logger.info('Database seed completed (idempotent MVP-04B catalog, badges, and fixtures)');
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'Database seed failed');
    process.exit(1);
  });
