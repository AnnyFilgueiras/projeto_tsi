import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../theme';
import { IconButton } from './IconButton';

export interface TopbarProps {
  readonly title: string;
  /** Stack screens show "Voltar"; full-screen modals show "Fechar" (§1.1 rule 2). */
  readonly leading?: 'back' | 'close';
  readonly onLeadingPress?: () => void;
  /** Right slot, usually a `Pill`. */
  readonly trailing?: ReactNode;
}

export function Topbar({ title, leading, onLeadingPress, trailing }: TopbarProps) {
  return (
    <View style={styles.bar}>
      {leading && onLeadingPress ? (
        <IconButton
          icon={leading}
          accessibilityLabel={leading === 'back' ? 'Voltar' : 'Fechar'}
          onPress={onLeadingPress}
        />
      ) : null}
      <Text accessibilityRole="header" style={[styles.title, !leading && styles.titleAlone]}>
        {title}
      </Text>
      {/* Wrapper keeps self-aligned children (e.g. Pill) vertically centered in the bar. */}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTarget.comfortable,
    paddingHorizontal: spacing.xs,
  },
  title: { ...typography.subtitle, flex: 1, color: colors.textPrimary },
  trailing: { paddingRight: spacing.sm },
  titleAlone: { paddingHorizontal: spacing.md - spacing.xs },
});
