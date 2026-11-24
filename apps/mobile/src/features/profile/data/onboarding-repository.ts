import type { LocalDatabase } from '../../../core/local-db/local-database';

/**
 * Remembers that the quick onboarding was completed (MVP-01: shown only on first launch).
 * Device-only state in `profile_local.onboarded_at`; the download-set sync preserves it.
 */
export interface OnboardingRepository {
  isCompleted(): Promise<boolean>;
  markCompleted(at: Date): Promise<void>;
}

export function createOnboardingRepository(db: LocalDatabase): OnboardingRepository {
  return {
    async isCompleted() {
      const [row] = await db.query<{ onboarded_at: string | null }>(
        'SELECT onboarded_at FROM profile_local WHERE id = 1',
      );
      return Boolean(row?.onboarded_at);
    },
    async markCompleted(at) {
      await db.execute(
        `INSERT INTO profile_local (id, onboarded_at) VALUES (1, ?)
         ON CONFLICT (id) DO UPDATE SET onboarded_at = excluded.onboarded_at`,
        [at.toISOString()],
      );
    },
  };
}
