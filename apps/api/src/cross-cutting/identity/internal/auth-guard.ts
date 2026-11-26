import type { FastifyRequest } from 'fastify';
import type { AccountRole, AuthGuard } from '../../../shared/auth.js';
import {
  forbiddenRoleProblem,
  ProblemError,
  unauthenticatedProblem,
} from '../../../shared/problem.js';
import type { TokenIssuer } from './token-issuer.js';

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== 'string') {
    return null;
  }
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function createAuthGuard(tokenIssuer: TokenIssuer): AuthGuard {
  const requireAuth: AuthGuard['requireAuth'] = async (request) => {
    const token = extractBearerToken(request);
    if (!token) {
      throw new ProblemError(unauthenticatedProblem());
    }
    request.auth = tokenIssuer.verify(token);
  };

  return {
    requireAuth,
    requireRole(role: AccountRole) {
      return async (request, reply) => {
        await requireAuth(request, reply);
        if (request.auth?.role !== role) {
          throw new ProblemError(forbiddenRoleProblem());
        }
      };
    },
  };
}
