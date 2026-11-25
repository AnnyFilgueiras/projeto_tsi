import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { EmptyState, SegmentedControl, TextLink } from '../../../../shared/ui';
import type { HistoryEntry, ProgressModel, ProgressModelSource } from '../../domain/progress-model';
import { BadgesView } from './BadgesView';
import { CollectionSkeleton } from './CollectionSkeleton';
import type { CollectionView } from './collection-view';
import { COLLECTION_COPY } from './copy';
import { CuisinesView } from './CuisinesView';
import { EvolutionsView } from './EvolutionsView';
import { HistoryEntrySheet } from './HistoryEntrySheet';
import { HistoryView } from './HistoryView';

export interface CollectionScreenProps {
  /** Offline read model only (RNF09): the tab never touches the network. */
  readonly progress: ProgressModelSource;
  /** Changes every time the tab gains focus, so a rating made elsewhere shows up on return. */
  readonly refreshKey: number;
  /** Owned by the route (`?view=`), so the Celebration can open a sub-view directly. */
  readonly view: CollectionView;
  readonly onChangeView: (view: CollectionView) => void;
  readonly onOpenRecipe: (dishId: string) => void;
  readonly onGoToDiscover: () => void;
  readonly onGoToKitchen: () => void;
}

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly model: ProgressModel }
  | { readonly kind: 'failed' };

// No counters on the segments: RN12 forbids anything that reads as a backlog.
const SEGMENTS = [
  { key: 'cuisines', label: COLLECTION_COPY.cuisinesSegment },
  { key: 'evolutions', label: COLLECTION_COPY.evolutionsSegment },
  { key: 'badges', label: COLLECTION_COPY.badgesSegment },
  { key: 'history', label: COLLECTION_COPY.historySegment },
] as const;

export function CollectionScreen({
  progress,
  refreshKey,
  view,
  onChangeView,
  onOpenRecipe,
  onGoToDiscover,
  onGoToKitchen,
}: CollectionScreenProps) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [openEntry, setOpenEntry] = useState<HistoryEntry | null>(null);
  // Mount and focus both trigger a read; only the latest may update the screen.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestLoad.current;
    let next: LoadState;
    try {
      next = { kind: 'ready', model: await progress.loadProgress() };
    } catch {
      // A local read failure must not leave the skeleton on screen forever (§1.5).
      next = { kind: 'failed' };
    }
    if (request === latestLoad.current) setState(next);
  }, [progress]);

  // Refocusing keeps the current content while it is re-read instead of flashing the skeleton.
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const retry = () => {
    setState({ kind: 'loading' });
    void load();
  };

  const model = state.kind === 'ready' ? state.model : null;
  // A rating is what starts a collection; a record of a dish that left the catalog still counts.
  const isEmpty = model !== null && model.history.length === 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {COLLECTION_COPY.title}
        </Text>
        {/* Zeros are noise: the summary only appears once there is something to sum up. */}
        {model && !isEmpty ? (
          <Text style={styles.summary}>
            {COLLECTION_COPY.summary(
              model.summary.completedDishes,
              model.summary.cuisinesStarted,
              model.summary.continentsReached,
              model.summary.totalContinents,
            )}
          </Text>
        ) : null}
      </View>

      {/* Fixed above the list so a long history or badge list never hides the sub-views. */}
      <View style={styles.segments}>
        <SegmentedControl
          options={SEGMENTS}
          selectedKey={view}
          onChange={(key) => onChangeView(key as CollectionView)}
          accessibilityLabel={COLLECTION_COPY.segments}
        />
      </View>

      {/* Keyed by view: each sub-view opens at its top, not at the previous one's offset. */}
      <ScrollView key={view} contentContainerStyle={styles.content}>
        {state.kind === 'loading' ? <CollectionSkeleton /> : null}

        {state.kind === 'failed' ? (
          <EmptyState
            icon="alert-circle"
            title={COLLECTION_COPY.failedTitle}
            message={COLLECTION_COPY.failedMessage}
            actionLabel={COLLECTION_COPY.retry}
            onAction={retry}
          />
        ) : null}

        {/* RN04: badge criteria stay visible even before the first dish. */}
        {isEmpty && view !== 'badges' ? (
          <View style={styles.empty}>
            <EmptyState
              icon="tab-collection"
              title={COLLECTION_COPY.emptyTitle}
              message=""
              actionLabel={COLLECTION_COPY.goToDiscover}
              onAction={onGoToDiscover}
            />
            <TextLink label={COLLECTION_COPY.goToKitchen} onPress={onGoToKitchen} />
          </View>
        ) : null}

        {model && (!isEmpty || view === 'badges') ? (
          <>
            {view === 'cuisines' ? <CuisinesView cuisines={model.cuisines} /> : null}
            {view === 'evolutions' ? (
              <EvolutionsView chains={model.evolutionChains} onOpenRecipe={onOpenRecipe} />
            ) : null}
            {view === 'badges' ? <BadgesView badges={model.badges} /> : null}
            {view === 'history' ? (
              <HistoryView history={model.history} onOpenEntry={setOpenEntry} />
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <HistoryEntrySheet
        entry={openEntry}
        onClose={() => setOpenEntry(null)}
        onOpenRecipe={onOpenRecipe}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.textPrimary },
  summary: { ...typography.caption, color: colors.textSecondary },
  segments: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  content: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.lg },
});
