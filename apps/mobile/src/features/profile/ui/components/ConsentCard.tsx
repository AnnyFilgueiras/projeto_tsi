import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { Checkbox, Icon } from '../../../../shared/ui';

export interface ConsentCardProps {
  readonly accepted: boolean;
  readonly onChange: (accepted: boolean) => void;
  /** Set after a save attempt without consent. */
  readonly invalid: boolean;
}

/**
 * Explicit LGPD consent for sensitive health data (RN09, A05). The text keeps only what the law
 * needs the user to know before agreeing: purpose, protection and how to revoke.
 * Shared by onboarding and the Profile (#78).
 */
export function ConsentCard({ accepted, onChange, invalid }: ConsentCardProps) {
  return (
    <View style={[styles.card, invalid ? styles.invalid : styles.idle]} testID="consent-card">
      <View style={styles.info}>
        <Icon name="lock" size={20} color={colors.allergenWarning} />
        <Text style={styles.text}>
          Dado de saúde: usamos só para filtrar sugestões, fica cifrado e você pode remover no
          Perfil.
        </Text>
      </View>
      <Checkbox
        label="Concordo com o uso das minhas restrições"
        checked={accepted}
        onChange={onChange}
      />
      {invalid ? (
        <Text style={styles.error} accessibilityRole="alert">
          Marque o consentimento para salvar.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  idle: { borderColor: colors.allergenWarning },
  invalid: { borderColor: colors.allergenDanger },
  info: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  text: { ...typography.caption, flex: 1, color: colors.textPrimary },
  error: {
    ...typography.caption,
    color: colors.allergenDanger,
    fontWeight: typography.button.fontWeight,
  },
});
