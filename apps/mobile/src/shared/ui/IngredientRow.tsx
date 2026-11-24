import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { AllergenTag } from './allergen/AllergenTag';

export interface IngredientRowProps {
  readonly name: string;
  readonly quantity?: string;
  /** The ingredient carries an allergen from the user's profile (§1.4c). */
  readonly restricted?: boolean;
  /** Right slot: usually a `SwapButton`; an `AllergenSeal` inside the swaps sheet. */
  readonly trailing?: ReactNode;
}

export function IngredientRow({
  name,
  quantity,
  restricted = false,
  trailing,
}: IngredientRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={[styles.name, restricted && styles.restrictedName]}>{name}</Text>
        {quantity ? <Text style={styles.quantity}>{quantity}</Text> : null}
        {restricted ? <AllergenTag /> : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: spacing.xxs },
  name: { ...typography.body, color: colors.textPrimary },
  restrictedName: { color: colors.allergenDanger, fontWeight: typography.button.fontWeight },
  quantity: { ...typography.caption, color: colors.textMuted },
});
