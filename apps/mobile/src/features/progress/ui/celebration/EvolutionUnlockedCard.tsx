import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../../shared/theme';
import { Button, Icon } from '../../../../shared/ui';
import { CELEBRATION_COPY } from './copy';

export interface EvolutionUnlockedCardProps {
  readonly dishId: string;
  readonly name: string;
  readonly onOpen: (dishId: string) => void;
}

/** Block C (RN02). No thumbnail: the catalog index carries no dish photo. */
export function EvolutionUnlockedCard({ dishId, name, onOpen }: EvolutionUnlockedCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.label}>
        <Icon name="unlock" size={16} color={colors.successUnlock} />
        <Text style={styles.labelText}>{CELEBRATION_COPY.evolutionLabel}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Button label={CELEBRATION_COPY.meet} variant="unlock" onPress={() => onOpen(dishId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successUnlockSoft,
    ...elevation.card,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  labelText: { ...typography.overline, color: colors.successUnlock },
  name: { ...typography.subtitle, color: colors.textPrimary },
});
