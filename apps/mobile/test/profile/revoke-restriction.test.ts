import type {
  ClientOperation,
  EnqueueResult,
  OperationEnqueuer,
  OperationRequest,
} from '../../src/core/sync/operation-enqueuer';
import { createRevokeRestriction } from '../../src/features/profile/domain/revoke-restriction';

const NOW = '2026-11-24T14:05:00.000Z';

type Reply = 'confirmed' | 'queued' | 'offline' | 'rejected';

// Fake OperationEnqueuer (A4): replies in order and records what was sent.
function fakeEnqueuer(...replies: Reply[]) {
  const sent: OperationRequest[] = [];
  let nextId = 0;
  const enqueuer: OperationEnqueuer = {
    async enqueue(request) {
      sent.push(request);
      const opId = request.opId ?? `op-${++nextId}`;
      const reply = replies.shift() ?? 'confirmed';
      const result: EnqueueResult =
        reply === 'confirmed'
          ? { status: 'confirmed', opId, repeated: false, unlocks: {}, localCopy: 'updated' }
          : reply === 'queued'
            ? { status: 'queued', opId }
            : reply === 'rejected'
              ? { status: 'rejected', opId, problem: undefined }
              : {
                  status: 'unavailable',
                  opId,
                  reason: 'offline',
                  operation: { ...request, opId, createdAt: NOW } as ClientOperation,
                };
      return result;
    },
  };
  return { enqueuer, sent };
}

describe('RevokeRestriction (RN09, A4, ADR-008 Stage 1)', () => {
  it('sends one restriction.revoke for the code and reports it removed', async () => {
    const { enqueuer, sent } = fakeEnqueuer('confirmed');
    const revoke = createRevokeRestriction({ enqueuer });

    const result = await revoke({ code: 'amendoim' });

    expect(result).toEqual({ status: 'removed' });
    expect(sent).toEqual([
      { type: 'restriction.revoke', payload: { restrictionType: 'amendoim' } },
    ]);
  });

  it('treats a queued operation (Stage 2 outbox) as removed', async () => {
    const { enqueuer } = fakeEnqueuer('queued');
    const revoke = createRevokeRestriction({ enqueuer });

    await expect(revoke({ code: 'leite' })).resolves.toEqual({ status: 'removed' });
  });

  it('returns a retry when offline and resends it with the same opId', async () => {
    const { enqueuer, sent } = fakeEnqueuer('offline', 'confirmed');
    const revoke = createRevokeRestriction({ enqueuer });

    const first = await revoke({ code: 'amendoim' });
    expect(first.status).toBe('unavailable');
    if (first.status !== 'unavailable') return;

    const second = await revoke({ code: 'amendoim', retry: first.retry });

    expect(second).toEqual({ status: 'removed' });
    expect(sent[1]).toMatchObject({ opId: 'op-1', type: 'restriction.revoke' });
  });

  it('reports a rejection without retry', async () => {
    const { enqueuer } = fakeEnqueuer('rejected');
    const revoke = createRevokeRestriction({ enqueuer });

    await expect(revoke({ code: 'ovo' })).resolves.toEqual({ status: 'rejected' });
  });
});
