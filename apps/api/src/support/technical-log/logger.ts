import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

/**
 * Sensitive field paths scrubbed from every structured log entry (A13, A05).
 * Dietary restrictions, auth tokens, passwords, and encryption material must never appear in logs.
 */
const SENSITIVE_FIELD_NAMES = [
  'authorization',
  'password',
  'passwordHash',
  'refreshToken',
  'accessToken',
  'token',
  'tokenHash',
  'restrictions',
  'restrictionType',
  'encryptedType',
  'allergens',
  'key',
  'keys',
  'encryptionKey',
  'masterKey',
  'jwtSecret',
  'secret',
  'ciphertext',
  'iv',
  'authTag',
] as const;

export const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'operations[*].payload.restrictionType',
  '*.operations[*].payload.restrictionType',
  'body.operations[*].payload.restrictionType',
  'req.body.operations[*].payload.restrictionType',
  'req.body.refreshToken',
  'req.body.password',
  ...SENSITIVE_FIELD_NAMES,
  ...SENSITIVE_FIELD_NAMES.map((field) => `*.${field}`),
  ...SENSITIVE_FIELD_NAMES.map((field) => `*.*.${field}`),
  ...SENSITIVE_FIELD_NAMES.map((field) => `*.*.*.${field}`),
] as const;

export type TechnicalLogger = Logger;

export function createLoggerOptions(level = process.env.LOG_LEVEL ?? 'info'): LoggerOptions {
  return {
    level,
    redact: {
      paths: [...REDACTED_LOG_PATHS],
      censor: '[REDACTED]',
    },
  };
}

export function createTechnicalLogger(
  level = process.env.LOG_LEVEL ?? 'info',
  destination?: DestinationStream,
): TechnicalLogger {
  const options = createLoggerOptions(level);
  return destination ? pino(options, destination) : pino(options);
}
