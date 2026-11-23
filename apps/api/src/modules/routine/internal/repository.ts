import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  HttpIdempotencyRecord,
  HttpIdempotencyStore,
  SaveHttpIdempotencyInput,
} from '../../../shared/http-idempotency.js';
import type { Tx } from '../../../shared/tx.js';
import type { SuggestionRecord } from '../public/routine-public.js';
import { routineIdempotencyKeys, routineSuggestions, type SuggestionStatus } from './schema.js';

export interface InsertSuggestionInput {
  readonly id: string;
  readonly userId: string;
  readonly dishId: string;
  readonly status: SuggestionStatus;
  readonly sessionKey: string;
  readonly presentedAt: Date;
}

export interface RoutineSuggestionStore extends HttpIdempotencyStore {
  listCandidateSuggestions(accountId: string): Promise<readonly SuggestionRecord[]>;
  listDiscardedDishIdsInSession(accountId: string, sessionKey: string): Promise<readonly string[]>;
  findPresentedInSessionByDishIds(
    accountId: string,
    sessionKey: string,
    dishIds: readonly string[],
    tx?: Tx,
  ): Promise<readonly SuggestionRecord[]>;
  insertSuggestions(rows: readonly InsertSuggestionInput[], tx?: Tx): Promise<void>;
  findSuggestionByIdForUser(
    accountId: string,
    suggestionId: string,
    tx?: Tx,
  ): Promise<SuggestionRecord | null>;
  findCandidateByDishForUser(
    accountId: string,
    dishId: string,
    tx?: Tx,
  ): Promise<SuggestionRecord | null>;
  updateSuggestionStatus(
    accountId: string,
    suggestionId: string,
    status: SuggestionStatus,
    sessionKey: string | undefined,
    decidedAt: Date,
    tx: Tx,
  ): Promise<SuggestionRecord | null>;
  deleteData(accountId: string, tx: Tx): Promise<void>;
}

function asDb(tx: Tx): NodePgDatabase {
  return tx as unknown as NodePgDatabase;
}

function toSuggestionRecord(row: typeof routineSuggestions.$inferSelect): SuggestionRecord {
  return {
    id: row.id,
    userId: row.userId,
    dishId: row.dishId,
    status: row.status,
    sessionKey: row.sessionKey,
    presentedAt: row.presentedAt.toISOString(),
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  };
}

/**
 * Drizzle repository strictly scoped to `routine_*` tables (S8, P05).
 */
export class DrizzleRoutineRepository implements RoutineSuggestionStore {
  constructor(private readonly db: NodePgDatabase) {}

  async acquireIdempotencyLock(accountId: string, idempotencyKey: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    const lockKey = `routine:${accountId}:${idempotencyKey}`;
    await dbTx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }

  async findIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
    tx?: Tx,
  ): Promise<HttpIdempotencyRecord | null> {
    const executor = tx ? asDb(tx) : this.db;
    const [row] = await executor
      .select()
      .from(routineIdempotencyKeys)
      .where(
        and(
          eq(routineIdempotencyKeys.accountId, accountId),
          eq(routineIdempotencyKeys.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      accountId: row.accountId,
      idempotencyKey: row.idempotencyKey,
      endpoint: row.endpoint,
      payloadHash: row.payloadHash,
      statusCode: row.statusCode,
      responseBody: row.responseBody,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  async saveIdempotencyKey(input: SaveHttpIdempotencyInput, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    await dbTx.insert(routineIdempotencyKeys).values({
      accountId: input.accountId,
      idempotencyKey: input.idempotencyKey,
      endpoint: input.endpoint,
      payloadHash: input.payloadHash,
      statusCode: input.statusCode,
      responseBody: input.responseBody,
      createdAt: input.now,
      expiresAt: input.expiresAt,
    });
  }

  async deleteIdempotencyKey(accountId: string, idempotencyKey: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    await dbTx
      .delete(routineIdempotencyKeys)
      .where(
        and(
          eq(routineIdempotencyKeys.accountId, accountId),
          eq(routineIdempotencyKeys.idempotencyKey, idempotencyKey),
        ),
      );
  }

  async listCandidateSuggestions(accountId: string): Promise<readonly SuggestionRecord[]> {
    const rows = await this.db
      .select()
      .from(routineSuggestions)
      .where(
        and(eq(routineSuggestions.userId, accountId), eq(routineSuggestions.status, 'candidate')),
      )
      .orderBy(asc(routineSuggestions.decidedAt), asc(routineSuggestions.id));

    return rows.map(toSuggestionRecord);
  }

  async listDiscardedDishIdsInSession(
    accountId: string,
    sessionKey: string,
  ): Promise<readonly string[]> {
    const rows = await this.db
      .selectDistinct({ dishId: routineSuggestions.dishId })
      .from(routineSuggestions)
      .where(
        and(
          eq(routineSuggestions.userId, accountId),
          eq(routineSuggestions.status, 'discarded'),
          eq(routineSuggestions.sessionKey, sessionKey),
        ),
      );

    return rows.map((row) => row.dishId);
  }

  async findPresentedInSessionByDishIds(
    accountId: string,
    sessionKey: string,
    dishIds: readonly string[],
    tx?: Tx,
  ): Promise<readonly SuggestionRecord[]> {
    if (dishIds.length === 0) {
      return [];
    }

    const executor = tx ? asDb(tx) : this.db;
    const rows = await executor
      .select()
      .from(routineSuggestions)
      .where(
        and(
          eq(routineSuggestions.userId, accountId),
          eq(routineSuggestions.sessionKey, sessionKey),
          eq(routineSuggestions.status, 'presented'),
          inArray(routineSuggestions.dishId, [...dishIds]),
        ),
      );

    return rows.map(toSuggestionRecord);
  }

  async insertSuggestions(rows: readonly InsertSuggestionInput[], tx?: Tx): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const executor = tx ? asDb(tx) : this.db;
    await executor.insert(routineSuggestions).values(
      rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        dishId: row.dishId,
        status: row.status,
        sessionKey: row.sessionKey,
        presentedAt: row.presentedAt,
        decidedAt: null,
      })),
    );
  }

  async findSuggestionByIdForUser(
    accountId: string,
    suggestionId: string,
    tx?: Tx,
  ): Promise<SuggestionRecord | null> {
    const executor = tx ? asDb(tx) : this.db;
    const baseQuery = executor
      .select()
      .from(routineSuggestions)
      .where(and(eq(routineSuggestions.id, suggestionId), eq(routineSuggestions.userId, accountId)))
      .limit(1);
    // Lock the suggestion row inside `tx` so concurrent approve/discard requests serialize cleanly.
    const [row] = tx ? await baseQuery.for('update') : await baseQuery;

    return row ? toSuggestionRecord(row) : null;
  }

  async findCandidateByDishForUser(
    accountId: string,
    dishId: string,
    tx?: Tx,
  ): Promise<SuggestionRecord | null> {
    const executor = tx ? asDb(tx) : this.db;
    const [row] = await executor
      .select()
      .from(routineSuggestions)
      .where(
        and(
          eq(routineSuggestions.userId, accountId),
          eq(routineSuggestions.dishId, dishId),
          eq(routineSuggestions.status, 'candidate'),
        ),
      )
      .limit(1);

    return row ? toSuggestionRecord(row) : null;
  }

  async updateSuggestionStatus(
    accountId: string,
    suggestionId: string,
    status: SuggestionStatus,
    sessionKey: string | undefined,
    decidedAt: Date,
    tx: Tx,
  ): Promise<SuggestionRecord | null> {
    const dbTx = asDb(tx);
    const [row] = await dbTx
      .update(routineSuggestions)
      .set({
        status,
        decidedAt,
        ...(sessionKey !== undefined ? { sessionKey } : {}),
      })
      .where(and(eq(routineSuggestions.id, suggestionId), eq(routineSuggestions.userId, accountId)))
      .returning();

    return row ? toSuggestionRecord(row) : null;
  }

  async deleteData(accountId: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    await dbTx
      .delete(routineIdempotencyKeys)
      .where(eq(routineIdempotencyKeys.accountId, accountId));
    await dbTx.delete(routineSuggestions).where(eq(routineSuggestions.userId, accountId));
  }
}
