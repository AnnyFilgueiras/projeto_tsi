import type { AllergenState } from '@panelada/allergen-rules/rules';
import { StyleSheet, Text } from 'react-native';
import { BottomSheet, colors, typography } from '../../../shared';

// One plain sentence per state (D7): what the seal means, without vocabulary counts.
const MEANING: Readonly<Record<AllergenState, { title: string; text: string }>> = {
  verified: {
    title: 'Verificado',
    text: 'A curadoria conferiu os alérgenos desta receita.',
  },
  source_declared: {
    title: 'Declarado pela fonte',
    text: 'A lista veio da fonte original e ainda não foi conferida pela curadoria.',
  },
  unverified: {
    title: 'Não verificado',
    text: 'Os alérgenos desta receita ainda não foram conferidos.',
  },
};

export interface AllergenStateSheetProps {
  readonly state: AllergenState;
  readonly onClose: () => void;
}

export function AllergenStateSheet({ state, onClose }: AllergenStateSheetProps) {
  const meaning = MEANING[state];
  return (
    <BottomSheet visible onClose={onClose} overline="Alérgenos" title={meaning.title}>
      <Text style={styles.text}>{meaning.text}</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textSecondary },
});
