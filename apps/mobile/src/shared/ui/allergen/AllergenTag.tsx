import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { ALLERGEN_TAG_TEXT } from './copy';

/** Marks an ingredient that matches the user's restrictions (§1.4c). */
export function AllergenTag() {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{ALLERGEN_TAG_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.allergenDangerSoft,
  },
  text: { ...typography.overline, color: colors.allergenDanger },
});
