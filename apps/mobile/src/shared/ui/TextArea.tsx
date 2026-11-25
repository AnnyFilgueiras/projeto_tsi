import { StyleSheet, TextInput } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export interface TextAreaProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  /** Usually the `FieldLabel` text shown above, since the placeholder disappears on typing. */
  readonly accessibilityLabel: string;
  readonly maxLength?: number;
  /** False while a save is in flight: the text stays visible but read-only. */
  readonly editable?: boolean;
  readonly testID?: string;
}

const MIN_HEIGHT = 84;

/** Multiline free-text field (UX-01 "Text Area"), paired with a `FieldLabel` above. */
export function TextArea({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  maxLength,
  editable = true,
  testID,
}: TextAreaProps) {
  return (
    <TextInput
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !editable }}
      maxLength={maxLength}
      editable={editable}
      textAlignVertical="top"
      style={[styles.field, !editable && styles.readOnly]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    ...typography.body,
    minHeight: MIN_HEIGHT,
    padding: spacing.md - spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  readOnly: { backgroundColor: colors.surfaceAlt, color: colors.textSecondary },
});
