import type { AllergenCode } from '@panelada/allergen-rules/rules';
import { useEffect, useRef, useState } from 'react';
import { type ScrollView, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../../../shared/theme';
import { Button } from '../../../../shared/ui';
import { AllergenPicker } from '../components/AllergenPicker';
import { ConsentCard } from '../components/ConsentCard';
import { StepFrame } from './StepFrame';
import type { StepError } from './step-error';
import { StepErrorNotice } from './StepErrorNotice';

export interface RestrictionsStepProps {
  readonly picked: readonly AllergenCode[];
  readonly consent: boolean;
  readonly consentInvalid: boolean;
  readonly busy: boolean;
  readonly error: StepError | null;
  readonly onToggle: (code: AllergenCode) => void;
  readonly onConsentChange: (accepted: boolean) => void;
  readonly onNone: () => void;
  readonly onSave: () => void;
  readonly onBack: () => void;
}

export function RestrictionsStep(props: RestrictionsStepProps) {
  const { picked, busy, error } = props;
  const hasPicks = picked.length > 0;
  const scrollRef = useRef<ScrollView>(null);
  const [attempts, setAttempts] = useState(0);

  // The consent card and the error notice sit below a long chip list: after a failed save, scroll
  // them into view so the button never looks like it did nothing.
  const { consentInvalid } = props;
  useEffect(() => {
    if (consentInvalid || error) scrollRef.current?.scrollToEnd({ animated: true });
  }, [attempts, consentInvalid, error]);

  function save() {
    setAttempts((count) => count + 1);
    props.onSave();
  }

  return (
    <StepFrame
      step={2}
      scrollRef={scrollRef}
      onBack={busy ? undefined : props.onBack}
      footer={
        hasPicks ? (
          <Button
            label={error ? 'Tentar novamente' : 'Salvar e continuar'}
            size="lg"
            onPress={save}
            loadingLabel={busy ? 'Salvando…' : undefined}
          />
        ) : undefined
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        Alguma restrição alimentar?
      </Text>
      <Button
        label="Não tenho restrições"
        variant="secondary"
        size="lg"
        onPress={props.onNone}
        disabled={busy}
      />
      <AllergenPicker selected={picked} onToggle={props.onToggle} />
      {hasPicks ? (
        <ConsentCard
          accepted={props.consent}
          onChange={props.onConsentChange}
          invalid={props.consentInvalid}
        />
      ) : null}
      {error ? (
        <StepErrorNotice error={error} offlineMessage="Sem conexão. Sua seleção continua aqui." />
      ) : null}
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.textPrimary },
});
