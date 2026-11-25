import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../../../../shared/theme';
import { Icon, ProgressBar } from '../../../../shared/ui';
import type { CuisineCollection, CuisineDish } from '../../domain/progress-model';
import { COLLECTION_COPY } from './copy';

export interface CuisinesViewProps {
  readonly cuisines: readonly CuisineCollection[];
}

const TILE_SIZE = 64;

/** US14 / RN07: one card per cuisine; tapping it expands the dish grid. */
export function CuisinesView({ cuisines }: CuisinesViewProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const toggle = (cuisineId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(cuisineId)) next.add(cuisineId);
      return next;
    });

  return (
    <View style={styles.list}>
      {cuisines.map((cuisine) => (
        <CuisineCard
          key={cuisine.cuisineId}
          cuisine={cuisine}
          expanded={expanded.has(cuisine.cuisineId)}
          onToggle={() => toggle(cuisine.cuisineId)}
        />
      ))}
    </View>
  );
}

function CuisineCard({
  cuisine,
  expanded,
  onToggle,
}: {
  cuisine: CuisineCollection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const label = COLLECTION_COPY.cuisineA11y(
    cuisine.name,
    cuisine.completedDishes,
    cuisine.totalDishes,
    cuisine.missingDishes,
  );
  return (
    <View style={styles.card} testID={`cuisine-${cuisine.cuisineId}`}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={expanded ? COLLECTION_COPY.collapse : COLLECTION_COPY.expand}
        accessibilityState={{ expanded }}
        style={styles.header}
      >
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {cuisine.name}
          </Text>
          <Text style={styles.meta}>
            {cuisine.missingDishes === 0
              ? COLLECTION_COPY.complete
              : COLLECTION_COPY.missing(cuisine.missingDishes)}
          </Text>
          {/* `back` is the only chevron glyph: turned down when closed, up when open. */}
          <View style={expanded ? styles.chevronUp : styles.chevronDown}>
            <Icon name="back" size={16} color={colors.textSecondary} />
          </View>
        </View>
        <ProgressBar value={cuisine.percent / 100} accessibilityLabel={label} />
      </Pressable>

      {expanded ? (
        <View style={styles.grid}>
          {cuisine.dishes.map((dish) => (
            <DishTile key={dish.dishId} dish={dish} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// Tiles do not navigate: opening a recipe that was never downloaded belongs to the Kitchen flow.
function DishTile({ dish }: { dish: CuisineDish }) {
  const done = dish.completed && dish.stars !== null;
  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={
        done
          ? COLLECTION_COPY.dishDoneA11y(dish.name, dish.stars ?? 0)
          : COLLECTION_COPY.dishPendingA11y(dish.name)
      }
      testID={`dish-tile-${dish.dishId}`}
    >
      <View style={[styles.art, done ? styles.artDone : styles.artPending]}>
        <Icon
          name="dish-placeholder"
          size={28}
          color={done ? colors.primary : colors.textSecondary}
        />
        {done ? (
          <View style={styles.check}>
            <Icon name="check" size={12} color={colors.onPrimary} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.dishName, !done && styles.pendingName]} numberOfLines={2}>
        {dish.name}
      </Text>
      {done ? (
        <View style={styles.score}>
          <Icon name="star" size={12} color={colors.primary} />
          <Text style={styles.scoreText}>{COLLECTION_COPY.stars(dish.stars ?? 0)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  header: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.subtitle, color: colors.textPrimary, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
  chevronDown: { transform: [{ rotate: '-90deg' }] },
  chevronUp: { transform: [{ rotate: '90deg' }] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { width: TILE_SIZE, gap: spacing.xs },
  art: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  artDone: { backgroundColor: colors.primarySoft },
  artPending: { backgroundColor: colors.surfaceAlt },
  check: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    padding: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  dishName: { ...typography.overline, color: colors.textPrimary },
  pendingName: { color: colors.textSecondary, fontWeight: typography.caption.fontWeight },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  scoreText: { ...typography.overline, color: colors.textSecondary },
});
