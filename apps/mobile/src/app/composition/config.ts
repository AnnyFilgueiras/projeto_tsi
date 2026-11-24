/** Android emulator alias for the host machine, where Docker Compose exposes the API. */
export const DEFAULT_API_BASE_URL = 'http://10.0.2.2:3000';

export interface MobileConfig {
  readonly apiBaseUrl: string;
  readonly databaseName: string;
}

/**
 * Reads build-time configuration. `EXPO_PUBLIC_*` variables are inlined by Metro, so the property
 * access must stay literal (no destructuring or dynamic keys) for the substitution to happen.
 */
export function readMobileConfig(): MobileConfig {
  return {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
    databaseName: 'panelada.db',
  };
}
