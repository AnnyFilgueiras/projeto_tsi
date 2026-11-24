import type { Migration } from './migrator';

/**
 * Local schema for the Stage 1 offline copy (ADR-008, MVP-04D).
 *
 * Append-only: never edit a shipped migration, add a new version instead — devices that already
 * ran it would never see the change. Rich nested API objects are stored as JSON in `data` columns
 * because the app reads them whole; columns exist only where we filter or join locally.
 *
 * Restrictions live here in clear text on purpose: the whole file is encrypted by SQLCipher
 * (ADR-005, A05), and they must be readable offline to filter suggestions.
 */
export const LOCAL_MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'stage-1-offline-copy',
    statements: [
      `CREATE TABLE profile_local (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT,
        culinary_preferences TEXT NOT NULL DEFAULT '[]',
        reminders TEXT,
        onboarded_at TEXT,
        updated_at TEXT
      )`,
      `CREATE TABLE restrictions_local (
        restriction_type TEXT PRIMARY KEY,
        consent_at TEXT NOT NULL
      )`,
      `CREATE TABLE candidates_local (
        suggestion_id TEXT PRIMARY KEY,
        dish_id TEXT NOT NULL,
        data TEXT NOT NULL
      )`,
      `CREATE TABLE recipes_local (
        dish_id TEXT PRIMARY KEY,
        updated_at TEXT NOT NULL,
        photo_hash TEXT,
        data TEXT NOT NULL,
        downloaded_at TEXT NOT NULL
      )`,
      // "em preparo" exists only on the device and never syncs (GLOSSARY, RoutineItem.status).
      `CREATE TABLE local_cooking_state (
        routine_item_id TEXT PRIMARY KEY,
        dish_id TEXT NOT NULL,
        started_at TEXT NOT NULL
      )`,
      `CREATE TABLE ratings_local (
        id TEXT PRIMARY KEY,
        dish_id TEXT NOT NULL,
        data TEXT NOT NULL,
        rated_on TEXT NOT NULL
      )`,
      // Unlocks only accumulate (RN04): rows are inserted, never revoked.
      `CREATE TABLE unlocks_local (
        kind TEXT NOT NULL CHECK (kind IN ('evolution', 'badge')),
        target_id TEXT NOT NULL,
        unlocked_at TEXT,
        PRIMARY KEY (kind, target_id)
      )`,
      `CREATE TABLE meta_sync (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
  },
];
