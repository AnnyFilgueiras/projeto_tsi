import type {
  ClientOperation,
  EnqueueResult,
  OperationEnqueuer,
  OperationRequest,
} from '../../src/core/sync/operation-enqueuer';
import { createRegisterRestrictions } from '../../src/features/profile/domain/register-restrictions';

const NOW = new Date('2026-11-24T14:05:00.000Z');
const LATER = new Date('2026-11-24T14:09:00.000Z');

type Reply = 'confirmed' | 'offline' | 'rejected';

// Fake OperationEnqueuer (A4): answers by restriction code and records what was sent.
function fakeEnqueuer(replyFor: (code: string, attempt: number) => Reply = () => 'confirmed') {
  const sent: OperationRequest[] = [];
  const attempts = new Map<string, number>();
  let nextId = 0;

  const enqueuer: OperationEnqueuer = {
    async enqueue(request) {
      sent.push(request);
      const code = (request.payload as { restrictionType: string }).restrictionType;
      const attempt = (attempts.get(code) ?? 0) + 1;
      attempts.set(code, attempt);
      const opId = request.opId ?? `op-${++nextId}`;
      const reply = replyFor(code, attempt);
      const result: EnqueueResult =
        reply === 'confirmed'
          ? { status: 'confirmed', opId, repeated: false, unlocks: {}, localCopy: 'updated' }
          : reply === 'rejected'
            ? { status: 'rejected', opId, problem: undefined }
            : {
                status: 'unavailable',
                opId,
                reason: 'offline',
                operation: { ...request, opId, createdAt: NOW.toISOString() } as ClientOperation,
              };
      return result;
    },
  };
  return { enqueuer, sent };
}

describe('RegisterRestrictions (RN09, A4, ADR-008 Stage 1)', () => {
  it('sends nothing without consent', async () => {
    const { enqueuer, sent } = fakeEnqueuer();
    const register = createRegisterRestrictions({ enqueuer, now: () => NOW });

    const result = await register({ codes: ['amendoim'], consented: false });

    expect(result).toEqual({ status: 'consent-required' });
    expect(sent).toHaveLength(0);
  });

  it('sends one restriction.register per code, all with the same consentAt', async () => {
    const { enqueuer, sent } = fakeEnqueuer();
    const register = createRegisterRestrictions({ enqueuer, now: () => NOW });

    const result = await register({ codes: ['amendoim', 'leite'], consented: true });

    expect(result).toEqual({ status: 'saved' });
    expect(sent).toEqual([
      {
        type: 'restriction.register',
        payload: { restrictionType: 'amendoim', consentAt: NOW.toISOString() },
      },
      {
        type: 'restriction.register',
        payload: { restrictionType: 'leite', consentAt: NOW.toISOString() },
      },
    ]);
  });

  it('stops at the first offline answer and keeps the pending operations for a retry', async () => {
    const { enqueuer, sent } = fakeEnqueuer((code) => (code === 'leite' ? 'offline' : 'confirmed'));
    const register = createRegisterRestrictions({ enqueuer, now: () => NOW });

    const result = await register({ codes: ['amendoim', 'leite', 'ovo'], consented: true });

    expect(result.status).toBe('unavailable');
    expect(sent.map((op) => op.payload)).toEqual([
      { restrictionType: 'amendoim', consentAt: NOW.toISOString() },
      { restrictionType: 'leite', consentAt: NOW.toISOString() },
    ]);
  });

  it('retries only what was not confirmed, reusing the opId and the original consentAt', async () => {
    const { enqueuer, sent } = fakeEnqueuer((code, attempt) =>
      code === 'leite' && attempt === 1 ? 'offline' : 'confirmed',
    );
    let clock = NOW;
    const register = createRegisterRestrictions({ enqueuer, now: () => clock });

    const first = await register({ codes: ['amendoim', 'leite', 'ovo'], consented: true });
    if (first.status !== 'unavailable') throw new Error('expected unavailable');
    clock = LATER;
    const second = await register({
      codes: ['amendoim', 'leite', 'ovo'],
      consented: true,
      retry: first.retry,
    });

    expect(second).toEqual({ status: 'saved' });
    const retried = sent.slice(2);
    expect(
      retried.map((op) => (op.payload as { restrictionType: string }).restrictionType),
    ).toEqual(['leite', 'ovo']);
    // Same idempotency key for the operation the server never answered.
    // 'op-2' is the id the enqueuer gave "leite" on the first attempt.
    expect(retried[0]?.opId).toBe('op-2');
    for (const op of retried) {
      expect((op.payload as { consentAt: string }).consentAt).toBe(NOW.toISOString());
    }
  });

  it('adds codes picked after a failed attempt with the original consentAt', async () => {
    const { enqueuer, sent } = fakeEnqueuer((code, attempt) =>
      code === 'amendoim' && attempt === 1 ? 'offline' : 'confirmed',
    );
    let clock = NOW;
    const register = createRegisterRestrictions({ enqueuer, now: () => clock });

    const first = await register({ codes: ['amendoim'], consented: true });
    if (first.status !== 'unavailable') throw new Error('expected unavailable');
    clock = LATER;
    await register({ codes: ['amendoim', 'soja'], consented: true, retry: first.retry });

    expect(sent.slice(1).map((op) => op.payload)).toEqual([
      { restrictionType: 'amendoim', consentAt: NOW.toISOString() },
      { restrictionType: 'soja', consentAt: NOW.toISOString() },
    ]);
  });

  it('reports a rejection without sending the remaining codes', async () => {
    const { enqueuer, sent } = fakeEnqueuer(() => 'rejected');
    const register = createRegisterRestrictions({ enqueuer, now: () => NOW });

    const result = await register({ codes: ['amendoim', 'leite'], consented: true });

    expect(result).toEqual({ status: 'rejected' });
    expect(sent).toHaveLength(1);
  });

  it('sends nothing for an empty selection', async () => {
    const { enqueuer, sent } = fakeEnqueuer();
    const register = createRegisterRestrictions({ enqueuer, now: () => NOW });

    expect(await register({ codes: [], consented: true })).toEqual({ status: 'saved' });
    expect(sent).toHaveLength(0);
  });
});
