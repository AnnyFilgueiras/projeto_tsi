import { ALLERGEN_CODES, type AllergenCode } from '@panelada/allergen-rules/rules';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { ALLERGEN_GROUPS, ALLERGEN_LABELS, Chip, SearchField } from '../../../../shared/ui';

export interface AllergenPickerProps {
  readonly selected: readonly AllergenCode[];
  readonly onToggle: (code: AllergenCode) => void;
}

/**
 * Search + grouped chips over the 19 controlled codes (A7, ux-onda1a §1.4). Shared by onboarding
 * and the Profile's "Adicionar restrição" (#78). Selected chips stay visible whatever the search,
 * so a filter never hides what the user already picked.
 */
export function AllergenPicker({ selected, onToggle }: AllergenPickerProps) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const term = normalize(query.trim());
    const visible = ALLERGEN_CODES.filter(
      (code) =>
        !term ||
        selected.includes(code) ||
        normalize(ALLERGEN_LABELS[code].label).includes(term) ||
        normalize(code).includes(term),
    );
    return ALLERGEN_GROUPS.map((group) => ({
      group,
      codes: visible.filter((code) => ALLERGEN_LABELS[code].group === group),
    })).filter(({ codes }) => codes.length > 0);
  }, [query, selected]);

  return (
    <View style={styles.picker}>
      <SearchField value={query} onChangeText={setQuery} placeholder="Buscar alérgeno" />
      {groups.length === 0 ? (
        <Text style={styles.empty}>Nenhum alérgeno com esse nome.</Text>
      ) : (
        groups.map(({ group, codes }, index) => (
          <View key={group} style={[styles.group, index > 0 && styles.divided]}>
            <Text style={styles.groupTitle} accessibilityRole="header">
              {group}
            </Text>
            <View style={styles.chips}>
              {codes.map((code) => (
                <Chip
                  key={code}
                  label={ALLERGEN_LABELS[code].label}
                  selected={selected.includes(code)}
                  onPress={() => onToggle(code)}
                  fill
                />
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// "castanha" must match "Castanha-do-pará" and "pecã" must match "peca".
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const styles = StyleSheet.create({
  picker: { gap: spacing.md },
  group: { gap: spacing.sm },
  // A rule between groups plus a stronger title, so the 7 groups read as separate sections.
  divided: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  groupTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: typography.button.fontWeight,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { ...typography.body, color: colors.textSecondary },
});
