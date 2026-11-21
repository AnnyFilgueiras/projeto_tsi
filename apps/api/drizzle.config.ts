import { defineConfig } from 'drizzle-kit';

const DEFAULT_DEV_DATABASE_URL = 'postgresql://panelada:panelada@localhost:5432/panelada_dev';

// S8: table definitions stay private inside each owning module's internal/schema.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/modules/*/internal/schema.ts', './src/cross-cutting/*/internal/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
