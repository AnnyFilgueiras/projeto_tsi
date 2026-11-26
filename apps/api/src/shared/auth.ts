import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Canonical account roles defined in openapi.yaml and glossario-identificadores.md (ADR-015).
 */
export const ACCOUNT_ROLES = ['user', 'curator'] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/**
 * Minimal JWT claims attached to authenticated Fastify requests (ADR-007).
 * Never carries email, dietary restrictions, or any sensitive personal data.
 */
export interface AuthenticatedPrincipal {
  readonly accountId: string;
  readonly role: AccountRole;
}

export type AuthPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

/**
 * Route-level authentication port injected from `src/app.ts` into domain and sync modules
 * so those modules never import `cross-cutting/identity` directly (S2).
 */
export interface AuthGuard {
  readonly requireAuth: AuthPreHandler;
  requireRole(role: AccountRole): AuthPreHandler;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthenticatedPrincipal;
  }
}
