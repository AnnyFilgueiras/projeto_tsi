import { assertTestDatabaseUrl } from '../../src/db/test-guard.js';

const DEFAULT_TEST_DATABASE_URL = 'postgresql://panelada:panelada@localhost:5432/panelada_test';

// Fail fast before any integration suite runs if DATABASE_URL does not target a `*_test` database.
const targetUrl =
  process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

process.env.DATABASE_URL = assertTestDatabaseUrl(targetUrl);
