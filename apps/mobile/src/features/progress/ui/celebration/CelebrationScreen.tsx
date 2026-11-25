import { useEffect, useMemo, useState } from 'react';
import { BackHandler, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { Button, TextLink } from '../../../../shared/ui';
import {
  buildCelebration,
  parseCelebrationParams,
  type CelebrationView,
} from '../../domain/celebration';
import type { ProgressSnapshotSource } from '../../domain/progress-model';
import { BadgesEarnedBlock } from './BadgesEarnedBlock';
import { ConfirmationBlock } from './ConfirmationBlock';
import { CELEBRATION_COPY } from './copy';
import { CuisineProgressBlock } from './CuisineProgressBlock';
import { EvolutionUnlockedCard } from './EvolutionUnlockedCard';

export interface CelebrationScreenProps {
  readonly progress: ProgressSnapshotSource;
  /** Raw route params from the Rating screen (#83 contract); parsed here, not in the route. */
  readonly routeParams: CelebrationRouteParams;
  readonly onOpenDish: (dishId: string) => void;
  readonly onOpenCollection: (view: CelebrationView['collectionView']) => void;
  readonly onGoToKitchen: () => void;
  readonly onGoToDiscover: () => void;
}

export interface CelebrationRouteParams {
  readonly dishId: string;
  readonly ratingId?: string;
  /** Comma-separated dish ids; empty when nothing was unlocked. */
  readonly evolutions?: string;
  /** Comma-separated badge ids. */
  readonly badges?: string;
  /** '1' on a repeat preparation. */
  readonly repeat?: string;
}

const EMPTY_SNAPSHOT = {
  catalog: { dishes: [], cuisines: [], badgeDefinitions: [] },
  ratings: [],
  unlocks: [],
  lastSyncAt: null,
} as const;

/**
 * Celebration after a rating (§9, #84): one screen with conditional blocks A–E. Everything comes
 * from the local copy, so it never shows a network state; the rating is already saved, so even a
 * failed read still offers the exits (no dead end).
 */
export function CelebrationScreen({
  progress,
  routeParams,
  onOpenDish,
  onOpenCollection,
  onGoToKitchen,
  onGoToDiscover,
}: CelebrationScreenProps) {
  const { dishId, ratingId, evolutions, badges, repeat } = routeParams;
  // Keyed on the primitive values so the snapshot is read once, not on every parent re-render.
  const params = useMemo(
    () => parseCelebrationParams({ dishId, ratingId, evolutions, badges, repeat }),
    [dishId, ratingId, evolutions, badges, repeat],
  );
  // Null while reading: the local read is instant, so a blank frame beats a skeleton flash.
  const [view, setView] = useState<CelebrationView | null>(null);

  useEffect(() => {
    let active = true;
    progress
      .load()
      .then((snapshot) => buildCelebration(snapshot, params))
      .catch(() => buildCelebration(EMPTY_SNAPSHOT, params))
      .then((next) => {
        if (active) setView(next);
      });
    return () => {
      active = false;
    };
  }, [progress, params]);

  // Android back never returns to the rating form that was already sent: it goes to the Kitchen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onGoToKitchen();
      return true;
    });
    return () => subscription.remove();
  }, [onGoToKitchen]);

  if (!view) return <SafeAreaView style={styles.screen} />;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ConfirmationBlock dishName={view.dishName} stars={view.stars} isRepeat={view.isRepeat} />
        {view.cuisine ? <CuisineProgressBlock cuisine={view.cuisine} /> : null}
        {view.evolutions.map((evolution) => (
          <EvolutionUnlockedCard
            key={evolution.dishId}
            dishId={evolution.dishId}
            name={evolution.name}
            onOpen={onOpenDish}
          />
        ))}
        {view.badges.length > 0 ? <BadgesEarnedBlock badges={view.badges} /> : null}
        {/* Block E (RN06): only once there is more than one preparation to speak of. */}
        {view.isRepeat && view.repeatCount > 1 ? (
          <Text style={styles.repeat}>{CELEBRATION_COPY.repeatCount(view.repeatCount)}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={CELEBRATION_COPY.seeCollection}
          size="lg"
          onPress={() => onOpenCollection(view.collectionView)}
        />
        <View style={styles.secondary}>
          <View style={styles.grow}>
            <Button
              label={CELEBRATION_COPY.backToKitchen}
              variant="secondary"
              onPress={onGoToKitchen}
            />
          </View>
          <TextLink label={CELEBRATION_COPY.discoverMore} onPress={onGoToDiscover} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.md },
  repeat: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  footer: { gap: spacing.sm, padding: spacing.md },
  secondary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
});
