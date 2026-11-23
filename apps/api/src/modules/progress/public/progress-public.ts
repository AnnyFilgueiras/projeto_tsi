import type { Tx } from '../../../shared/tx.js';
import type { BadgeMilestone } from '../internal/schema.js';

export type { BadgeMilestone };

export interface RatingDto {
  readonly id: string;
  readonly dishId: string;
  readonly score: number;
  readonly comment?: string;
  readonly changes?: string;
  readonly date: string;
}

export interface BadgeAwardDto {
  readonly definitionId: string;
  readonly unlockedAt: string;
}

export interface BadgeDefinitionDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly milestone: BadgeMilestone;
}

export interface ProgressSnapshotDto {
  readonly ratings: readonly RatingDto[];
  readonly badgeAwards: readonly BadgeAwardDto[];
  readonly evolutionUnlocks: readonly string[];
  readonly badgeDefinitions: readonly BadgeDefinitionDto[];
}

/**
 * Public facade for the progress & gamification module (P06, S1, A12).
 */
export interface ProgressPublicPort {
  getCompletedDishIds(accountId: string): Promise<readonly string[]>;
  getProgressSnapshot(accountId: string): Promise<ProgressSnapshotDto>;
  deleteData(accountId: string, tx: Tx): Promise<void>;
}
