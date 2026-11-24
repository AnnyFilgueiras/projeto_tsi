import { createUuidV7Generator } from '../../src/core/sync/id-generator';

describe('UUID v7 opId generator (ADR-008: opId is a client UUID v7)', () => {
  const zeros = (n: number) => new Uint8Array(n);

  it('produces an RFC 9562 v7 UUID with version and variant bits', () => {
    const next = createUuidV7Generator({
      randomBytes: (n) => new Uint8Array(n).fill(0xff),
      now: () => 0,
    });

    const id = next();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('encodes the Unix millisecond timestamp in the first 48 bits (time-ordered)', () => {
    const ms = Date.parse('2026-11-23T12:00:00.000Z');
    const next = createUuidV7Generator({ randomBytes: zeros, now: () => ms });

    const hex = next().replace(/-/g, '');

    expect(parseInt(hex.slice(0, 12), 16)).toBe(ms);
  });

  it('sorts lexicographically by creation time', () => {
    let t = 1_000;
    const next = createUuidV7Generator({ randomBytes: zeros, now: () => t });

    const earlier = next();
    t = 2_000;
    const later = next();

    expect([later, earlier].sort()).toEqual([earlier, later]);
  });
});
