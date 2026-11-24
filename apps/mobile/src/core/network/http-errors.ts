import type { components } from './openapi.generated';

export type Problem = components['schemas']['Problem'];

/** The request never reached the API (no connectivity, DNS, timeout). Safe to retry later. */
export class NetworkUnavailableError extends Error {
  override readonly name = 'NetworkUnavailableError';
}

/** The API answered with a non-success status; `problem` is the RFC 9457 body when present. */
export class HttpError extends Error {
  override readonly name: string = 'HttpError';

  constructor(
    readonly status: number,
    readonly problem: Problem | undefined,
  ) {
    super(problem?.title ?? `HTTP ${status}`);
  }
}

/** No usable session: never created, or the refresh token was refused (ADR-007). */
export class SessionExpiredError extends HttpError {
  override readonly name = 'SessionExpiredError';

  constructor(problem?: Problem) {
    super(401, problem);
  }
}
