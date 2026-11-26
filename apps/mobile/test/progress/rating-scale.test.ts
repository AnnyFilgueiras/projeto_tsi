import { ratingCaption } from '../../src/features/progress/ui/rating/rating-caption';
import { starValueAt } from '../../src/features/progress/ui/rating/StarRatingInput';

describe('ratingCaption (UX-01E §8)', () => {
  it('has no caption before a score is picked (the save hint already covers it)', () => {
    expect(ratingCaption(null)).toBeNull();
  });

  it.each([
    [0, 'Não rolou dessa vez'],
    [0.5, 'Dá para melhorar'],
    [1, 'Dá para melhorar'],
    [2, 'Dá para melhorar'],
    [2.5, 'Ficou bom'],
    [3.5, 'Ficou bom'],
    [4, 'Muito bom!'],
    [4.5, 'Muito bom!'],
    [5, 'Perfeito!'],
  ])('%s stars → "%s"', (stars, caption) => {
    expect(ratingCaption(stars)).toBe(caption);
  });
});

describe('starValueAt (drag over the 5 stars)', () => {
  const WIDTH = 250; // 5 slots of 50

  it.each([
    [10, 0.5],
    [30, 1],
    [160, 3.5],
    [190, 4],
    [249, 5],
  ])('x = %s → %s stars', (x, stars) => {
    expect(starValueAt(x, WIDTH)).toBe(stars);
  });

  it('clamps outside the row: never below half a star (0 only comes from the stepper)', () => {
    expect(starValueAt(-40, WIDTH)).toBe(0.5);
    expect(starValueAt(400, WIDTH)).toBe(5);
  });

  it('returns null before the row has been measured', () => {
    expect(starValueAt(10, 0)).toBeNull();
  });
});
