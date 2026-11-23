import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createProfileAppliers } from '../../src/modules/profile/internal/applier.js';
import {
  ProfileService,
  type ProfileStore,
  type StoredUserRestriction,
} from '../../src/modules/profile/internal/service.js';
import type { Tx } from '../../src/shared/tx.js';
import {
  AesGcmFieldCipher,
  InMemoryKeyProvider,
} from '../../src/support/field-encryption/index.js';

const FAKE_TX = {} as Tx;

class InMemoryProfileStore implements ProfileStore {
  readonly users = new Map<string, { culinaryPreferences: readonly string[] }>();
  readonly restrictions = new Map<string, StoredUserRestriction[]>();

  async createProfile(accountId: string, _tx: Tx): Promise<void> {
    if (!this.users.has(accountId)) {
      this.users.set(accountId, { culinaryPreferences: [] });
    }
  }

  async deleteData(accountId: string, _tx: Tx): Promise<void> {
    this.restrictions.delete(accountId);
    this.users.delete(accountId);
  }

  async lockUserForUpdate(accountId: string, _tx: Tx): Promise<boolean> {
    return this.users.has(accountId);
  }

  async updatePreferences(accountId: string, cuisineIds: readonly string[]): Promise<boolean> {
    if (!this.users.has(accountId)) {
      return false;
    }
    this.users.set(accountId, { culinaryPreferences: [...cuisineIds] });
    return true;
  }

  async getPreferences(accountId: string): Promise<readonly string[]> {
    return this.users.get(accountId)?.culinaryPreferences ?? [];
  }

  async getProfileSummary(accountId: string) {
    return {
      culinaryPreferences: this.users.get(accountId)?.culinaryPreferences ?? [],
    };
  }

  async listRestrictionTypes() {
    return [];
  }

  async listRestrictions(accountId: string, _tx?: Tx): Promise<readonly StoredUserRestriction[]> {
    return [...(this.restrictions.get(accountId) ?? [])];
  }

  async insertRestriction(record: StoredUserRestriction, _tx: Tx): Promise<void> {
    const list = this.restrictions.get(record.userId) ?? [];
    list.push({ ...record });
    this.restrictions.set(record.userId, list);
  }

  async updateRestriction(record: StoredUserRestriction, _tx: Tx): Promise<void> {
    const list = this.restrictions.get(record.userId) ?? [];
    const index = list.findIndex((item) => item.id === record.id);
    if (index >= 0) {
      list[index] = { ...record };
    }
  }

  async deleteRestrictionsByIds(
    accountId: string,
    restrictionIds: readonly string[],
    _tx: Tx,
  ): Promise<void> {
    const toDelete = new Set(restrictionIds);
    const remaining = (this.restrictions.get(accountId) ?? []).filter(
      (item) => !toDelete.has(item.id),
    );
    this.restrictions.set(accountId, remaining);
  }
}

describe('ProfileApplier and ProfileService (RN09, A05, ADR-006)', () => {
  function setup() {
    const store = new InMemoryProfileStore();
    const cipher = new AesGcmFieldCipher(
      new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: randomBytes(32) } }),
    );
    const service = new ProfileService({ store, cipher });
    const [registerApplier, revokeApplier] = createProfileAppliers(service);
    return { store, service, registerApplier, revokeApplier };
  }

  it('RN09 / A05: encrypts valid ANVISA/lactose restrictions with consentAt, avoids plaintext storage, and physically deletes on revoke', async () => {
    const { store, service, registerApplier, revokeApplier } = setup();
    const accountId = '11111111-1111-4111-8111-111111111111';
    await service.createProfile(accountId, FAKE_TX);

    const registerResult = await registerApplier.apply(
      {
        opId: '22222222-2222-4222-8222-222222222222',
        type: 'restriction.register',
        createdAt: '2026-11-21T12:00:00.000Z',
        payload: {
          restrictionType: 'amendoim',
          consentAt: '2026-11-21T12:00:00.000Z',
        },
      },
      { accountId, tx: FAKE_TX },
    );

    expect(registerResult).toEqual({ status: 'confirmed' });
    const stored = store.restrictions.get(accountId) ?? [];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.encryptedType).not.toContain('amendoim');
    expect(await service.getActiveRestrictionCodes(accountId)).toEqual(['amendoim']);

    const revokeResult = await revokeApplier.apply(
      {
        opId: '33333333-3333-4333-8333-333333333333',
        type: 'restriction.revoke',
        createdAt: '2026-11-21T12:05:00.000Z',
        payload: { restrictionType: 'amendoim' },
      },
      { accountId, tx: FAKE_TX },
    );

    expect(revokeResult).toEqual({ status: 'confirmed' });
    expect(store.restrictions.get(accountId) ?? []).toHaveLength(0);
    expect(await service.getActiveRestrictionCodes(accountId)).toEqual([]);

    // Revoking an already absent restriction stays idempotent (sequencia-uc08.md).
    const repeatRevoke = await revokeApplier.apply(
      {
        opId: '44444444-4444-4444-8444-444444444444',
        type: 'restriction.revoke',
        createdAt: '2026-11-21T12:06:00.000Z',
        payload: { restrictionType: 'amendoim' },
      },
      { accountId, tx: FAKE_TX },
    );
    expect(repeatRevoke).toEqual({ status: 'confirmed' });
  });

  it('RN09 / A13: rejects unknown allergen codes and missing consentAt without echoing sensitive values', async () => {
    const { service, registerApplier } = setup();
    const accountId = '55555555-5555-4555-8555-555555555555';
    await service.createProfile(accountId, FAKE_TX);

    const invalidCode = await registerApplier.apply(
      {
        opId: '66666666-6666-4666-8666-666666666666',
        type: 'restriction.register',
        createdAt: '2026-11-21T12:00:00.000Z',
        payload: {
          restrictionType: 'alergia_livre_invalida',
          consentAt: '2026-11-21T12:00:00.000Z',
        },
      },
      { accountId, tx: FAKE_TX },
    );

    expect(invalidCode.status).toBe('rejected');
    expect(invalidCode.error?.status).toBe(422);
    expect(JSON.stringify(invalidCode)).not.toContain('alergia_livre_invalida');

    const missingConsent = await registerApplier.apply(
      {
        opId: '77777777-7777-4777-8777-777777777777',
        type: 'restriction.register',
        createdAt: '2026-11-21T12:00:00.000Z',
        payload: {
          restrictionType: 'amendoim',
        },
      },
      { accountId, tx: FAKE_TX },
    );

    expect(missingConsent.status).toBe('rejected');
    expect(missingConsent.error?.status).toBe(422);
    expect(JSON.stringify(missingConsent)).not.toContain('amendoim');
  });

  it('returns per-item rejected result instead of throwing when profile does not exist', async () => {
    const { registerApplier } = setup();
    const result = await registerApplier.apply(
      {
        opId: '88888888-8888-4888-8888-888888888888',
        type: 'restriction.register',
        createdAt: '2026-11-21T12:00:00.000Z',
        payload: {
          restrictionType: 'amendoim',
          consentAt: '2026-11-21T12:00:00.000Z',
        },
      },
      { accountId: '99999999-9999-4999-8999-999999999999', tx: FAKE_TX },
    );

    expect(result).toMatchObject({
      status: 'rejected',
      error: { type: 'not-found', status: 404 },
    });
  });

  it('A06 / A13 (D3): fails closed with explicit error without leaking sensitive values when persisted restriction decrypts outside ALLERGEN_CODES', async () => {
    const store = new InMemoryProfileStore();
    const cipher = new AesGcmFieldCipher(
      new InMemoryKeyProvider({ currentVersion: 1, keys: { 1: randomBytes(32) } }),
    );
    const service = new ProfileService({ store, cipher });
    const accountId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await service.createProfile(accountId, FAKE_TX);

    const corruptedCode = 'alergia_corrompida_fora_do_vocabulario';
    const encrypted = await cipher.encrypt(corruptedCode, accountId);
    await store.insertRestriction(
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        userId: accountId,
        encryptedType: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
        consentAt: new Date('2026-11-23T10:00:00.000Z'),
        createdAt: new Date('2026-11-23T10:00:00.000Z'),
      },
      FAKE_TX,
    );

    let thrown: unknown;
    try {
      await service.getActiveRestrictionCodes(accountId);
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = thrown instanceof Error ? thrown.message : String(thrown);
    expect(message).not.toContain(corruptedCode);
    expect(message).not.toContain(accountId);
  });
});
