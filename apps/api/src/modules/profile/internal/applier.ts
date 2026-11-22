import { ALLERGEN_CODES, type AllergenCode } from '@panelada/allergen-rules/rules';
import { z } from 'zod';
import type {
  OperationApplier,
  OperationApplyContext,
  OperationApplyResult,
  OperationEnvelope,
} from '../../../shared/operation-applier.js';
import { businessRuleProblem, ProblemError } from '../../../shared/problem.js';
import type { ProfileService } from './service.js';

const allergenCodeSchema = z.enum(ALLERGEN_CODES);

const registerRestrictionPayloadSchema = z
  .object({
    restrictionType: allergenCodeSchema,
    consentAt: z.string().datetime({ offset: true }),
  })
  .strict();

const revokeRestrictionPayloadSchema = z
  .object({
    restrictionType: allergenCodeSchema,
  })
  .strict();

function invalidRestrictionPayloadResult(): OperationApplyResult {
  // A13 / A05: Never echo invalid restrictionType values into Problem details or logs.
  return {
    status: 'rejected',
    error: businessRuleProblem(
      'Operação de restrição alimentar inválida: informe um código do vocabulário controlado e consentAt em ISO 8601 quando obrigatório.',
    ),
  };
}

/**
 * Creates `OperationApplier` handlers for `restriction.register` and `restriction.revoke` (P01, RN09).
 */
export function createProfileAppliers(
  profileService: ProfileService,
): readonly [OperationApplier<'restriction.register'>, OperationApplier<'restriction.revoke'>] {
  const registerApplier: OperationApplier<'restriction.register'> = {
    operationType: 'restriction.register',
    async apply(
      operation: OperationEnvelope<'restriction.register'>,
      context: OperationApplyContext,
    ): Promise<OperationApplyResult> {
      const parsed = registerRestrictionPayloadSchema.safeParse(operation.payload);
      if (!parsed.success) {
        return invalidRestrictionPayloadResult();
      }

      const restrictionType: AllergenCode = parsed.data.restrictionType;
      const consentAt = new Date(parsed.data.consentAt);
      if (Number.isNaN(consentAt.getTime())) {
        return invalidRestrictionPayloadResult();
      }

      try {
        await profileService.registerRestriction(
          context.accountId,
          restrictionType,
          consentAt,
          context.tx,
        );
        return { status: 'confirmed' };
      } catch (error: unknown) {
        // OpenAPI contract: per-item domain rejections must not abort the entire sync batch.
        if (error instanceof ProblemError) {
          return { status: 'rejected', error: error.problem };
        }
        throw error;
      }
    },
  };

  const revokeApplier: OperationApplier<'restriction.revoke'> = {
    operationType: 'restriction.revoke',
    async apply(
      operation: OperationEnvelope<'restriction.revoke'>,
      context: OperationApplyContext,
    ): Promise<OperationApplyResult> {
      const parsed = revokeRestrictionPayloadSchema.safeParse(operation.payload);
      if (!parsed.success) {
        return invalidRestrictionPayloadResult();
      }

      await profileService.revokeRestriction(
        context.accountId,
        parsed.data.restrictionType,
        context.tx,
      );
      return { status: 'confirmed' };
    },
  };

  return [registerApplier, revokeApplier] as const;
}
