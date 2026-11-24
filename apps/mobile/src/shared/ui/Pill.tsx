import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export type PillType = 'offline' | 'unlock' | 'soon';

export interface PillProps {
  readonly type: PillType;
  readonly label: string;
  readonly icon?: IconName;
}

const LOOK: Readonly<Record<PillType, { color: string; background: string; icon?: IconName }>> = {
  offline: { color: colors.onOfflineBanner, background: colors.offlineBanner, icon: 'check' },
  unlock: { color: colors.successUnlock, background: colors.successUnlockSoft },
  // textSecondary, not textMuted: the pair textMuted/surfaceAlt fails AA (§1.2).
  soon: { color: colors.textSecondary, background: colors.surfaceAlt },
};

/** Compact, non-interactive status label (e.g. "Offline", "Evolução", "Em breve"). */
export function Pill({ type, label, icon }: PillProps) {
  const look = LOOK[type];
  const glyph = icon ?? look.icon;
  return (
    <View style={[styles.pill, { backgroundColor: look.background }]}>
      <Text style={[styles.label, { color: look.color }]}>{label}</Text>
      {glyph ? <Icon name={glyph} size={12} color={look.color} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  label: { ...typography.overline, fontWeight: typography.button.fontWeight },
});
