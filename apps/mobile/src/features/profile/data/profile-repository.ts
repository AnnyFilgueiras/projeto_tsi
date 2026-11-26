import type { LocalDatabase } from '../../../core/local-db/local-database';
import type { ProfileReader } from '../domain/profile-snapshot';

/**
 * Read side of the Profile tab, straight from the local copy so it opens offline (ADR-008).
 * Writes never go through here: they are operations or the preferences PUT, and the local copy
 * changes only after the server confirms.
 */
export function createProfileRepository(db: LocalDatabase): ProfileReader {
  return {
    async read() {
      const restrictionRows = await db.query<{ restriction_type: string; consent_at: string }>(
        'SELECT restriction_type, consent_at FROM restrictions_local ORDER BY restriction_type',
      );
      const [profileRow] = await db.query<{ culinary_preferences: string }>(
        'SELECT culinary_preferences FROM profile_local WHERE id = 1',
      );
      const [syncRow] = await db.query<{ value: string }>(
        "SELECT value FROM meta_sync WHERE key = 'lastSyncAt'",
      );

      // Each row carries its own consent_at (codes added later get a newer one); the earliest is
      // when the user first agreed. ISO strings in UTC sort chronologically.
      const firstConsent = restrictionRows.map((row) => row.consent_at).sort()[0];

      return {
        restrictions: restrictionRows.map((row) => row.restriction_type),
        consentAt: firstConsent ? new Date(firstConsent) : null,
        preferences: profileRow ? (JSON.parse(profileRow.culinary_preferences) as string[]) : [],
        lastSyncAt: syncRow ? new Date(syncRow.value) : null,
      };
    },
  };
}
