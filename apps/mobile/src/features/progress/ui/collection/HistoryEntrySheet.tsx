import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { BottomSheet, Button } from '../../../../shared/ui';
import type { HistoryEntry } from '../../domain/progress-model';
import { COLLECTION_COPY } from './copy';
import { StarsRow } from './StarsRow';

export interface HistoryEntrySheetProps {
  readonly entry: HistoryEntry | null;
  readonly onClose: () => void;
  readonly onOpenRecipe: (dishId: string) => void;
}

const SHEET_STAR_SIZE = 20;

/** The full record behind a history row (US12): sections only appear when they have text. */
export function HistoryEntrySheet({ entry, onClose, onOpenRecipe }: HistoryEntrySheetProps) {
  return (
    <BottomSheet
      visible={entry !== null}
      onClose={onClose}
      overline={entry ? COLLECTION_COPY.date(entry.date) : undefined}
      title={entry ? (entry.dishName ?? COLLECTION_COPY.unavailableDish) : ''}
      testID="history-sheet"
    >
      {entry ? (
        <>
          <View style={styles.score}>
            <StarsRow stars={entry.stars} size={SHEET_STAR_SIZE} />
            <Text style={styles.scoreText} importantForAccessibility="no">
              {COLLECTION_COPY.stars(entry.stars)}
            </Text>
          </View>
          {entry.comment ? (
            <View style={styles.section}>
              <Text style={styles.label}>{COLLECTION_COPY.comment}</Text>
              <Text style={styles.body}>{entry.comment}</Text>
            </View>
          ) : null}
          {entry.changes ? (
            <View style={styles.section}>
              <Text style={styles.label}>{COLLECTION_COPY.changes}</Text>
              <Text style={styles.body}>{entry.changes}</Text>
            </View>
          ) : null}
          {/* A dish that left the catalog has no recipe to open (RN01). */}
          {entry.dishName !== null ? (
            <Button
              label={COLLECTION_COPY.seeRecipe}
              onPress={() => {
                onClose();
                onOpenRecipe(entry.dishId);
              }}
            />
          ) : null}
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scoreText: {
    ...typography.body,
    fontWeight: typography.button.fontWeight,
    color: colors.textPrimary,
  },
  section: { gap: spacing.xxs },
  label: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase' },
  body: { ...typography.body, color: colors.textPrimary },
});
