import { describe, expect, it } from 'vitest';
import { resolvePoolConfig } from '../../src/db/client.js';

const CA = '-----BEGIN CERTIFICATE-----\nMIIBfake\n-----END CERTIFICATE-----';

describe('resolvePoolConfig (MVP-04G, Supabase TLS)', () => {
  it('keeps the local Docker connection untouched when no CA is configured', () => {
    const url = 'postgresql://panelada:panelada@localhost:5432/panelada_dev';

    expect(resolvePoolConfig(url, {})).toEqual({ connectionString: url });
  });

  it('verifies the server against DATABASE_SSL_CA when it is set', () => {
    const url = 'postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

    expect(resolvePoolConfig(url, { DATABASE_SSL_CA: CA })).toEqual({
      connectionString: url,
      ssl: { ca: CA, rejectUnauthorized: true },
    });
  });

  it('strips ssl query parameters that would otherwise override the CA in pg', () => {
    const url =
      'postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&application_name=panelada';

    expect(resolvePoolConfig(url, { DATABASE_SSL_CA: CA })).toEqual({
      connectionString:
        'postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres?application_name=panelada',
      ssl: { ca: CA, rejectUnauthorized: true },
    });
  });

  it('accepts a CA pasted with escaped newlines from a single-line secret field', () => {
    const url = 'postgresql://u:p@host:5432/postgres';
    const escaped = CA.replace(/\n/g, '\\n');

    expect(resolvePoolConfig(url, { DATABASE_SSL_CA: escaped }).ssl).toEqual({
      ca: CA,
      rejectUnauthorized: true,
    });
  });
});
