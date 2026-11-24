import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { createSecureStoreDatabaseKeyStore } from '../../src/core/local-db/secure-store-database-key-adapter';
import {
  LocalDatabaseUnreadableError,
  openSqlCipherDatabase,
  SqlCipherUnavailableError,
} from '../../src/core/local-db/sqlcipher-database';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  deleteDatabaseAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    __store: store,
  };
});

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (n: number) => Uint8Array.from({ length: n }, (_, i) => i)),
}));

const KEY = 'ab'.repeat(32);

function fakeNativeDb(cipherVersion: string | undefined) {
  const statements: string[] = [];
  return {
    statements,
    execAsync: jest.fn(async (sql: string) => {
      statements.push(sql);
    }),
    getAllAsync: jest.fn(async (sql: string) => {
      statements.push(sql);
      return sql === 'PRAGMA cipher_version' ? [{ cipher_version: cipherVersion }] : [{ n: 0 }];
    }),
    runAsync: jest.fn(),
    closeAsync: jest.fn(async () => undefined),
  };
}

describe('SqlCipherDatabase (ADR-005, A05, A2)', () => {
  const openDatabaseAsync = SQLite.openDatabaseAsync as jest.Mock;

  it('sets the key before any other statement', async () => {
    const native = fakeNativeDb('4.6.1 community');
    openDatabaseAsync.mockResolvedValue(native);

    await openSqlCipherDatabase({ databaseName: 'panelada.db', keyHex: KEY });

    expect(native.statements[0]).toBe(`PRAGMA key = "x'${KEY}'"`);
  });

  it('fails closed when the build has no SQLCipher (would write clear text)', async () => {
    const native = fakeNativeDb(undefined);
    openDatabaseAsync.mockResolvedValue(native);

    await expect(
      openSqlCipherDatabase({ databaseName: 'panelada.db', keyHex: KEY }),
    ).rejects.toBeInstanceOf(SqlCipherUnavailableError);
    expect(native.closeAsync).toHaveBeenCalled();
  });

  it('reports a key mismatch separately, so only that case resets the local copy', async () => {
    const native = fakeNativeDb('4.6.1 community');
    native.getAllAsync.mockImplementation(async (sql: string) => {
      if (sql === 'PRAGMA cipher_version') return [{ cipher_version: '4.6.1' }];
      throw new Error('file is not a database');
    });
    openDatabaseAsync.mockResolvedValue(native);

    const error = await openSqlCipherDatabase({ databaseName: 'panelada.db', keyHex: KEY }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(LocalDatabaseUnreadableError);
    expect(error).not.toBeInstanceOf(SqlCipherUnavailableError);
  });

  it('rejects a key that is not 256-bit hex before touching the driver', async () => {
    openDatabaseAsync.mockClear();

    await expect(
      openSqlCipherDatabase({ databaseName: 'panelada.db', keyHex: `x'; DROP` }),
    ).rejects.toThrow(/hex/);
    expect(openDatabaseAsync).not.toHaveBeenCalled();
  });
});

describe('SecureStore database key (ADR-005, A05)', () => {
  it('generates a 256-bit key once, stores it device-only, and reuses it', async () => {
    const keys = createSecureStoreDatabaseKeyStore();

    const first = await keys.getOrCreateKey();
    const second = await keys.getOrCreateKey();

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.any(String), first, {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });
});
