import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface FieldLabelProps {
  readonly label: string;
  /** e.g. "obrigatória" / "opcional". */
  readonly hint?: string;
}

export function FieldLabel({ label, hint }: FieldLabelProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { ...typography.body, flexShrink: 1, color: colors.textPrimary, fontWeight: '600' },
  hint: { ...typography.caption, color: colors.textMuted, fontWeight: '500' },
});
