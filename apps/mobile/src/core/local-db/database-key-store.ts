/**
 * Source of the 256-bit SQLCipher key (ADR-005, A05).
 *
 * The key must live outside the database file and outside Android auto-backup, which is why the
 * concrete adapter uses expo-secure-store (Android Keystore) and `allowBackup` is false.
 */
export interface DatabaseKeyStore {
  /** Returns the key as 64 lowercase hex chars, generating and persisting it on first use. */
  getOrCreateKey(): Promise<string>;
}
