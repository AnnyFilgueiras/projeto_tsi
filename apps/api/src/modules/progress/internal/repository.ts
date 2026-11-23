import { asc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Tx } from '../../../shared/tx.js';
import type {
  BadgeAwardDto,
  BadgeDefinitionDto,
  ProgressPublicPort,
  ProgressSnapshotDto,
  RatingDto,
} from '../public/progress-public.js';
import {
  progressBadgeAwards,
  progressBadgeDefinitions,
  progressEvolutionUnlocks,
  progressRatings,
  type BadgeMilestone,
} from './schema.js';
import type { UnlockState } from './unlock-rules.js';

export interface RatingRecord {
  readonly id: string;
  readonly userId: string;
  readonly dishId: string;
  readonly score: number;
  readonly comment: string | null;
  readonly changes: string | null;
  readonly itemId: string | null;
  readonly ratedAt: Date;
  readonly createdAt: Date;
}

export interface BadgeDefinitionRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly milestone: BadgeMilestone;
}

export interface BadgeAwardRecord {
  readonly definitionId: string;
  readonly unlockedAt: string;
}

export interface ProgressStore {
  acquireUserLock(accountId: string, tx: Tx): Promise<void>;
  insertRating(record: RatingRecord, tx: Tx): Promise<boolean>;
  getUnlockState(accountId: string, tx?: Tx): Promise<UnlockState>;
  listBadgeDefinitions(tx?: Tx): Promise<readonly BadgeDefinitionRecord[]>;
  insertEvolutionUnlocks(
    accountId: string,
    dishIds: readonly string[],
    unlockedAt: Date,
    tx: Tx,
  ): Promise<void>;
  insertBadgeAwards(
    accountId: string,
    definitionIds: readonly string[],
    unlockedAt: Date,
    tx: Tx,
  ): Promise<void>;
}

function asDb(tx: Tx): NodePgDatabase {
  return tx as unknown as NodePgDatabase;
}

/**
 * Drizzle repository strictly scoped to `progress_*` tables (S8, T01).
 * Directly serves read queries of `ProgressPublicPort` without a shallow pass-through service.
 */
export class DrizzleProgressRepository implements ProgressStore, ProgressPublicPort {
  constructor(private readonly db: NodePgDatabase) {}

  async acquireUserLock(accountId: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    // Serialize additive unlock evaluation per user within `tx` to avoid race conditions.
    const lockKey = `progress:${accountId}`;
    await dbTx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }

  async insertRating(record: RatingRecord, tx: Tx): Promise<boolean> {
    const dbTx = asDb(tx);
    const inserted = await dbTx
      .insert(progressRatings)
      .values({
        id: record.id,
        userId: record.userId,
        dishId: record.dishId,
        score: record.score,
        comment: record.comment,
        changes: record.changes,
        itemId: record.itemId,
        ratedAt: record.ratedAt,
        createdAt: record.createdAt,
      })
      .onConflictDoNothing({
        target: [progressRatings.userId, progressRatings.id],
      })
      .returning({ id: progressRatings.id });

    return inserted.length > 0;
  }

  async getUnlockState(accountId: string, tx?: Tx): Promise<UnlockState> {
    const executor = tx ? asDb(tx) : this.db;

    const [ratingRows, evolutionRows, awardRows] = await Promise.all([
      executor
        .select({
          id: progressRatings.id,
          dishId: progressRatings.dishId,
          changes: progressRatings.changes,
        })
        .from(progressRatings)
        .where(eq(progressRatings.userId, accountId)),
      executor
        .select({ dishId: progressEvolutionUnlocks.dishId })
        .from(progressEvolutionUnlocks)
        .where(eq(progressEvolutionUnlocks.userId, accountId)),
      executor
        .select({ definitionId: progressBadgeAwards.definitionId })
        .from(progressBadgeAwards)
        .where(eq(progressBadgeAwards.userId, accountId)),
    ]);

    const completedDishIds = [...new Set(ratingRows.map((row) => row.dishId))];
    const adaptationRatingIds = ratingRows
      .filter((row) => row.changes !== null && row.changes.trim().length > 0)
      .map((row) => row.id);

    return {
      completedDishIds,
      adaptationRatingIds,
      unlockedEvolutionDishIds: evolutionRows.map((row) => row.dishId),
      awardedBadgeIds: awardRows.map((row) => row.definitionId),
    };
  }

  async listBadgeDefinitions(tx?: Tx): Promise<readonly BadgeDefinitionRecord[]> {
    const executor = tx ? asDb(tx) : this.db;
    const rows = await executor
      .select({
        id: progressBadgeDefinitions.id,
        name: progressBadgeDefinitions.name,
        description: progressBadgeDefinitions.description,
        milestone: progressBadgeDefinitions.milestone,
      })
      .from(progressBadgeDefinitions)
      .orderBy(asc(progressBadgeDefinitions.id));

    return rows;
  }

  async insertEvolutionUnlocks(
    accountId: string,
    dishIds: readonly string[],
    unlockedAt: Date,
    tx: Tx,
  ): Promise<void> {
    if (dishIds.length === 0) {
      return;
    }

    const dbTx = asDb(tx);
    await dbTx
      .insert(progressEvolutionUnlocks)
      .values(
        dishIds.map((dishId) => ({
          userId: accountId,
          dishId,
          unlockedAt,
        })),
      )
      .onConflictDoNothing({
        target: [progressEvolutionUnlocks.userId, progressEvolutionUnlocks.dishId],
      });
  }

  async insertBadgeAwards(
    accountId: string,
    definitionIds: readonly string[],
    unlockedAt: Date,
    tx: Tx,
  ): Promise<void> {
    if (definitionIds.length === 0) {
      return;
    }

    const dbTx = asDb(tx);
    await dbTx
      .insert(progressBadgeAwards)
      .values(
        definitionIds.map((definitionId) => ({
          userId: accountId,
          definitionId,
          unlockedAt,
        })),
      )
      .onConflictDoNothing({
        target: [progressBadgeAwards.userId, progressBadgeAwards.definitionId],
      });
  }

  async getCompletedDishIds(accountId: string): Promise<readonly string[]> {
    const rows = await this.db
      .selectDistinct({ dishId: progressRatings.dishId })
      .from(progressRatings)
      .where(eq(progressRatings.userId, accountId));

    return rows.map((row) => row.dishId);
  }

  async getProgressSnapshot(accountId: string): Promise<ProgressSnapshotDto> {
    const [ratingRows, awardRows, evolutionRows, badgeDefinitions] = await Promise.all([
      this.db
        .select()
        .from(progressRatings)
        .where(eq(progressRatings.userId, accountId))
        .orderBy(asc(progressRatings.ratedAt), asc(progressRatings.id)),
      this.db
        .select()
        .from(progressBadgeAwards)
        .where(eq(progressBadgeAwards.userId, accountId))
        .orderBy(asc(progressBadgeAwards.unlockedAt), asc(progressBadgeAwards.definitionId)),
      this.db
        .select({ dishId: progressEvolutionUnlocks.dishId })
        .from(progressEvolutionUnlocks)
        .where(eq(progressEvolutionUnlocks.userId, accountId))
        .orderBy(asc(progressEvolutionUnlocks.dishId)),
      this.listBadgeDefinitions(),
    ]);

    const ratings: RatingDto[] = ratingRows.map((row) => ({
      id: row.id,
      dishId: row.dishId,
      score: row.score,
      ...(row.comment !== null ? { comment: row.comment } : {}),
      ...(row.changes !== null ? { changes: row.changes } : {}),
      date: row.ratedAt.toISOString(),
    }));

    const badgeAwards: BadgeAwardDto[] = awardRows.map((row) => ({
      definitionId: row.definitionId,
      unlockedAt: row.unlockedAt.toISOString(),
    }));

    const definitions: BadgeDefinitionDto[] = badgeDefinitions.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      milestone: row.milestone,
    }));

    return {
      ratings,
      badgeAwards,
      evolutionUnlocks: evolutionRows.map((row) => row.dishId),
      badgeDefinitions: definitions,
    };
  }

  async deleteData(accountId: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    await dbTx.delete(progressBadgeAwards).where(eq(progressBadgeAwards.userId, accountId));
    await dbTx
      .delete(progressEvolutionUnlocks)
      .where(eq(progressEvolutionUnlocks.userId, accountId));
    await dbTx.delete(progressRatings).where(eq(progressRatings.userId, accountId));
  }
}
