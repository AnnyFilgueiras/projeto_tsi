import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { EmptyState, SegmentedControl } from '../../../../shared/ui';
import type { KitchenView, RecipeFeature } from '../../domain';
import { CandidateCard, type CookAttempt } from './CandidateCard';
import { CookingCard } from './CookingCard';
import { KITCHEN_COPY } from './copy';
import { KitchenSkeleton } from './KitchenSkeleton';

export interface KitchenScreenProps {
  readonly kitchen: Pick<RecipeFeature, 'loadKitchen' | 'startCooking'>;
  /**
   * Changes every time the tab gains focus (the route owns navigation): the lists are re-read so
   * a dish approved in Discover or started in the recipe shows up without a restart.
   */
  readonly refreshKey: number;
  readonly onOpenRecipe: (dishId: string) => void;
  readonly onFinish: (dishId: string) => void;
  readonly onGoToDiscover: () => void;
}

type Segment = 'cooking' | 'candidates';

type ViewState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly kitchen: KitchenView }
  | { readonly kind: 'failed' };

const SEGMENTS = [
  { key: 'cooking', label: KITCHEN_COPY.cookingSegment },
  { key: 'candidates', label: KITCHEN_COPY.candidatesSegment },
] as const;

export function KitchenScreen({
  kitchen,
  refreshKey,
  onOpenRecipe,
  onFinish,
  onGoToDiscover,
}: KitchenScreenProps) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  // null = not chosen yet: open on what is cooking, else on the candidates.
  const [segment, setSegment] = useState<Segment | null>(null);
  const [attempts, setAttempts] = useState<Readonly<Record<string, CookAttempt>>>({});
  // State only disables a button on the next render; the ref blocks a double tap right away.
  const cooking = useRef(new Set<string>());
  // Mount and focus both trigger a read; only the latest one may update the screen, otherwise a
  // slower older read could put stale lists back.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestLoad.current;
    let next: ViewState;
    try {
      next = { kind: 'ready', kitchen: await kitchen.loadKitchen() };
    } catch {
      // A local read failure must not leave the skeleton spinning forever (§1.5).
      next = { kind: 'failed' };
    }
    if (request === latestLoad.current) setView(next);
  }, [kitchen]);

  // Refocusing keeps the current list on screen while it is re-read, instead of a skeleton flash.
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const retry = () => {
    setView({ kind: 'loading' });
    void load();
  };

  const cook = async (dishId: string) => {
    if (cooking.current.has(dishId)) return;
    cooking.current.add(dishId);
    setAttempts((current) => ({ ...current, [dishId]: 'downloading' }));
    let attempt: CookAttempt | null;
    try {
      const result = await kitchen.startCooking(dishId);
      attempt =
        result.status === 'started' || result.status === 'already-cooking' ? null : result.status;
    } catch {
      attempt = 'failed';
    }
    cooking.current.delete(dishId);
    setAttempts(({ [dishId]: _previous, ...rest }) =>
      attempt ? { ...rest, [dishId]: attempt } : rest,
    );
    if (attempt) return;
    // Back from the recipe, the dish is under "Em preparo", where it now lives.
    setSegment('cooking');
    onOpenRecipe(dishId);
  };

  const data = view.kind === 'ready' ? view.kitchen : null;
  const isEmpty = data !== null && data.cooking.length === 0 && data.candidates.length === 0;
  const shown: Segment = segment ?? (data && data.cooking.length > 0 ? 'cooking' : 'candidates');

  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>
        {KITCHEN_COPY.title}
      </Text>

      <ScrollView contentContainerStyle={[styles.content, isEmpty && styles.centered]}>
        {view.kind === 'loading' ? <KitchenSkeleton /> : null}

        {view.kind === 'failed' ? (
          <EmptyState
            icon="alert-circle"
            title={KITCHEN_COPY.failedTitle}
            message={KITCHEN_COPY.failedMessage}
            actionLabel={KITCHEN_COPY.retry}
            onAction={retry}
          />
        ) : null}

        {isEmpty ? (
          <EmptyState
            title={KITCHEN_COPY.emptyTitle}
            message={KITCHEN_COPY.emptyMessage}
            actionLabel={KITCHEN_COPY.goToDiscover}
            onAction={onGoToDiscover}
          />
        ) : null}

        {data && !isEmpty ? (
          <>
            {/* No counters on the segments: RN12 forbids anything that reads as a backlog. */}
            <SegmentedControl
              options={SEGMENTS}
              selectedKey={shown}
              onChange={(key) => setSegment(key as Segment)}
              accessibilityLabel={KITCHEN_COPY.segments}
            />

            {shown === 'cooking' ? (
              data.cooking.length > 0 ? (
                data.cooking.map((dish) => (
                  <CookingCard
                    key={dish.dishId}
                    dish={dish}
                    onResume={onOpenRecipe}
                    onFinish={onFinish}
                  />
                ))
              ) : (
                <Text style={styles.segmentEmpty}>{KITCHEN_COPY.noCooking}</Text>
              )
            ) : data.candidates.length > 0 ? (
              data.candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.suggestionId}
                  candidate={candidate}
                  primary={index === 0 && data.cooking.length === 0}
                  attempt={attempts[candidate.dishId]}
                  onCook={(dishId) => void cook(dishId)}
                />
              ))
            ) : (
              <Text style={styles.segmentEmpty}>{KITCHEN_COPY.noCandidates}</Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  centered: { flexGrow: 1, justifyContent: 'center' },
  segmentEmpty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
