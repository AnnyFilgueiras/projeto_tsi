import { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  EmptyState,
  FailClosedAlert,
  Icon,
  Notice,
  Pill,
  SegmentedControl,
  Skeleton,
  TextLink,
  Topbar,
  colors,
  radius,
  spacing,
  typography,
  useReducedMotion,
} from '../../../shared';
import { listSafeSubstitutes, type RecipeFeature, type RecipeView } from '../domain';
import { AllergenStateSheet } from './AllergenStateSheet';
import { IngredientsView } from './IngredientsView';
import { RecipeHeader } from './RecipeHeader';
import { StepsView } from './StepsView';
import { SubstitutionsSheet } from './SubstitutionsSheet';

export interface RecipeScreenProps {
  readonly dishId: string;
  readonly recipes: Pick<RecipeFeature, 'loadRecipe' | 'startCooking' | 'saveStep'>;
  readonly onBack: () => void;
  /** Opens another recipe (the base dish of a locked evolution, RN02). */
  readonly onOpenDish: (dishId: string) => void;
  readonly onRate: () => void;
}

type Tab = 'ingredients' | 'steps';
type Sheet = { readonly kind: 'swaps'; readonly ingredientId: string } | { readonly kind: 'seal' };
type Loaded = Extract<RecipeView, { status: 'downloaded' | 'remote' }>;

const TABS = [
  { key: 'ingredients', label: 'Ingredientes' },
  { key: 'steps', label: 'Passo a passo' },
] as const;

const RATE_LABEL = 'Concluir e avaliar prato';

/**
 * Offline recipe (§7, UX-01D). The current step lives here, not in the tabs, so switching
 * Ingredientes ↔ Passo a passo keeps it; every move is persisted so reopening resumes there.
 */
export function RecipeScreen({ dishId, recipes, onBack, onOpenDish, onRate }: RecipeScreenProps) {
  const [view, setView] = useState<RecipeView | null>(null);
  const [tab, setTab] = useState<Tab>('ingredients');
  const [step, setStep] = useState<number | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [starting, setStarting] = useState(false);
  const [startProblem, setStartProblem] = useState<'offline' | 'error' | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const scroll = useRef<ScrollView>(null);
  const stepsTop = useRef(0);
  const stepOffsets = useRef(new Map<number, number>());
  const reducedMotion = useReducedMotion();

  const showLoaded = useCallback((next: RecipeView) => {
    setView(next);
    if (next.status === 'downloaded' && next.currentStep !== null) {
      // A refreshed copy may have fewer steps than when the step was saved.
      setStep(Math.min(next.currentStep, Math.max(0, next.recipe.steps.length - 1)));
      setTab('steps');
    }
  }, []);

  const load = useCallback(async () => {
    setView(null);
    setLoadFailed(false);
    try {
      showLoaded(await recipes.loadRecipe(dishId));
    } catch {
      // Offline and 404 come back as views; anything else (no session, server error) lands here.
      setLoadFailed(true);
    }
  }, [dishId, recipes, showLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  const scrollToStep = useCallback(
    (index: number) => {
      const y = stepOffsets.current.get(index);
      if (y === undefined) return;
      scroll.current?.scrollTo({
        y: Math.max(0, stepsTop.current + y - spacing.md),
        animated: !reducedMotion,
      });
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (tab === 'steps' && step !== null) scrollToStep(step);
  }, [tab, step, scrollToStep]);

  const goToStep = (index: number) => {
    setStep(index);
    void recipes.saveStep(dishId, index);
  };

  const startCooking = async () => {
    setStarting(true);
    setStartProblem(null);
    try {
      const result = await recipes.startCooking(dishId);
      if (result.status === 'offline') {
        setStartProblem('offline');
        return;
      }
      if (result.status === 'not-found') {
        setView({ status: 'not-found' });
        return;
      }
      const next = await recipes.loadRecipe(dishId);
      showLoaded(
        next.status === 'downloaded' ? { ...next, currentStep: next.currentStep ?? 0 } : next,
      );
    } catch {
      setStartProblem('error');
    } finally {
      setStarting(false);
    }
  };

  if (loadFailed) {
    return (
      <SafeAreaView style={styles.screen}>
        <Topbar title="Receita" leading="back" onLeadingPress={onBack} />
        <View style={styles.padded}>
          <Notice
            type="error"
            title="Não foi possível abrir a receita."
            message="Tente de novo em instantes."
            onRetry={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (view === null) return <LoadingState onBack={onBack} />;

  if (view.status === 'offline') {
    return (
      <SafeAreaView style={styles.screen}>
        <Topbar title="Receita" leading="back" onLeadingPress={onBack} />
        <View style={styles.padded}>
          <Notice
            type="offline"
            title="Sem conexão agora."
            message="Tente de novo quando a conexão voltar."
            onRetry={() => void load()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (view.status === 'not-found') {
    return (
      <SafeAreaView style={styles.screen}>
        <Topbar title="Receita" leading="back" onLeadingPress={onBack} />
        <EmptyState
          title="Receita não encontrada"
          message="Este prato não está mais no catálogo."
          actionLabel="Voltar"
          onAction={onBack}
        />
      </SafeAreaView>
    );
  }

  const { recipe, safety, evolution } = view;
  const downloaded = view.status === 'downloaded';
  const cooking = downloaded && step !== null;
  const lastStep = recipe.steps.length - 1;
  const showSteps = downloaded && tab === 'steps';
  const baseDishId = evolution.baseDish?.id;
  const baseName = evolution.baseDish?.name ?? 'o prato base';
  const swapsIngredient =
    sheet?.kind === 'swaps'
      ? recipe.ingredients.find((item) => item.ingredientId === sheet.ingredientId)
      : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <Topbar
        title={recipe.name}
        leading="back"
        onLeadingPress={onBack}
        trailing={downloaded ? <Pill type="offline" label="Offline" /> : undefined}
      />

      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        {evolution.locked && baseDishId ? (
          <View style={styles.locked} testID="evolution-locked">
            <View style={styles.lockedRow}>
              <Icon name="lock" size={20} color={colors.successUnlock} />
              <Text style={styles.lockedText}>
                {`Evolução bloqueada — conclua ${baseName} para abrir`}
              </Text>
            </View>
            <TextLink
              label={`Abrir ${baseName}`}
              tone="unlock"
              onPress={() => onOpenDish(baseDishId)}
            />
          </View>
        ) : null}

        {/* §1.4c: never compacted, collapsed or dismissible at the top. */}
        {safety.showAlert ? (
          <View style={styles.padded}>
            <FailClosedAlert reasons={safety.reasons} matchedAllergens={safety.matchedAllergens} />
          </View>
        ) : null}

        <RecipeHeader
          recipe={recipe}
          safety={safety}
          cuisineName={view.cuisineName}
          photoUri={downloaded ? view.photoUri : null}
          downloadedAt={downloaded ? view.downloadedAt : null}
          onSealPress={() => setSheet({ kind: 'seal' })}
          compact={showSteps}
        />

        {downloaded ? (
          <View style={styles.padded}>
            <SegmentedControl
              options={TABS}
              selectedKey={tab}
              onChange={(key) => setTab(key as Tab)}
              accessibilityLabel="Conteúdo da receita"
            />
          </View>
        ) : null}

        {showSteps ? (
          <View onLayout={(event) => (stepsTop.current = event.nativeEvent.layout.y)}>
            <StepsView
              steps={recipe.steps}
              currentStep={step}
              onSelectStep={goToStep}
              onStepLayout={(index, y) => stepOffsets.current.set(index, y)}
            />
          </View>
        ) : (
          <IngredientsView
            recipe={recipe}
            restrictedIngredientIds={safety.restrictedIngredientIds}
            onOpenSwaps={(ingredientId) => setSheet({ kind: 'swaps', ingredientId })}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Repeated right above the completion action so it is seen before rating (§1.4c). */}
        {safety.showAlert ? (
          <FailClosedAlert
            reasons={safety.reasons}
            matchedAllergens={safety.matchedAllergens}
            size="compact"
          />
        ) : null}
        <Footer
          view={view}
          cooking={cooking}
          showSteps={showSteps}
          step={step}
          lastStep={lastStep}
          baseName={baseName}
          starting={starting}
          startProblem={startProblem}
          onStart={() => void startCooking()}
          onStep={goToStep}
          onRate={onRate}
        />
      </View>

      {sheet?.kind === 'seal' ? (
        <AllergenStateSheet state={safety.allergenState} onClose={() => setSheet(null)} />
      ) : null}
      {swapsIngredient ? (
        <SubstitutionsSheet
          ingredientName={swapsIngredient.name}
          substitutes={listSafeSubstitutes(recipe, swapsIngredient.ingredientId, view.restrictions)}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

interface FooterProps {
  readonly view: Loaded;
  readonly cooking: boolean;
  readonly showSteps: boolean;
  readonly step: number | null;
  readonly lastStep: number;
  readonly baseName: string;
  readonly starting: boolean;
  readonly startProblem: 'offline' | 'error' | null;
  readonly onStart: () => void;
  readonly onStep: (index: number) => void;
  readonly onRate: () => void;
}

function Footer(props: FooterProps) {
  const { view, cooking, showSteps, step, lastStep, starting, startProblem } = props;

  // RN02: a locked evolution can be read, never cooked or rated.
  if (view.evolution.locked) {
    return (
      <>
        <Button
          label={view.status === 'remote' ? 'Cozinhar agora' : 'Iniciar passo a passo'}
          size="lg"
          disabled
          onPress={props.onStart}
        />
        <Button label="Avaliar prato" variant="secondary" disabled onPress={props.onRate} />
        <Text style={styles.caption}>{`Conclua ${props.baseName} para liberar`}</Text>
      </>
    );
  }

  if (!cooking) {
    return (
      <>
        {startProblem === 'offline' ? (
          <Notice
            type="offline"
            title="Sem conexão agora."
            message="Para baixar a receita, precisamos de internet."
            onRetry={props.onStart}
          />
        ) : null}
        {startProblem === 'error' ? (
          <Notice
            type="error"
            title="Não foi possível baixar a receita."
            message="Tente de novo em instantes."
            onRetry={props.onStart}
          />
        ) : null}
        <Button
          label={view.status === 'remote' ? 'Cozinhar agora' : 'Iniciar passo a passo'}
          size="lg"
          onPress={props.onStart}
          loadingLabel={starting ? 'Baixando…' : undefined}
          testID="start-cooking"
        />
      </>
    );
  }

  if (!showSteps || step === null) {
    return <TextLink label={RATE_LABEL} onPress={props.onRate} testID="rate-link" />;
  }

  const last = step >= lastStep;
  return (
    <>
      <View style={styles.stepNav}>
        <View style={styles.half}>
          <Button
            label="‹ Anterior"
            variant="secondary"
            size="lg"
            disabled={step === 0}
            onPress={() => props.onStep(step - 1)}
            testID="previous-step"
          />
        </View>
        <View style={styles.half}>
          {/* §7.7: on the last step "Próximo" becomes the completion action. */}
          {last ? (
            <Button label={RATE_LABEL} size="lg" onPress={props.onRate} testID="finish-and-rate" />
          ) : (
            <Button
              label="Próximo ›"
              size="lg"
              onPress={() => props.onStep(step + 1)}
              testID="next-step"
            />
          )}
        </View>
      </View>
      {last ? null : <TextLink label={RATE_LABEL} onPress={props.onRate} testID="rate-link" />}
    </>
  );
}

function LoadingState({ onBack }: { readonly onBack: () => void }) {
  return (
    <SafeAreaView style={styles.screen} accessibilityLabel="Carregando receita" accessible>
      <Topbar title="" leading="back" onLeadingPress={onBack} />
      <Skeleton height={270} radius="sm" />
      <View style={[styles.padded, styles.skeletonLines]}>
        <Skeleton height={20} width="60%" />
        {[0, 1, 2, 3].map((line) => (
          <Skeleton key={line} height={48} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  padded: { paddingHorizontal: spacing.md },
  locked: {
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md - spacing.xs,
    paddingTop: spacing.md - spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.successUnlockSoft,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockedText: { ...typography.caption, flex: 1, color: colors.successUnlock, fontWeight: '600' },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  stepNav: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  caption: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  skeletonLines: { gap: spacing.sm, paddingTop: spacing.md },
});
