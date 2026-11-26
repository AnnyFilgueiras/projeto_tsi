import { ALLERGEN_CODES } from '@panelada/allergen-rules/rules';
import { ALLERGEN_GROUPS, ALLERGEN_LABELS } from '../../../src/shared/ui';

describe('ALLERGEN_LABELS (§1.4)', () => {
  it.each(ALLERGEN_CODES.map((code) => [code]))(
    '%s has a pt-BR label and a known group',
    (code) => {
      const entry = ALLERGEN_LABELS[code];
      expect(entry.label.trim()).not.toBe('');
      expect(ALLERGEN_GROUPS).toContain(entry.group);
    },
  );

  it('covers exactly the 19 controlled codes', () => {
    expect(Object.keys(ALLERGEN_LABELS).sort()).toEqual([...ALLERGEN_CODES].sort());
    expect(ALLERGEN_CODES).toHaveLength(19);
  });
});
