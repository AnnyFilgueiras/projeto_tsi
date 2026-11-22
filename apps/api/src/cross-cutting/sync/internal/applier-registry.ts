import {
  OPERATION_TYPES,
  type OperationApplier,
  type OperationType,
} from '../../../shared/operation-applier.js';

export class DuplicateOperationApplierError extends Error {
  constructor(operationType: OperationType) {
    super(`Duplicate OperationApplier registered for operation type "${operationType}".`);
    this.name = 'DuplicateOperationApplierError';
  }
}

export class MissingOperationApplierError extends Error {
  constructor(missingTypes: readonly OperationType[]) {
    super(
      `Missing OperationApplier registrations for operation types: ${missingTypes.join(', ')}.`,
    );
    this.name = 'MissingOperationApplierError';
  }
}

export interface OperationApplierRegistryOptions {
  /**
   * When true, fails boot if any of the 8 canonical OPERATION_TYPES lacks an applier (P01).
   * Defaults to false during incremental Wave 1A slices before rating/routine appliers exist.
   */
  readonly requireAllTypes?: boolean;
}

/**
 * Boot-time registry mapping each canonical OperationType to its owning domain applier (P01).
 */
export class OperationApplierRegistry {
  private readonly appliers = new Map<OperationType, OperationApplier>();

  constructor(
    appliers: readonly OperationApplier[],
    options: OperationApplierRegistryOptions = {},
  ) {
    for (const applier of appliers) {
      if (this.appliers.has(applier.operationType)) {
        throw new DuplicateOperationApplierError(applier.operationType);
      }
      this.appliers.set(applier.operationType, applier);
    }

    if (options.requireAllTypes) {
      const missing = OPERATION_TYPES.filter((type) => !this.appliers.has(type));
      if (missing.length > 0) {
        throw new MissingOperationApplierError(missing);
      }
    }
  }

  get(operationType: OperationType): OperationApplier | undefined {
    return this.appliers.get(operationType);
  }
}
