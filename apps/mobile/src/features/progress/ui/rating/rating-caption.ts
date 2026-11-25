/**
 * Dynamic caption under the stars (UX-01E §8). Half a star sits with 1–2: the spec only lists
 * whole bands and 0.5 is closer to "could be better" than to "didn't work out".
 */
export function ratingCaption(stars: number | null): string | null {
  if (stars === null) return null;
  if (stars === 0) return 'Não rolou dessa vez';
  if (stars <= 2) return 'Dá para melhorar';
  if (stars <= 3.5) return 'Ficou bom';
  if (stars < 5) return 'Muito bom!';
  return 'Perfeito!';
}
