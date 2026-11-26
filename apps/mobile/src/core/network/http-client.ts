import type { operations } from './openapi.generated';

/**
 * Typed HTTP client port (ADR-007, openapi-typescript).
 *
 * Calls are addressed by OpenAPI `operationId`, so request bodies, path/query parameters and
 * success payloads are checked against `openapi.yaml` at compile time. Add a route to
 * `API_ROUTES` when a feature starts using a new operation.
 */
export const API_ROUTES = {
  checkHealth: { method: 'GET', path: '/v1/health', authenticated: false },
  createAnonymousAccount: { method: 'POST', path: '/v1/accounts/anonymous', authenticated: false },
  refreshSession: { method: 'POST', path: '/v1/sessions/refresh', authenticated: false },
  sendOperations: { method: 'POST', path: '/v1/sync/operations', authenticated: true },
  getDownloadSet: { method: 'GET', path: '/v1/sync/download-set', authenticated: true },
  getRecipe: { method: 'GET', path: '/v1/recipes/{dishId}', authenticated: true },
  updateCulinaryPreferences: {
    method: 'PUT',
    path: '/v1/profile/preferences',
    authenticated: true,
  },
  getSuggestions: { method: 'GET', path: '/v1/suggestions', authenticated: true },
  approveSuggestion: {
    method: 'POST',
    path: '/v1/suggestions/{suggestionId}/approve',
    authenticated: true,
  },
  discardSuggestion: {
    method: 'POST',
    path: '/v1/suggestions/{suggestionId}/discard',
    authenticated: true,
  },
} as const satisfies Partial<Record<keyof operations, ApiRoute>>;

export interface ApiRoute {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly authenticated: boolean;
}

export type ApiOperationId = keyof typeof API_ROUTES;

type Operation<K extends ApiOperationId> = operations[K];
type JsonContent<T> = T extends { content: { 'application/json': infer Body } } ? Body : never;
type Responses<K extends ApiOperationId> = Operation<K>['responses'];

export type ApiRequestBody<K extends ApiOperationId> = JsonContent<
  NonNullable<Operation<K>['requestBody']>
>;
export type ApiSuccessBody<K extends ApiOperationId> = JsonContent<
  Responses<K>[Extract<keyof Responses<K>, 200 | 201>]
>;

export interface ApiCallOptions<K extends ApiOperationId> {
  readonly body?: ApiRequestBody<K>;
  readonly path?: NonNullable<Operation<K>['parameters']['path']>;
  readonly query?: NonNullable<Operation<K>['parameters']['query']>;
  /** Operation-specific headers declared in the contract (e.g. `Idempotency-Key`). */
  readonly header?: NonNullable<Operation<K>['parameters']['header']>;
}

/** `data` is null for bodiless statuses such as 204 and 304 (download set unchanged). */
export interface ApiResponse<K extends ApiOperationId> {
  readonly status: number;
  readonly data: ApiSuccessBody<K> | null;
}

export interface HttpClient {
  /**
   * Performs the operation. Always sends `X-Allergen-Package-Version`; on authenticated routes it
   * renews an expired access token transparently.
   *
   * @throws NetworkUnavailableError when the API is unreachable.
   * @throws SessionExpiredError when there is no session or the refresh was refused.
   * @throws HttpError for any other non-success status.
   */
  call<K extends ApiOperationId>(
    operationId: K,
    options: ApiCallOptions<K>,
  ): Promise<ApiResponse<K>>;
}
