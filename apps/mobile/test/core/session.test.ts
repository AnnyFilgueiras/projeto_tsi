import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { createFetchHttpClient } from '../../src/core/network/fetch-http-client-adapter';
import { createSessionGate } from '../../src/core/network/session';
import { createFakeFetch } from '../support/fake-fetch';
import { createFakeTokenStore, tokenPair } from '../support/fake-token-store';

function setup(initial = createFakeTokenStore(null)) {
  const fake = createFakeFetch({
    'POST /v1/accounts/anonymous': () => ({
      status: 201,
      body: { accountId: '00000000-0000-0000-0000-000000000001', tokens: tokenPair('anon') },
    }),
  });
  const http = createFetchHttpClient({
    baseUrl: 'http://api.test',
    fetch: fake.fetch,
    tokenStore: initial,
    packageVersion: PACKAGE_VERSION,
    now: () => new Date('2026-11-23T12:00:00.000Z'),
  });
  return { fake, tokens: initial, gate: createSessionGate(http, initial) };
}

describe('SessionGate (RNF02, ADR-007)', () => {
  it('creates exactly one anonymous account even when asked concurrently', async () => {
    const { fake, tokens, gate } = setup();

    await Promise.all([gate.ensureSession(), gate.ensureSession()]);

    expect(fake.requests).toHaveLength(1);
    expect(tokens.current).toEqual(tokenPair('anon'));
  });

  it('keeps an existing session untouched', async () => {
    const { fake, gate } = setup(createFakeTokenStore(tokenPair('existing')));

    await gate.ensureSession();

    expect(fake.requests).toHaveLength(0);
  });
});
