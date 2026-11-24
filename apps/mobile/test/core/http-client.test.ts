import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import {
  HttpError,
  NetworkUnavailableError,
  SessionExpiredError,
} from '../../src/core/network/http-errors';
import { createFakeFetch, offlineFetch } from '../support/fake-fetch';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

const BASE_URL = 'http://api.test';
const NOW = new Date('2026-11-23T12:00:00.000Z');
const DOWNLOAD_SET = 'GET /v1/sync/download-set';
const REFRESH = 'POST /v1/sessions/refresh';

function client(fetchImpl: typeof fetch, tokens = createFakeTokenStore(tokenPair('1'))) {
  const http = createFetchHttpClient({
    baseUrl: BASE_URL,
    fetch: fetchImpl,
    tokenStore: tokens,
    packageVersion: PACKAGE_VERSION,
    now: () => NOW,
  });
  return { http, tokens };
}

/** Accepts only `access-<n>` as the current valid access token. */
function authorizedOnly(validToken: string) {
  return (request: { headers: Record<string, string> }) =>
    request.headers.Authorization === `Bearer ${validToken}`
      ? { status: 304 }
      : { status: 401, body: { type: 'unauthenticated', title: 'x', status: 401 } };
}

describe('HttpClient (ADR-007, A7, X-Allergen-Package-Version)', () => {
  it('sends X-Allergen-Package-Version on public and authenticated calls', async () => {
    const fake = createFakeFetch({
      'GET /v1/health': () => ({ status: 200, body: { status: 'ok' } }),
      [DOWNLOAD_SET]: () => ({ status: 304 }),
    });
    const { http } = client(fake.fetch);

    await http.call('checkHealth', {});
    await http.call('getDownloadSet', {});

    expect(fake.requests.map((r) => r.headers['X-Allergen-Package-Version'])).toEqual([
      PACKAGE_VERSION,
      PACKAGE_VERSION,
    ]);
    expect(fake.requests[0]?.headers.Authorization).toBeUndefined();
    expect(fake.requests[1]?.headers.Authorization).toBe('Bearer access-1');
  });

  it('refreshes a rejected access token transparently and retries once', async () => {
    const fake = createFakeFetch({
      [DOWNLOAD_SET]: authorizedOnly('access-2'),
      [REFRESH]: () => ({ status: 200, body: tokenPair('2') }),
    });
    const { http, tokens } = client(fake.fetch);

    const response = await http.call('getDownloadSet', {});

    expect(response.status).toBe(304);
    expect(fake.requests.find((r) => r.url.endsWith('/refresh'))?.body).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(tokens.current).toEqual(tokenPair('2'));
  });

  it('refreshes before calling when the access token is already expired', async () => {
    const fake = createFakeFetch({
      [DOWNLOAD_SET]: authorizedOnly('access-2'),
      [REFRESH]: () => ({ status: 200, body: tokenPair('2') }),
    });
    const expired = createFakeTokenStore(tokenPair('1', '2026-11-23T11:59:00.000Z'));
    const { http } = client(fake.fetch, expired);

    await http.call('getDownloadSet', {});

    expect(fake.requests.map((r) => r.url.replace(BASE_URL, ''))).toEqual([
      '/v1/sessions/refresh',
      '/v1/sync/download-set',
    ]);
  });

  it('shares one refresh between concurrent calls (refresh tokens are single-use, R13)', async () => {
    const fake = createFakeFetch({
      [DOWNLOAD_SET]: authorizedOnly('access-2'),
      [REFRESH]: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { status: 200, body: tokenPair('2') };
      },
    });
    const { http } = client(fake.fetch);

    await Promise.all([
      http.call('getDownloadSet', {}),
      http.call('getDownloadSet', {}),
      http.call('getDownloadSet', {}),
    ]);

    expect(fake.requests.filter((r) => r.url.endsWith('/refresh'))).toHaveLength(1);
  });

  it('clears the session and throws SessionExpiredError when the refresh is refused', async () => {
    const fake = createFakeFetch({
      [DOWNLOAD_SET]: authorizedOnly('never'),
      [REFRESH]: () => ({
        status: 401,
        body: { type: 'invalid-refresh', title: 'x', status: 401 },
      }),
    });
    const { http, tokens } = client(fake.fetch);

    await expect(http.call('getDownloadSet', {})).rejects.toBeInstanceOf(SessionExpiredError);
    expect(tokens.current).toBeNull();
  });

  it('never replays a spent refresh token after another call already ended the session', async () => {
    const fake = createFakeFetch({
      [DOWNLOAD_SET]: authorizedOnly('never'),
      [REFRESH]: () => ({ status: 200, body: tokenPair('2') }),
    });
    // First read sees the session; by the time our 401 arrives, a concurrent refusal cleared it.
    const tokens = createFakeTokenStore(tokenPair('1'));
    const firstRead = tokens.read;
    tokens.read = async () => {
      const pair = await firstRead();
      await tokens.clear();
      return pair;
    };
    const { http } = client(fake.fetch, tokens);

    await expect(http.call('getDownloadSet', {})).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fake.requests.filter((r) => r.url.endsWith('/refresh'))).toHaveLength(0);
  });

  it('throws SessionExpiredError without calling the API when there is no session', async () => {
    const fake = createFakeFetch({});
    const { http } = client(fake.fetch, createFakeTokenStore(null));

    await expect(http.call('getDownloadSet', {})).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fake.requests).toHaveLength(0);
  });

  it('maps a failed fetch to NetworkUnavailableError', async () => {
    const { http } = client(offlineFetch);

    await expect(http.call('checkHealth', {})).rejects.toBeInstanceOf(NetworkUnavailableError);
  });

  it('maps error statuses to HttpError carrying the Problem body', async () => {
    const problem = { type: 'validation', title: 'Inválido', status: 400 };
    const fake = createFakeFetch({ [DOWNLOAD_SET]: () => ({ status: 400, body: problem }) });
    const { http } = client(fake.fetch);

    const error = await http.call('getDownloadSet', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 400, problem });
  });

  it('fills path parameters and query strings', async () => {
    const fake = createFakeFetch({
      'GET /v1/recipes/abc': () => ({ status: 200, body: {} }),
      [DOWNLOAD_SET]: () => ({ status: 304 }),
    });
    const { http } = client(fake.fetch);

    await http.call('getRecipe', { path: { dishId: 'abc' } });
    await http.call('getDownloadSet', { query: { version: 'v 1' } });

    expect(fake.requests.map((r) => r.url)).toEqual([
      `${BASE_URL}/v1/recipes/abc`,
      `${BASE_URL}/v1/sync/download-set?version=v+1`,
    ]);
  });
});
