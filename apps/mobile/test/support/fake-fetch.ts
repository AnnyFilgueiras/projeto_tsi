export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export interface FakeReply {
  readonly status: number;
  readonly body?: unknown;
}

type Handler = (request: RecordedRequest) => FakeReply | Promise<FakeReply>;

/**
 * Programmable `fetch` double: routes by "METHOD /path" and records every request so tests can
 * assert on headers and call counts without a network.
 */
export function createFakeFetch(routes: Record<string, Handler>) {
  const requests: RecordedRequest[] = [];

  const fetchImpl = jest.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input);
    const request: RecordedRequest = {
      method: init.method ?? 'GET',
      url: input,
      headers: { ...(init.headers as Record<string, string>) },
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    requests.push(request);

    const handler = routes[`${request.method} ${url.pathname}`];
    if (!handler) {
      throw new Error(`Unexpected request ${request.method} ${url.pathname}`);
    }
    const reply = await handler(request);
    return {
      status: reply.status,
      ok: reply.status >= 200 && reply.status < 300,
      json: async () => reply.body,
    } as Response;
  });

  return { fetch: fetchImpl as unknown as typeof fetch, requests };
}

/** `fetch` that fails like a device with no connectivity (TypeError: Network request failed). */
export const offlineFetch = (async () => {
  throw new TypeError('Network request failed');
}) as unknown as typeof fetch;
