import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AuthGuard } from '../../../shared/auth.js';
import { OPERATION_TYPES, type OperationEnvelope } from '../../../shared/operation-applier.js';
import {
  batchTooLargeProblem,
  ProblemError,
  unauthenticatedProblem,
  validationProblem,
} from '../../../shared/problem.js';
import type { SyncService } from './sync-service.js';

export const MAX_SYNC_BATCH_SIZE = 100;

const operationEnvelopeSchema = z
  .object({
    opId: z.string().uuid(),
    type: z.enum(OPERATION_TYPES),
    createdAt: z.string().datetime({ offset: true }),
    payload: z.record(z.unknown()),
  })
  .strict();

const syncBodyEnvelopeSchema = z
  .object({
    operations: z.array(z.unknown()),
  })
  .strict();

export interface SyncRoutesDeps {
  readonly syncService: SyncService;
  readonly authGuard: AuthGuard;
}

export function registerSyncRoutes(app: FastifyInstance, deps: SyncRoutesDeps): void {
  app.post(
    '/v1/sync/operations',
    {
      preHandler: deps.authGuard.requireAuth,
    },
    async (request, reply) => {
      const principal = request.auth;
      if (!principal) {
        throw new ProblemError(unauthenticatedProblem());
      }

      const envelopeCheck = syncBodyEnvelopeSchema.safeParse(request.body);
      if (!envelopeCheck.success) {
        throw new ProblemError(
          validationProblem('O corpo da requisição deve conter o campo `operations` como lista.'),
        );
      }

      const rawOperations = envelopeCheck.data.operations;
      if (rawOperations.length === 0) {
        throw new ProblemError(validationProblem('O lote deve conter ao menos 1 operação.'));
      }

      // OpenAPI contract: > 100 operations returns HTTP 413 `batch-too-large` (not 400 validation).
      if (rawOperations.length > MAX_SYNC_BATCH_SIZE) {
        throw new ProblemError(batchTooLargeProblem(MAX_SYNC_BATCH_SIZE));
      }

      const validatedOperations: OperationEnvelope[] = [];
      for (let index = 0; index < rawOperations.length; index += 1) {
        const parsed = operationEnvelopeSchema.safeParse(rawOperations[index]);
        if (!parsed.success) {
          // A13 / A05: Report only field paths, never raw operation payloads that may carry restrictions.
          const errors = parsed.error.issues.map((issue) => ({
            field: ['operations', String(index), ...issue.path.map(String)].join('.'),
            message: issue.message,
          }));
          throw new ProblemError(
            validationProblem('Uma ou mais operações do lote possuem formato inválido.', errors),
          );
        }
        validatedOperations.push(parsed.data);
      }

      const response = await deps.syncService.processBatch(
        principal.accountId,
        validatedOperations,
      );
      return reply.code(200).send(response);
    },
  );
}
