import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../../shared/theme';
import { Button, Icon } from '../../../../shared/ui';
import { StepFrame } from './StepFrame';
import type { StepError } from './step-error';
import { StepErrorNotice } from './StepErrorNotice';

export interface WelcomeStepProps {
  readonly busy: boolean;
  readonly error: StepError | null;
  readonly onStart: () => void;
}

const LOGO_SIZE = 72;

export function WelcomeStep({ busy, error, onStart }: WelcomeStepProps) {
  return (
    <StepFrame
      step={1}
      footer={
        <>
          <Button
            label={error ? 'Tentar novamente' : 'Começar'}
            size="lg"
            onPress={onStart}
            loadingLabel={busy ? 'Preparando sua cozinha…' : undefined}
          />
          <Text style={styles.note}>Sem cadastro nem senha.</Text>
        </>
      }
    >
      <View style={styles.hero}>
        <Icon name="dish-placeholder" size={LOGO_SIZE} color={colors.primary} />
        <Text style={styles.brand}>PANELADA</Text>
        <Text style={styles.title} accessibilityRole="header">
          Cozinhe o mundo, um prato por vez
        </Text>
      </View>
      {error ? (
        <StepErrorNotice
          error={error}
          offlineMessage="Sem conexão. Precisamos de internet neste primeiro acesso."
        />
      ) : null}
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brand: { ...typography.overline, color: colors.primary },
  title: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  note: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
