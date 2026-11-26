/** What the Profile tab shows, read from the local copy so it opens offline (ADR-008). */
export interface ProfileSnapshot {
  /** Allergen codes, sorted so the chips keep a stable order. */
  readonly restrictions: readonly string[];
  /** When the LGPD consent was first given (RN09); `null` once no restriction remains. */
  readonly consentAt: Date | null;
  readonly preferences: readonly string[];
  /** Last successful download set; `null` before the first one. */
  readonly lastSyncAt: Date | null;
}

/** Implemented by `data/profile-repository` and injected at the composition root (A8). */
export interface ProfileReader {
  read(): Promise<ProfileSnapshot>;
}
