/**
 * HTTP API client port consumed by feature data repositories (A8).
 *
 * Concrete fetch adapter lives in `fetch-api-client-adapter.ts` and is wired
 * exclusively inside `src/app/composition/`.
 */
export interface HealthStatusResponse {
  readonly status: 'ok';
  readonly version: string;
  readonly allergenPackageVersion: string;
}

export interface ApiClient {
  readonly baseUrl: string;
  checkHealth(): Promise<HealthStatusResponse>;
}
