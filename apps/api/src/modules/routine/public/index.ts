import type { DatabaseClient } from '../../../db/client.js';
import { DrizzleRoutineRepository } from '../internal/repository.js';
import { RoutineSuggestionService } from '../internal/service.js';
import type { RoutinePublicPort } from './routine-public.js';

export interface CreateRoutineModuleDeps {
  readonly dbClient: DatabaseClient;
  readonly clock?: () => Date;
}

export interface RoutineModule {
  readonly publicPort: RoutinePublicPort;
}

/**
 * Composition root factory for the routine module (ADR-002, P06, RN11).
 * Wave 1A wires the suggestion lifecycle; meal plans and shopping lists arrive in Wave 1B.
 */
export function createRoutineModule(deps: CreateRoutineModuleDeps): RoutineModule {
  const repository = new DrizzleRoutineRepository(deps.dbClient.db);
  const service = new RoutineSuggestionService({
    dbClient: deps.dbClient,
    store: repository,
    clock: deps.clock,
  });

  return {
    publicPort: service,
  };
}

export type {
  RoutinePublicPort,
  SuggestionExclusions,
  SuggestionRecord,
  SuggestionStatus,
} from './routine-public.js';
