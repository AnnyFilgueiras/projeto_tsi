import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { Button, Chip } from '../../../../shared/ui';
import type { CuisineOption } from '../../domain/save-culinary-preferences';
import { StepFrame } from './StepFrame';
import type { StepError } from './step-error';
import { StepErrorNotice } from './StepErrorNotice';

export interface PreferencesStepProps {
  /** `null` while the local catalog is being read. */
  readonly cuisines: readonly CuisineOption[] | null;
  readonly chosen: readonly string[];
  readonly busy: boolean;
  readonly error: StepError | null;
  readonly onToggle: (cuisineId: string) => void;
  readonly onConfirm: () => void;
  readonly onSkip: () => void;
  readonly onBack: () => void;
}

export function PreferencesStep(props: PreferencesStepProps) {
  const { cuisines, chosen, busy, error } = props;
  const noCatalog = cuisines !== null && cuisines.length === 0;

  return (
    <StepFrame
      step={3}
      onBack={busy ? undefined : props.onBack}
      footer={
        noCatalog ? (
          <Button label="Continuar" size="lg" onPress={props.onSkip} />
        ) : (
          <>
            <Button
              label={error ? 'Tentar novamente' : 'Ver sugestões'}
              size="lg"
              onPress={props.onConfirm}
              disabled={cuisines === null}
              loadingLabel={busy ? 'Salvando…' : undefined}
            />
            <Button label="Pular" variant="ghost" onPress={props.onSkip} disabled={busy} />
          </>
        )
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        Quais cozinhas você quer explorar?
      </Text>
      {noCatalog ? (
        <Text style={styles.hint}>Você pode escolher depois no Perfil.</Text>
      ) : (
        <View style={styles.chips}>
          {(cuisines ?? []).map((cuisine) => (
            <Chip
              key={cuisine.id}
              label={cuisine.name}
              selected={chosen.includes(cuisine.id)}
              onPress={() => props.onToggle(cuisine.id)}
              disabled={busy}
            />
          ))}
        </View>
      )}
      {error ? (
        <StepErrorNotice
          error={error}
          offlineMessage="Sem conexão. Suas escolhas continuam aqui."
        />
      ) : null}
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.textPrimary },
  hint: { ...typography.body, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
