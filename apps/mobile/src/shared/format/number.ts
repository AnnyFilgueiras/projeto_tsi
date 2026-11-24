/**
 * Star rating with a decimal comma: 3.5 → "3,5", 4 → "4". Ratings move in half steps, so one
 * decimal place is enough.
 */
export function formatStars(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}
