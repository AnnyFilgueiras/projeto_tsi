import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../../../../shared/theme';
import { Pill } from '../../../../shared/ui';
import type { HistoryEntry } from '../../domain/progress-model';
import { COLLECTION_COPY } from './copy';
import { StarsRow } from './StarsRow';

export interface HistoryViewProps {
  readonly history: readonly HistoryEntry[];
  readonly onOpenEntry: (entry: HistoryEntry) => void;
}

/** US12 / RN06: every preparation, newest first; a repeated dish shows one row per record. */
export function HistoryView({ history, onOpenEntry }: HistoryViewProps) {
  return (
    <View>
      {history.map((entry, index) => (
        <Pressable
          key={entry.ratingId}
          onPress={() => onOpenEntry(entry)}
          accessibilityRole="button"
          style={[styles.row, index > 0 && styles.divider]}
          testID={`history-${entry.ratingId}`}
        >
          <Text style={styles.date}>{COLLECTION_COPY.date(entry.date)}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {entry.dishName ?? COLLECTION_COPY.unavailableDish}
          </Text>
          <StarsRow stars={entry.stars} />
          {entry.commentExcerpt ? (
            <Text style={styles.excerpt} numberOfLines={1}>
              {entry.commentExcerpt}
            </Text>
          ) : null}
          {entry.hasChanges ? <Pill type="unlock" label={COLLECTION_COPY.personalTouch} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: touchTarget.min, gap: spacing.xs, paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { ...typography.caption, color: colors.textSecondary },
  name: {
    ...typography.body,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
  },
  excerpt: { ...typography.caption, color: colors.textSecondary },
});
