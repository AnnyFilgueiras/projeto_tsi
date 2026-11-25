import { parseCollectionView } from '../../src/features/progress/ui/collection/collection-view';

describe('parseCollectionView (route param `view`)', () => {
  it.each(['cuisines', 'evolutions', 'badges', 'history'] as const)('accepts %s', (view) => {
    expect(parseCollectionView(view)).toBe(view);
  });

  it.each([undefined, '', 'ranking', 'Badges', ['badges', 'history']])(
    'falls back to cuisines for %p',
    (value) => {
      expect(parseCollectionView(value)).toBe('cuisines');
    },
  );
});
