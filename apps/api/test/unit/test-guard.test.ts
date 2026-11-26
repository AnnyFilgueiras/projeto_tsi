import { describe, expect, it } from 'vitest';
import { assertResettableDatabaseUrl, assertTestDatabaseUrl } from '../../src/db/test-guard.js';

describe('database safety guards (Playbook 03, Section 4)', () => {
  it('accepts a PostgreSQL URL ending in _test for integration tests', () => {
    const url = 'postgresql://panelada:panelada@localhost:5432/panelada_test';
    expect(assertTestDatabaseUrl(url)).toBe(url);
  });

  it('rejects panelada_dev for integration tests to prevent wiping development data', () => {
    expect(() =>
      assertTestDatabaseUrl('postgresql://panelada:panelada@localhost:5432/panelada_dev'),
    ).toThrow(/ending with "_test"/);
  });

  it('rejects missing, empty, or invalid URLs for integration tests', () => {
    expect(() => assertTestDatabaseUrl(undefined)).toThrow(/required/);
    expect(() => assertTestDatabaseUrl('')).toThrow(/required/);
    expect(() => assertTestDatabaseUrl('not-a-url')).toThrow(/not a valid URL/);
    expect(() => assertTestDatabaseUrl('mysql://user:pass@localhost:3306/panelada_test')).toThrow(
      /Unsupported database protocol/,
    );
    expect(() => assertTestDatabaseUrl('postgresql://panelada:panelada@localhost:5432/')).toThrow(
      /specify a database name/,
    );
  });

  it('allows db:reset on _dev and _test databases while blocking production-like names', () => {
    expect(
      assertResettableDatabaseUrl('postgresql://panelada:panelada@localhost:5432/panelada_dev'),
    ).toContain('panelada_dev');
    expect(
      assertResettableDatabaseUrl('postgresql://panelada:panelada@localhost:5432/panelada_test'),
    ).toContain('panelada_test');
    expect(() =>
      assertResettableDatabaseUrl('postgresql://panelada:panelada@localhost:5432/panelada_prod'),
    ).toThrow(/ending with "_dev" or "_test"/);
  });
});
