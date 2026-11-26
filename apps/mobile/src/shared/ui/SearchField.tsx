import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface SearchFieldProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder: string;
  /** Defaults to the placeholder. */
  readonly accessibilityLabel?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <Icon name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        returnKeyType="search"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md - spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { ...typography.body, flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm },
});
