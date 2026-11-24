import { StyleSheet, Text, View } from 'react-native';
import { formatLastSync } from '../format';
import { colors, spacing, typography } from '../theme';
import { Icon } from './icons/Icon';

export interface LastSyncProps {
  /** `lastSyncAt`, shown in device local time. */
  readonly syncedAt: Date;
}

/** Discreet offline-availability line (§1.5) — information, never an alert. */
export function LastSync({ syncedAt }: LastSyncProps) {
  return (
    <View style={styles.row}>
      <Icon name="download" size={14} color={colors.textMuted} />
      <Text style={styles.text}>{formatLastSync(syncedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  text: { ...typography.overline, flexShrink: 1, color: colors.textMuted, fontWeight: '400' },
});
