import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../../shared/theme';
import {
  AllergenSeal,
  Button,
  DishThumb,
  FailClosedAlert,
  ProgressBar,
  TextLink,
} from '../../../../shared/ui';
import type { CookingDish } from '../../domain';
import { KITCHEN_COPY } from './copy';

export interface CookingCardProps {
  readonly dish: CookingDish;
  readonly onResume: (dishId: string) => void;
  readonly onFinish: (dishId: string) => void;
}

export function CookingCard({ dish, onResume, onFinish }: CookingCardProps) {
  // Saved step is 0-based; people count from 1.
  const step = Math.min(dish.currentStep + 1, dish.stepCount);
  return (
    <View style={styles.card} testID={`cooking-card-${dish.dishId}`}>
      <View style={styles.row}>
        <DishThumb image={dish.photoUri ? { uri: dish.photoUri } : undefined} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {dish.name}
          </Text>
          <Text style={styles.meta}>{KITCHEN_COPY.step(step, dish.stepCount)}</Text>
          <ProgressBar
            value={dish.stepCount > 0 ? step / dish.stepCount : 0}
            accessibilityLabel={KITCHEN_COPY.progressA11y(dish.name, step, dish.stepCount)}
          />
          <AllergenSeal state={dish.allergenState} />
        </View>
      </View>

      {dish.alert ? (
        <FailClosedAlert
          size="compact"
          reasons={dish.alert.reasons}
          matchedAllergens={dish.alert.matchedAllergens}
        />
      ) : null}

      <View style={styles.actions}>
        <View style={styles.primary}>
          <Button label={KITCHEN_COPY.resume} onPress={() => onResume(dish.dishId)} />
        </View>
        <TextLink label={KITCHEN_COPY.finish} onPress={() => onFinish(dish.dishId)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  info: { flex: 1, gap: spacing.xs },
  name: { ...typography.subtitle, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  primary: { flex: 1 },
});
