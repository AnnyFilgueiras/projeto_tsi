import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type AuthenticatedPrincipal,
} from '../../../shared/auth.js';
import { ProblemError, unauthenticatedProblem } from '../../../shared/problem.js';

export const ACCESS_TOKEN_TTL_SECONDS = 45 * 60;

export interface IssuedAccessToken {
  readonly token: string;
  readonly expiresAt: string;
}

export interface TokenIssuer {
  issueAccess(accountId: string, role: AccountRole): IssuedAccessToken;
  verify(token: string): AuthenticatedPrincipal;
}

export interface Hs256TokenIssuerOptions {
  readonly secret: string;
  readonly ttlSeconds?: number;
  readonly clock?: () => Date;
}

const JWT_HEADER_ENCODED = Buffer.from(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  'utf8',
).toString('base64url');

const ROLE_SET: ReadonlySet<string> = new Set(ACCOUNT_ROLES);

function isValidRole(value: unknown): value is AccountRole {
  return typeof value === 'string' && ROLE_SET.has(value);
}

/**
 * RFC 7519 HS256 JWT issuer (ADR-007).
 * Emits minimal claims (`sub`, `role`, `iat`, `exp`) with a 45-minute lifetime —
 * never embeds email, dietary restrictions, or other sensitive data.
 */
export class Hs256TokenIssuer implements TokenIssuer {
  private readonly secret: Buffer;
  private readonly ttlSeconds: number;
  private readonly clock: () => Date;

  constructor(options: Hs256TokenIssuerOptions) {
    if (options.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long.');
    }
    this.secret = Buffer.from(options.secret, 'utf8');
    this.ttlSeconds = options.ttlSeconds ?? ACCESS_TOKEN_TTL_SECONDS;
    this.clock = options.clock ?? (() => new Date());
  }

  issueAccess(accountId: string, role: AccountRole): IssuedAccessToken {
    const nowMs = this.clock().getTime();
    const iat = Math.floor(nowMs / 1000);
    const exp = iat + this.ttlSeconds;

    const payloadEncoded = Buffer.from(
      JSON.stringify({
        sub: accountId,
        role,
        iat,
        exp,
      }),
      'utf8',
    ).toString('base64url');

    const signingInput = `${JWT_HEADER_ENCODED}.${payloadEncoded}`;
    const signature = this.sign(signingInput);

    return {
      token: `${signingInput}.${signature}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  verify(token: string): AuthenticatedPrincipal {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new ProblemError(unauthenticatedProblem());
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    if (
      !headerPart ||
      !payloadPart ||
      !signaturePart ||
      !/^[A-Za-z0-9_-]+$/.test(headerPart) ||
      !/^[A-Za-z0-9_-]+$/.test(payloadPart) ||
      !/^[A-Za-z0-9_-]+$/.test(signaturePart)
    ) {
      throw new ProblemError(unauthenticatedProblem());
    }

    let header: unknown;
    try {
      header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    } catch {
      throw new ProblemError(unauthenticatedProblem());
    }

    if (
      typeof header !== 'object' ||
      header === null ||
      (header as { alg?: unknown }).alg !== 'HS256'
    ) {
      throw new ProblemError(unauthenticatedProblem());
    }

    const expectedSig = Buffer.from(this.sign(`${headerPart}.${payloadPart}`), 'utf8');
    const actualSig = Buffer.from(signaturePart, 'utf8');
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      throw new ProblemError(unauthenticatedProblem());
    }

    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch {
      throw new ProblemError(unauthenticatedProblem());
    }

    if (typeof payload !== 'object' || payload === null) {
      throw new ProblemError(unauthenticatedProblem());
    }

    const { sub, role, exp } = payload as { sub?: unknown; role?: unknown; exp?: unknown };
    const nowSeconds = Math.floor(this.clock().getTime() / 1000);
    if (
      typeof sub !== 'string' ||
      sub.length === 0 ||
      !isValidRole(role) ||
      typeof exp !== 'number' ||
      !Number.isFinite(exp) ||
      exp <= nowSeconds
    ) {
      throw new ProblemError(unauthenticatedProblem());
    }

    return {
      accountId: sub,
      role,
    };
  }

  private sign(input: string): string {
    return createHmac('sha256', this.secret).update(input, 'utf8').digest('base64url');
  }
}
