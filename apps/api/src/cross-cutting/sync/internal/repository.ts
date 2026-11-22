import { and, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../../db/client.js';
import type { OperationApplyResult, OperationType } from '../../../shared/operation-applier.js';
import type { Tx } from '../../../shared/tx.js';
import { syncProcessedOperations } from './schema.js';

export interface ProcessedOperationRecord {
  readonly accountId: string;
  readonly opId: string;
  readonly type: OperationType;
  readonly payloadHash: string;
  readonly status: 'confirmed' | 'rejected';
  readonly response: OperationApplyResult;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface OperationStore {
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  find(accountId: string, opId: string, tx: Tx): Promise<ProcessedOperationRecord | null>;
  save(record: ProcessedOperationRecord, tx: Tx): Promise<void>;
}

/**
 * Drizzle repository strictly scoped to `sync_processed_operations` (S8, P05, T01).
 */
export class DrizzleOperationRepository implements OperationStore {
  constructor(private readonly dbClient: DatabaseClient) {}

  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.dbClient.withTransaction(fn);
  }

  async find(accountId: string, opId: string, tx: Tx): Promise<ProcessedOperationRecord | null> {
    const rows = await tx
      .select()
      .from(syncProcessedOperations)
      .where(
        and(
          eq(syncProcessedOperations.accountId, accountId),
          eq(syncProcessedOperations.opId, opId),
        ),
      )
      .for('update');

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      accountId: row.accountId,
      opId: row.opId,
      type: row.type as OperationType,
      payloadHash: row.payloadHash,
      status: row.status,
      response: row.response,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  async save(record: ProcessedOperationRecord, tx: Tx): Promise<void> {
    await tx.insert(syncProcessedOperations).values({
      accountId: record.accountId,
      opId: record.opId,
      type: record.type,
      payloadHash: record.payloadHash,
      status: record.status,
      response: record.response,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    });
  }
}
