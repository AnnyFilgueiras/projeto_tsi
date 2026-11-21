import { describe, expect, it } from 'vitest';
import { INVARIANTS_PACKAGE_VERSION } from '../src/invariants.js';
import { PACKAGE_VERSION } from '../src/rules.js';

describe('allergen-rules foundation (ADR-014, S6)', () => {
  it('exposes the shared package version across rules and invariants entrypoints', () => {
    expect(PACKAGE_VERSION).toBe('0.1.0');
    expect(INVARIANTS_PACKAGE_VERSION).toBe(PACKAGE_VERSION);
  });
});
