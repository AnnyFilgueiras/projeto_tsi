import type { LocalDatabase } from '../../core/local-db/local-database';
import type { ApiClient } from '../../core/network/api-client';
import { createFetchApiClient } from '../../core/network/fetch-api-client-adapter';
import type { OperationEnqueuer } from '../../core/sync/operation-enqueuer';

/**
 * Single composition root for the mobile application (A8).
 *
 * Concrete adapters (SqlCipherDatabase, DirectOnlineOperationEnqueuer in Stage 1,
 * OutboxOperationEnqueuer + Synchronizer in Stage 2) are instantiated here only.
 */
export interface MobileDependencies {
  readonly apiClient: ApiClient;
  readonly localDatabase?: LocalDatabase;
  readonly operationEnqueuer?: OperationEnqueuer;
}

export function createMobileDependencies(baseUrl = 'http://10.0.2.2:3000'): MobileDependencies {
  return {
    apiClient: createFetchApiClient(baseUrl),
  };
}
