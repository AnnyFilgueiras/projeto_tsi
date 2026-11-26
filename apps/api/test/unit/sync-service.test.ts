import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { describe, expect, it } from 'vitest';
import {
  DuplicateOperationApplierError,
  MissingOperationApplierError,
  OperationApplierRegistry,
  SyncService,
  type OperationStore,
  type ProcessedOperationRecord,
} from '../../src/cross-cutting/sync/index.js';
import type { OperationApplier, OperationEnvelope } from '../../src/shared/operation-applier.js';
import type { Tx } from '../../src/shared/tx.js';

const FAKE_TX = {} as Tx;

class InMemoryOperationStore implements OperationStore {
  readonly records = new Map<string, ProcessedOperationRecord>();

  private key(accountId: string, opId: string): string {
    return `${accountId}:${opId}`;
  }

  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return fn(FAKE_TX);
  }

  async find(accountId: string, opId: string, _tx: Tx): Promise<ProcessedOperationRecord | null> {
    return this.records.get(this.key(accountId, opId)) ?? null;
  }

  async save(record: ProcessedOperationRecord, _tx: Tx): Promise<void> {
    this.records.set(this.key(record.accountId, record.opId), record);
  }
}

describe('OperationApplierRegistry and SyncService (A08, ADR-008, P01, P05)', () => {
  it('P01: rejects duplicate operation types at boot and enforces completeness when requireAllTypes is enabled', () => {
    const first: OperationApplier<'restriction.register'> = {
      operationType: 'restriction.register',
      async apply() {
        return { status: 'confirmed' };
      },
    };
    const duplicate: OperationApplier<'restriction.register'> = {
      operationType: 'restriction.register',
      async apply() {
        return { status: 'confirmed' };
      },
    };

    expect(() => new OperationApplierRegistry([first, duplicate])).toThrow(
      DuplicateOperationApplierError,
    );

    expect(() => new OperationApplierRegistry([first], { requireAllTypes: true })).toThrow(
      MissingOperationApplierError,
    );
  });

  it('P05 / A08: applies a new operation once, replays identical opId + payload as repeated=true, and rejects same opId with different payload as 422 key-reused', async () => {
    let applyCount = 0;
    const applier: OperationApplier<'restriction.register'> = {
      operationType: 'restriction.register',
      async apply(_op, ctx) {
        expect(ctx.tx).toBe(FAKE_TX);
        applyCount += 1;
        return { status: 'confirmed' };
      },
    };

    const registry = new OperationApplierRegistry([applier]);
    const store = new InMemoryOperationStore();
    const syncService = new SyncService({
      registry,
      store,
      clock: () => new Date('2026-11-21T12:00:00.000Z'),
    });

    const accountId = '11111111-1111-4111-8111-111111111111';
    const opId = '22222222-2222-4222-8222-222222222222';
    const op: OperationEnvelope<'restriction.register'> = {
      opId,
      type: 'restriction.register',
      createdAt: '2026-11-21T11:59:00.000Z',
      payload: {
        restrictionType: 'amendoim',
        consentAt: '2026-11-21T11:59:00.000Z',
      },
    };

    const first = await syncService.processBatch(accountId, [op]);
    expect(first.minPackageVersion).toBe(PACKAGE_VERSION);
    expect(first.results).toEqual([{ opId, status: 'confirmed', repeated: false }]);
    expect(applyCount).toBe(1);

    // Same opId + semantically identical payload (different key order) -> repeated: true without re-applying.
    const replayed = await syncService.processBatch(accountId, [
      {
        ...op,
        payload: {
          consentAt: '2026-11-21T11:59:00.000Z',
          restrictionType: 'amendoim',
        },
      },
    ]);
    expect(replayed.results).toEqual([{ opId, status: 'confirmed', repeated: true }]);
    expect(applyCount).toBe(1);

    // Same opId + different payload -> 422 key-reused without re-applying.
    const reused = await syncService.processBatch(accountId, [
      {
        ...op,
        payload: {
          restrictionType: 'lactose',
          consentAt: '2026-11-21T11:59:00.000Z',
        },
      },
    ]);
    expect(reused.results).toHaveLength(1);
    expect(reused.results[0]).toMatchObject({
      opId,
      status: 'rejected',
      repeated: false,
      error: {
        type: 'key-reused',
        status: 422,
      },
    });
    expect(applyCount).toBe(1);
  });

  it('P05 / A08: resolves concurrent PG 23505 unique insert conflicts idempotently instead of failing the batch', async () => {
    const applier: OperationApplier<'restriction.register'> = {
      operationType: 'restriction.register',
      async apply() {
        return { status: 'confirmed' };
      },
    };
    const registry = new OperationApplierRegistry([applier]);
    const innerStore = new InMemoryOperationStore();
    const accountId = '33333333-3333-4333-8333-333333333333';
    const opId = '44444444-4444-4444-8444-444444444444';
    const op: OperationEnvelope<'restriction.register'> = {
      opId,
      type: 'restriction.register',
      createdAt: '2026-11-21T12:00:00.000Z',
      payload: { restrictionType: 'amendoim', consentAt: '2026-11-21T12:00:00.000Z' },
    };

    // Simulate a race where the initial find saw null, another transaction committed the same opId,
    // and save throws PG 23505 wrapped as error.cause.code.
    const racingStore: OperationStore = {
      withTransaction: (fn) => innerStore.withTransaction(fn),
      find: async (acc, id, tx) => innerStore.find(acc, id, tx),
      save: async (record, tx) => {
        await innerStore.save(record, tx);
        const pgError = Object.assign(new Error('duplicate key value'), {
          cause: { code: '23505' },
        });
        throw pgError;
      },
    };

    const syncService = new SyncService({ registry, store: racingStore });
    const result = await syncService.processBatch(accountId, [op]);
    expect(result.results).toEqual([{ opId, status: 'confirmed', repeated: true }]);
  });
});
