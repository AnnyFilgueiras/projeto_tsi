import type { ApiClient, HealthStatusResponse } from './api-client';

/**
 * Concrete HTTP adapter for ApiClient (A8).
 *
 * Naming this file `*-adapter.ts` allows eslint-plugin-boundaries to restrict
 * its instantiation to `src/app/composition/`.
 */
export function createFetchApiClient(baseUrl: string): ApiClient {
  return {
    baseUrl,
    async checkHealth(): Promise<HealthStatusResponse> {
      const response = await fetch(`${baseUrl}/v1/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      return (await response.json()) as HealthStatusResponse;
    },
  };
}
