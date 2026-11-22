import { and, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Tx } from '../../../shared/tx.js';
import {
  importerIdempotencyKeys,
  importerProposals,
  type StoredProposalData,
  type StoredProposalPhoto,
  type StoredVerificationChecklist,
} from './schema.js';

export interface ProposalRecord {
  readonly id: string;
  readonly publicationState: 'proposed' | 'approved' | 'deactivated';
  readonly origin: 'manual' | 'ai';
  readonly data: StoredProposalData;
  readonly confirmedAllergenFree: boolean;
  readonly photo: StoredProposalPhoto | null;
  readonly uncertainties: readonly string[];
  readonly rawOutput: Record<string, unknown> | null;
  readonly model: string | null;
  readonly schemaVersion: string | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly verificationChecklist: StoredVerificationChecklist | null;
  readonly verifiedBy: string | null;
  readonly verifiedAt: Date | null;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IdempotencyRecord {
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly endpoint: string;
  readonly payloadHash: string;
  readonly statusCode: number;
  readonly responseBody: unknown;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

export interface CreateProposalRowInput {
  readonly id: string;
  readonly origin: 'manual' | 'ai';
  readonly data: StoredProposalData;
  readonly now: Date;
}

export interface UpdateProposalRowInput {
  readonly id: string;
  readonly publicationState?: 'proposed' | 'approved' | 'deactivated';
  readonly data?: StoredProposalData;
  readonly confirmedAllergenFree?: boolean;
  readonly photo?: StoredProposalPhoto | null;
  readonly verificationChecklist?: StoredVerificationChecklist | null;
  readonly verifiedBy?: string | null;
  readonly verifiedAt?: Date | null;
  readonly approvedBy?: string | null;
  readonly approvedAt?: Date | null;
  readonly updatedAt: Date;
}

export interface SaveIdempotencyKeyInput {
  readonly accountId: string;
  readonly idempotencyKey: string;
  readonly endpoint: string;
  readonly payloadHash: string;
  readonly statusCode: number;
  readonly responseBody: unknown;
  readonly now: Date;
  readonly expiresAt: Date;
}

function asDb(tx: Tx): NodePgDatabase {
  return tx as unknown as NodePgDatabase;
}

function toProposalRecord(row: typeof importerProposals.$inferSelect): ProposalRecord {
  return {
    id: row.id,
    publicationState: row.publicationState,
    origin: row.origin,
    data: row.data,
    confirmedAllergenFree: row.confirmedAllergenFree,
    photo: row.photo ?? null,
    uncertainties: row.uncertainties,
    rawOutput: row.rawOutput ?? null,
    model: row.model ?? null,
    schemaVersion: row.schemaVersion ?? null,
    inputTokens: row.inputTokens ?? null,
    outputTokens: row.outputTokens ?? null,
    verificationChecklist: row.verificationChecklist ?? null,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt ?? null,
    approvedBy: row.approvedBy ?? null,
    approvedAt: row.approvedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleImporterRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async acquireIdempotencyLock(accountId: string, idempotencyKey: string, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    // P05: Serialize concurrent requests sharing the same (accountId, idempotencyKey) so
    // the second request replays the committed response instead of hitting unique constraints.
    const lockKey = `${accountId}:${idempotencyKey}`;
    await dbTx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }

  async findIdempotencyKey(
    accountId: string,
    idempotencyKey: string,
    tx?: Tx,
  ): Promise<IdempotencyRecord | null> {
    const executor = tx ? asDb(tx) : this.db;
    const [row] = await executor
      .select()
      .from(importerIdempotencyKeys)
      .where(
        and(
          eq(importerIdempotencyKeys.accountId, accountId),
          eq(importerIdempotencyKeys.idempotencyKey, idempotencyKey),
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

  async saveIdempotencyKey(input: SaveIdempotencyKeyInput, tx: Tx): Promise<void> {
    const dbTx = asDb(tx);
    await dbTx.insert(importerIdempotencyKeys).values({
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
      .delete(importerIdempotencyKeys)
      .where(
        and(
          eq(importerIdempotencyKeys.accountId, accountId),
          eq(importerIdempotencyKeys.idempotencyKey, idempotencyKey),
        ),
      );
  }

  async createProposal(input: CreateProposalRowInput, tx: Tx): Promise<ProposalRecord> {
    const dbTx = asDb(tx);
    const [row] = await dbTx
      .insert(importerProposals)
      .values({
        id: input.id,
        publicationState: 'proposed',
        origin: input.origin,
        data: input.data,
        confirmedAllergenFree: false,
        photo: null,
        uncertainties: [],
        rawOutput: null,
        model: null,
        schemaVersion: null,
        inputTokens: null,
        outputTokens: null,
        verificationChecklist: null,
        verifiedBy: null,
        verifiedAt: null,
        approvedBy: null,
        approvedAt: null,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create proposal row.');
    }

    return toProposalRecord(row);
  }

  async findProposalById(id: string, tx?: Tx): Promise<ProposalRecord | null> {
    const executor = tx ? asDb(tx) : this.db;
    const [row] = await executor
      .select()
      .from(importerProposals)
      .where(eq(importerProposals.id, id))
      .limit(1);

    return row ? toProposalRecord(row) : null;
  }

  async listProposals(params: {
    readonly state?: 'proposed' | 'approved' | 'deactivated';
    readonly page: number;
    readonly size: number;
  }): Promise<{ readonly items: readonly ProposalRecord[]; readonly total: number }> {
    const condition = params.state
      ? eq(importerProposals.publicationState, params.state)
      : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(importerProposals)
        .where(condition),
      this.db
        .select()
        .from(importerProposals)
        .where(condition)
        .orderBy(desc(importerProposals.createdAt))
        .limit(params.size)
        .offset((params.page - 1) * params.size),
    ]);

    return {
      items: rows.map(toProposalRecord),
      total: countResult[0]?.count ?? 0,
    };
  }

  async updateProposal(input: UpdateProposalRowInput, tx: Tx): Promise<ProposalRecord> {
    const dbTx = asDb(tx);
    const setValues: Partial<typeof importerProposals.$inferInsert> = {
      updatedAt: input.updatedAt,
    };

    if (input.publicationState !== undefined) {
      setValues.publicationState = input.publicationState;
    }
    if (input.data !== undefined) {
      setValues.data = input.data;
    }
    if (input.confirmedAllergenFree !== undefined) {
      setValues.confirmedAllergenFree = input.confirmedAllergenFree;
    }
    if (input.photo !== undefined) {
      setValues.photo = input.photo;
    }
    if (input.verificationChecklist !== undefined) {
      setValues.verificationChecklist = input.verificationChecklist;
    }
    if (input.verifiedBy !== undefined) {
      setValues.verifiedBy = input.verifiedBy;
    }
    if (input.verifiedAt !== undefined) {
      setValues.verifiedAt = input.verifiedAt;
    }
    if (input.approvedBy !== undefined) {
      setValues.approvedBy = input.approvedBy;
    }
    if (input.approvedAt !== undefined) {
      setValues.approvedAt = input.approvedAt;
    }

    const [row] = await dbTx
      .update(importerProposals)
      .set(setValues)
      .where(eq(importerProposals.id, input.id))
      .returning();

    if (!row) {
      throw new Error('Failed to update proposal row.');
    }

    return toProposalRecord(row);
  }
}
