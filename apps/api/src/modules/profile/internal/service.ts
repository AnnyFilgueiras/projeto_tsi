import { randomUUID } from 'node:crypto';
import { isAllergenCode, type AllergenCode } from '@panelada/allergen-rules/rules';
import { notFoundProblem, ProblemError } from '../../../shared/problem.js';
import type { Tx } from '../../../shared/tx.js';
import type { FieldCipher } from '../../../support/field-encryption/index.js';
import type { ProfileLifecyclePort } from '../public/profile-lifecycle.js';
import type { ProfilePantryAndUtensils, ProfileQueryPort } from '../public/profile-query.js';
import type { RestrictionsForFilterPort } from '../public/restrictions-for-filter.js';

export interface StoredUserRestriction {
  readonly id: string;
  readonly userId: string;
  readonly encryptedType: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyVersion: number;
  readonly consentAt: Date;
  readonly createdAt: Date;
}

export interface ProfileStore {
  createProfile(accountId: string, tx: Tx): Promise<void>;
  deleteData(accountId: string, tx: Tx): Promise<void>;
  lockUserForUpdate(accountId: string, tx: Tx): Promise<boolean>;
  updatePreferences(accountId: string, cuisineIds: readonly string[]): Promise<boolean>;
  getPreferences(accountId: string): Promise<readonly string[]>;
  listRestrictions(accountId: string, tx?: Tx): Promise<readonly StoredUserRestriction[]>;
  insertRestriction(record: StoredUserRestriction, tx: Tx): Promise<void>;
  updateRestriction(record: StoredUserRestriction, tx: Tx): Promise<void>;
  deleteRestrictionsByIds(
    accountId: string,
    restrictionIds: readonly string[],
    tx: Tx,
  ): Promise<void>;
}

export interface ProfileServiceDeps {
  readonly store: ProfileStore;
  readonly cipher: FieldCipher;
  readonly clock?: () => Date;
}

export class ProfileService
  implements ProfileLifecyclePort, ProfileQueryPort, RestrictionsForFilterPort
{
  private readonly store: ProfileStore;
  private readonly cipher: FieldCipher;
  private readonly clock: () => Date;

  constructor(deps: ProfileServiceDeps) {
    this.store = deps.store;
    this.cipher = deps.cipher;
    this.clock = deps.clock ?? (() => new Date());
  }

  async createProfile(accountId: string, tx: Tx): Promise<void> {
    await this.store.createProfile(accountId, tx);
  }

  async deleteData(accountId: string, tx: Tx): Promise<void> {
    await this.store.deleteData(accountId, tx);
  }

  async updatePreferences(accountId: string, cuisineIds: readonly string[]): Promise<void> {
    const deduplicated = [...new Set(cuisineIds)];
    const updated = await this.store.updatePreferences(accountId, deduplicated);
    if (!updated) {
      throw new ProblemError(notFoundProblem('Perfil não encontrado para a conta autenticada.'));
    }
  }

  async getPreferences(accountId: string): Promise<readonly string[]> {
    return this.store.getPreferences(accountId);
  }

  async getPantryAndUtensils(_accountId: string): Promise<ProfilePantryAndUtensils> {
    // Pantry and utensils persistence arrives in Wave 1B (MVP-05).
    return { pantryIngredientIds: [], utensilIds: [] };
  }

  async registerRestriction(
    accountId: string,
    restrictionType: AllergenCode,
    consentAt: Date,
    tx: Tx,
  ): Promise<void> {
    // Serialize writes per user inside `tx` so random-IV encrypted rows never duplicate the same allergen.
    const exists = await this.store.lockUserForUpdate(accountId, tx);
    if (!exists) {
      throw new ProblemError(notFoundProblem('Perfil não encontrado para a conta autenticada.'));
    }

    const existingRows = await this.store.listRestrictions(accountId, tx);
    const matchingRow = await this.findRowByRestrictionCode(
      existingRows,
      accountId,
      restrictionType,
    );

    // ADR-006 / A05: Encrypt restriction type with accountId as GCM AAD before touching PostgreSQL.
    const encrypted = await this.cipher.encrypt(restrictionType, accountId);

    if (matchingRow) {
      await this.store.updateRestriction(
        {
          ...matchingRow,
          encryptedType: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion,
          consentAt,
        },
        tx,
      );
      return;
    }

    await this.store.insertRestriction(
      {
        id: randomUUID(),
        userId: accountId,
        encryptedType: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
        consentAt,
        createdAt: this.clock(),
      },
      tx,
    );
  }

  async revokeRestriction(accountId: string, restrictionType: AllergenCode, tx: Tx): Promise<void> {
    const exists = await this.store.lockUserForUpdate(accountId, tx);
    if (!exists) {
      return;
    }

    const existingRows = await this.store.listRestrictions(accountId, tx);
    const matchingIds: string[] = [];

    for (const row of existingRows) {
      const decrypted = await this.cipher.decrypt(
        {
          ciphertext: row.encryptedType,
          iv: row.iv,
          authTag: row.authTag,
          keyVersion: row.keyVersion,
        },
        accountId,
      );
      if (decrypted === restrictionType) {
        matchingIds.push(row.id);
      }
    }

    // sequencia-uc08.md: Revocation is idempotent; deleting an absent restriction succeeds cleanly.
    if (matchingIds.length > 0) {
      await this.store.deleteRestrictionsByIds(accountId, matchingIds, tx);
    }
  }

  async getActiveRestrictionCodes(accountId: string): Promise<readonly AllergenCode[]> {
    const rows = await this.store.listRestrictions(accountId);
    const codes: AllergenCode[] = [];
    const seen = new Set<AllergenCode>();

    for (const row of rows) {
      const decrypted = await this.cipher.decrypt(
        {
          ciphertext: row.encryptedType,
          iv: row.iv,
          authTag: row.authTag,
          keyVersion: row.keyVersion,
        },
        accountId,
      );
      if (isAllergenCode(decrypted) && !seen.has(decrypted)) {
        seen.add(decrypted);
        codes.push(decrypted);
      }
    }

    return codes;
  }

  private async findRowByRestrictionCode(
    rows: readonly StoredUserRestriction[],
    accountId: string,
    restrictionType: AllergenCode,
  ): Promise<StoredUserRestriction | null> {
    for (const row of rows) {
      const decrypted = await this.cipher.decrypt(
        {
          ciphertext: row.encryptedType,
          iv: row.iv,
          authTag: row.authTag,
          keyVersion: row.keyVersion,
        },
        accountId,
      );
      if (decrypted === restrictionType) {
        return row;
      }
    }
    return null;
  }
}
