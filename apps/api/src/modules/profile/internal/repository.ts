import { and, eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Tx } from '../../../shared/tx.js';
import { profileRestrictions, profileUsers } from './schema.js';
import type { ProfileStore, StoredUserRestriction } from './service.js';

/**
 * Drizzle repository strictly scoped to `profile_*` tables (S8, T01).
 */
export class DrizzleProfileRepository implements ProfileStore {
  constructor(private readonly db: NodePgDatabase) {}

  async createProfile(accountId: string, tx: Tx): Promise<void> {
    await tx
      .insert(profileUsers)
      .values({
        id: accountId,
        culinaryPreferences: [],
      })
      .onConflictDoNothing({ target: profileUsers.id });
  }

  async deleteData(accountId: string, tx: Tx): Promise<void> {
    await tx.delete(profileRestrictions).where(eq(profileRestrictions.userId, accountId));
    await tx.delete(profileUsers).where(eq(profileUsers.id, accountId));
  }

  async lockUserForUpdate(accountId: string, tx: Tx): Promise<boolean> {
    const rows = await tx
      .select({ id: profileUsers.id })
      .from(profileUsers)
      .where(eq(profileUsers.id, accountId))
      .for('update');
    return rows.length > 0;
  }

  async updatePreferences(accountId: string, cuisineIds: readonly string[]): Promise<boolean> {
    const updated = await this.db
      .update(profileUsers)
      .set({
        culinaryPreferences: [...cuisineIds],
        updatedAt: new Date(),
      })
      .where(eq(profileUsers.id, accountId))
      .returning({ id: profileUsers.id });
    return updated.length > 0;
  }

  async getPreferences(accountId: string): Promise<readonly string[]> {
    const rows = await this.db
      .select({ culinaryPreferences: profileUsers.culinaryPreferences })
      .from(profileUsers)
      .where(eq(profileUsers.id, accountId));
    return rows[0]?.culinaryPreferences ?? [];
  }

  async listRestrictions(accountId: string, tx?: Tx): Promise<readonly StoredUserRestriction[]> {
    const executor = tx ?? this.db;
    const rows = await executor
      .select({
        id: profileRestrictions.id,
        userId: profileRestrictions.userId,
        encryptedType: profileRestrictions.encryptedType,
        iv: profileRestrictions.iv,
        authTag: profileRestrictions.authTag,
        keyVersion: profileRestrictions.keyVersion,
        consentAt: profileRestrictions.consentAt,
        createdAt: profileRestrictions.createdAt,
      })
      .from(profileRestrictions)
      .where(eq(profileRestrictions.userId, accountId));

    return rows;
  }

  async insertRestriction(record: StoredUserRestriction, tx: Tx): Promise<void> {
    await tx.insert(profileRestrictions).values({
      id: record.id,
      userId: record.userId,
      encryptedType: record.encryptedType,
      iv: record.iv,
      authTag: record.authTag,
      keyVersion: record.keyVersion,
      consentAt: record.consentAt,
      createdAt: record.createdAt,
    });
  }

  async updateRestriction(record: StoredUserRestriction, tx: Tx): Promise<void> {
    await tx
      .update(profileRestrictions)
      .set({
        encryptedType: record.encryptedType,
        iv: record.iv,
        authTag: record.authTag,
        keyVersion: record.keyVersion,
        consentAt: record.consentAt,
      })
      .where(
        and(eq(profileRestrictions.id, record.id), eq(profileRestrictions.userId, record.userId)),
      );
  }

  async deleteRestrictionsByIds(
    accountId: string,
    restrictionIds: readonly string[],
    tx: Tx,
  ): Promise<void> {
    if (restrictionIds.length === 0) {
      return;
    }
    // RN09 / ADR-006: Physical DELETE — revoked dietary restrictions are never soft-deleted.
    await tx
      .delete(profileRestrictions)
      .where(
        and(
          eq(profileRestrictions.userId, accountId),
          inArray(profileRestrictions.id, [...restrictionIds]),
        ),
      );
  }
}
