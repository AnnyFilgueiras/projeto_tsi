import {
  API_ROUTES,
  type ApiCallOptions,
  type ApiOperationId,
  type ApiResponse,
  type ApiRoute,
  type HttpClient,
} from './http-client';
import {
  HttpError,
  NetworkUnavailableError,
  SessionExpiredError,
  type Problem,
} from './http-errors';
import type { TokenPair, TokenStore } from './token-store';

export interface FetchHttpClientDeps {
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  readonly tokenStore: TokenStore;
  /** `PACKAGE_VERSION` from @panelada/allergen-rules/rules; the API answers with minPackageVersion. */
  readonly packageVersion: string;
  readonly now: () => Date;
}

// Refresh slightly early so a token does not expire between our check and the server's.
const EXPIRY_SKEW_MS = 30_000;

/** Concrete `HttpClient` over `fetch` (A8: instantiated only in src/app/composition). */
export function createFetchHttpClient(deps: FetchHttpClientDeps): HttpClient {
  // Refresh tokens are single-use and rotating (ADR-007, R13): concurrent 401s must share one
  // refresh, otherwise the second request would replay a spent token outside the grace window
  // and revoke the whole token family.
  let refreshing: Promise<TokenPair> | null = null;

  async function send(
    route: ApiRoute,
    options: ApiCallOptions<ApiOperationId>,
    accessToken?: string,
  ): Promise<Response> {
    // Contract headers go first so the client's own headers can never be overridden by a caller.
    const headers: Record<string, string> = {
      ...((options.header ?? {}) as Record<string, string>),
      Accept: 'application/json',
      'X-Allergen-Package-Version': deps.packageVersion,
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      return await deps.fetch(buildUrl(deps.baseUrl, route.path, options), {
        method: route.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      throw new NetworkUnavailableError('API unreachable', { cause: error });
    }
  }

  function refresh(spent: TokenPair): Promise<TokenPair> {
    refreshing ??= (async () => {
      const response = await send(API_ROUTES.refreshSession, {
        body: { refreshToken: spent.refreshToken },
      });
      if (response.status === 401) {
        await deps.tokenStore.clear();
        throw new SessionExpiredError(await readProblem(response));
      }
      if (!response.ok) {
        throw new HttpError(response.status, await readProblem(response));
      }
      const pair = (await response.json()) as TokenPair;
      await deps.tokenStore.write(pair);
      return pair;
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function currentTokens(): Promise<TokenPair> {
    const tokens = await deps.tokenStore.read();
    if (!tokens) {
      throw new SessionExpiredError();
    }
    const expiresAt = Date.parse(tokens.expiresAt);
    return expiresAt - deps.now().getTime() <= EXPIRY_SKEW_MS ? refresh(tokens) : tokens;
  }

  return {
    async call(operationId, options) {
      const route: ApiRoute = API_ROUTES[operationId];
      if (!route.authenticated) {
        return parse(await send(route, options));
      }

      const used = await currentTokens();
      let response = await send(route, options, used.accessToken);
      if (response.status === 401) {
        // Another call may have rotated the pair (reuse it) or ended the session (stop: replaying
        // our spent refresh token outside the grace window would revoke the family, ADR-007).
        const latest = await deps.tokenStore.read();
        if (!latest) {
          throw new SessionExpiredError();
        }
        const fresh = latest.accessToken !== used.accessToken ? latest : await refresh(latest);
        response = await send(route, options, fresh.accessToken);
      }
      return parse(response);
    },
  };
}

function buildUrl(
  baseUrl: string,
  template: string,
  options: ApiCallOptions<ApiOperationId>,
): string {
  const pathParams = (options.path ?? {}) as Record<string, string>;
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = pathParams[name];
    if (value === undefined) {
      throw new Error(`Missing path parameter "${name}" for ${template}`);
    }
    return encodeURIComponent(value);
  });

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries((options.query ?? {}) as Record<string, unknown>)) {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  }
  const search = query.toString();
  return `${baseUrl.replace(/\/$/, '')}${path}${search ? `?${search}` : ''}`;
}

async function parse<K extends ApiOperationId>(response: Response): Promise<ApiResponse<K>> {
  if (response.status === 204 || response.status === 304) {
    return { status: response.status, data: null };
  }
  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError(await readProblem(response));
    }
    throw new HttpError(response.status, await readProblem(response));
  }
  return { status: response.status, data: (await response.json()) as ApiResponse<K>['data'] };
}

async function readProblem(response: Response): Promise<Problem | undefined> {
  try {
    return (await response.json()) as Problem;
  } catch {
    return undefined;
  }
}
