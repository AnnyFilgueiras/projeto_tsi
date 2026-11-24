import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../theme';

export type TextLinkTone = 'primary' | 'unlock' | 'onDark';

export interface TextLinkProps {
  readonly label: string;
  readonly onPress: () => void;
  /** `onDark` is for dark surfaces such as the `Toast`. */
  readonly tone?: TextLinkTone;
  readonly testID?: string;
}

const TONE_COLOR: Readonly<Record<TextLinkTone, string>> = {
  primary: colors.primary,
  unlock: colors.successUnlock,
  onDark: colors.primarySoft,
};

/** Tertiary action (§1.6 CTA hierarchy). */
export function TextLink({ label, onPress, tone = 'primary', testID }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={styles.link}
      hitSlop={spacing.xs}
      testID={testID}
    >
      <Text style={[styles.label, { color: TONE_COLOR[tone] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: typography.button,
});
