import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, typography } from '../../../shared/theme';
import {
  ActionIconButton,
  AllergenScopeBanner,
  EmptyState,
  TextLink,
  Toast,
} from '../../../shared/ui';
import type {
  ActionOutcome,
  LoadOutcome,
  RoundSnapshot,
  SuggestionRound,
} from '../domain/suggestion-round';
import { DISCOVER_COPY } from './copy';
import { DiscoverSkeleton } from './DiscoverSkeleton';
import { SuggestionCard } from './SuggestionCard';

export interface DiscoverScreenProps {
  /** Session-wide round created once by the composition root (A8). */
  readonly round: SuggestionRound;
  readonly onOpenRecipe: (dishId: string) => void;
  readonly onGoToKitchen: () => void;
  readonly onGoToProfile: () => void;
}

type ViewState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly round: RoundSnapshot }
  | { readonly kind: 'offline' }
  | { readonly kind: 'failed' };

interface ToastState {
  readonly message: string;
  readonly withAction: boolean;
}

export const TOAST_DURATION_MS = 4000;

export function DiscoverScreen({
  round,
  onOpenRecipe,
  onGoToKitchen,
  onGoToProfile,
}: DiscoverScreenProps) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `busy` only disables the buttons on the next render; the ref blocks a second tap right away.
  const deciding = useRef(false);

  const load = useCallback(async () => {
    setView({ kind: 'loading' });
    let outcome: LoadOutcome;
    try {
      outcome = await round.loadSuggestions();
    } catch {
      // A local read failure must not leave the skeleton spinning forever (§1.5).
      outcome = { status: 'failed' };
    }
    if (outcome.status === 'ready') {
      const { status: _status, ...snapshot } = outcome;
      setView({ kind: 'ready', round: snapshot });
    } else {
      setView({ kind: outcome.status });
    }
  }, [round]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (next: ToastState) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  const decide = async (action: 'approve' | 'discard', suggestionId: string) => {
    if (deciding.current) return;
    deciding.current = true;
    setBusy(true);
    let outcome: ActionOutcome;
    try {
      outcome =
        action === 'approve'
          ? await round.approveSuggestion(suggestionId)
          : await round.discardSuggestion(suggestionId);
    } catch {
      outcome = 'failed';
    }
    deciding.current = false;
    setBusy(false);

    if (outcome === 'done') {
      setView({ kind: 'ready', round: round.snapshot() });
      if (action === 'approve') {
        showToast({ message: DISCOVER_COPY.approvedToast, withAction: true });
      }
      return;
    }
    // Stage 1 (ADR-008): nothing was saved, so the card stays exactly where it was.
    showToast({
      message: outcome === 'offline' ? DISCOVER_COPY.actionOffline : DISCOVER_COPY.actionFailed,
      withAction: false,
    });
  };

  const current = view.kind === 'ready' ? view.round.cards[0] : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {DISCOVER_COPY.title}
        </Text>
        {current && view.kind === 'ready' ? (
          <Text
            style={styles.position}
            accessibilityLabel={DISCOVER_COPY.positionA11y(view.round.position, view.round.total)}
          >
            {DISCOVER_COPY.position(view.round.position, view.round.total)}
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {view.kind === 'loading' ? <DiscoverSkeleton /> : null}

        {view.kind === 'ready' && view.round.hasRestrictions && current ? (
          <AllergenScopeBanner size="compact" />
        ) : null}

        {current ? (
          <SuggestionCard
            key={current.suggestionId}
            card={current}
            loadPhoto={round.photoUri}
            onOpen={onOpenRecipe}
          />
        ) : null}

        {view.kind === 'ready' && !current ? (
          <View>
            <EmptyState
              icon="dish-placeholder"
              title={DISCOVER_COPY.emptyTitle}
              message={DISCOVER_COPY.emptyMessage}
              actionLabel={DISCOVER_COPY.goToKitchen}
              onAction={onGoToKitchen}
            />
            <TextLink label={DISCOVER_COPY.adjustProfile} onPress={onGoToProfile} />
          </View>
        ) : null}

        {view.kind === 'offline' ? (
          <View>
            <EmptyState
              icon="offline"
              title={DISCOVER_COPY.offlineTitle}
              message={DISCOVER_COPY.offlineMessage}
              actionLabel={DISCOVER_COPY.retry}
              onAction={() => void load()}
            />
            <TextLink label={DISCOVER_COPY.goToKitchen} onPress={onGoToKitchen} />
          </View>
        ) : null}

        {view.kind === 'failed' ? (
          <EmptyState
            icon="alert-circle"
            title={DISCOVER_COPY.failedTitle}
            message={DISCOVER_COPY.failedMessage}
            actionLabel={DISCOVER_COPY.retry}
            onAction={() => void load()}
          />
        ) : null}
      </ScrollView>

      {/* Fixed footer: the buttons stay put whatever the card height, so decisions can be made
          in a row with the thumb in the same place (A03). */}
      {current ? (
        <View style={styles.actions}>
          <ActionIconButton
            icon="close"
            variant="secondary"
            accessibilityLabel={DISCOVER_COPY.discard}
            onPress={() => void decide('discard', current.suggestionId)}
            disabled={busy}
          />
          <ActionIconButton
            icon="heart"
            accessibilityLabel={DISCOVER_COPY.approve}
            onPress={() => void decide('approve', current.suggestionId)}
            disabled={busy}
          />
        </View>
      ) : null}

      {toast ? (
        <View style={[styles.toast, current ? styles.toastAboveActions : null]}>
          <Toast
            message={toast.message}
            actionLabel={toast.withAction ? DISCOVER_COPY.approvedToastAction : undefined}
            onAction={toast.withAction ? onGoToKitchen : undefined}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.textPrimary },
  position: { ...typography.caption, color: colors.textMuted },
  // Centered in the free space like the Figma frame, instead of leaving half the screen empty.
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  toast: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm },
  // Never cover the decision buttons: sit just above the footer (button + its vertical padding).
  toastAboveActions: { bottom: touchTarget.comfortable + spacing.md * 2 },
});
