import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../../shared/theme';
import { AllergenSeal, Button, DishThumb, Icon, Notice } from '../../../../shared/ui';
import type { KitchenCandidate } from '../../domain';
import { KITCHEN_COPY } from './copy';

/** Outcome of the last "Cozinhar" tap on this card; the card itself never leaves the list. */
export type CookAttempt = 'downloading' | 'offline' | 'failed' | 'not-found';

export interface CandidateCardProps {
  readonly candidate: KitchenCandidate;
  /** Only one primary CTA per screen (§1.6): the first candidate when nothing is cooking. */
  readonly primary: boolean;
  readonly attempt: CookAttempt | undefined;
  readonly onCook: (dishId: string) => void;
}

const ATTEMPT_MESSAGE: Readonly<Record<Exclude<CookAttempt, 'downloading'>, string>> = {
  offline: KITCHEN_COPY.cookOffline,
  failed: KITCHEN_COPY.cookFailed,
  'not-found': KITCHEN_COPY.cookNotFound,
};

export function CandidateCard({ candidate, primary, attempt, onCook }: CandidateCardProps) {
  return (
    <View style={styles.card} testID={`candidate-card-${candidate.suggestionId}`}>
      <View style={styles.row}>
        <DishThumb image={candidate.photoUri ? { uri: candidate.photoUri } : undefined} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {candidate.name}
          </Text>
          <View style={styles.meta}>
            {candidate.cuisineName ? (
              <>
                <Text style={styles.metaText}>{candidate.cuisineName}</Text>
                <Text style={styles.metaDot}>·</Text>
              </>
            ) : null}
            <Icon name="clock" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{KITCHEN_COPY.minutes(candidate.prepTimeMinutes)}</Text>
          </View>
          <AllergenSeal state={candidate.allergenState} />
        </View>
      </View>

      {attempt && attempt !== 'downloading' ? (
        <Notice
          type={attempt === 'offline' ? 'offline' : 'error'}
          message={ATTEMPT_MESSAGE[attempt]}
        />
      ) : null}

      <Button
        label={KITCHEN_COPY.cook}
        variant={primary ? 'primary' : 'secondary'}
        loadingLabel={attempt === 'downloading' ? KITCHEN_COPY.downloading : undefined}
        onPress={() => onCook(candidate.dishId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  info: { flex: 1, gap: spacing.xs },
  name: { ...typography.subtitle, color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  metaText: { ...typography.caption, color: colors.textSecondary },
  metaDot: { ...typography.caption, color: colors.textMuted },
});
