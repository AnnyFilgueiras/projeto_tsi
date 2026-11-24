import { formatDate, formatLastSync, formatStars, formatTime } from '../../../src/shared/format';

// Jest runs with TZ=UTC, so `new Date(Date.UTC(...))` reads back the same wall-clock fields.
const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, min));

describe('formatDate', () => {
  it.each([
    [at(2026, 1, 5), '05/01/2026'],
    [at(2026, 11, 23), '23/11/2026'],
    [at(2027, 12, 31), '31/12/2027'],
  ])('%s → %s', (date, expected) => {
    expect(formatDate(date)).toBe(expected);
  });
});

describe('formatTime', () => {
  it.each([
    [at(2026, 1, 1, 0, 0), '00:00'],
    [at(2026, 1, 1, 9, 5), '09:05'],
    [at(2026, 1, 1, 23, 59), '23:59'],
  ])('%s → %s', (date, expected) => {
    expect(formatTime(date)).toBe(expected);
  });
});

describe('formatLastSync', () => {
  it('uses the §1.5 sentence with zero-padded day, month and time', () => {
    expect(formatLastSync(at(2026, 11, 23, 9, 10))).toBe(
      'Disponível offline · atualizado em 23/11 às 09:10',
    );
    expect(formatLastSync(at(2026, 3, 7, 18, 4))).toBe(
      'Disponível offline · atualizado em 07/03 às 18:04',
    );
  });
});

describe('formatStars', () => {
  it.each([
    [3.5, '3,5'],
    [4, '4'],
    [0.5, '0,5'],
    [5, '5'],
    [4.25, '4,3'],
  ])('%d → %s', (value, expected) => {
    expect(formatStars(value)).toBe(expected);
  });
});
