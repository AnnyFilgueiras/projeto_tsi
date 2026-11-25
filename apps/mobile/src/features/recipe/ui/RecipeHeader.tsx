import type { AllergenCode } from '@panelada/allergen-rules/rules';
import { Linking, StyleSheet, Text, View } from 'react-native';
import {
  AllergenScopeBanner,
  AllergenSeal,
  DishThumb,
  Icon,
  LastSync,
  TextLink,
  allergenLabel,
  colors,
  spacing,
  typography,
} from '../../../shared';
import type { Difficulty, Recipe, RecipeSafety } from '../domain';

const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
};

export interface RecipeHeaderProps {
  readonly recipe: Recipe;
  readonly safety: RecipeSafety;
  readonly cuisineName: string | null;
  /** Local photo; null draws the vector placeholder (not downloaded or photo skipped). */
  readonly photoUri: string | null;
  /** `recipes_local.downloaded_at`; shown once, only in the full header (D6). */
  readonly downloadedAt: Date | null;
  readonly onSealPress: () => void;
  /** Step-by-step mode: no photo, source or details, RN16 banner on one line (§7.3). */
  readonly compact?: boolean;
}

function allergenSummary(recipe: Recipe): string | null {
  if (recipe.allergens.length > 0) {
    const names = recipe.allergens.map((code: AllergenCode) => {
      const label = allergenLabel(code);
      return label.charAt(0).toLowerCase() + label.slice(1);
    });
    return `Contém: ${names.join(', ')}`;
  }
  return recipe.confirmedAllergenFree ? 'Sem alérgenos, segundo a curadoria' : null;
}

function Meta({
  recipe,
  cuisineName,
  withDifficulty,
}: {
  recipe: Recipe;
  cuisineName: string | null;
  withDifficulty: boolean;
}) {
  return (
    <View style={styles.meta}>
      {cuisineName ? <Text style={styles.metaText}>{cuisineName}</Text> : null}
      <View style={styles.metaItem}>
        <Icon name="clock" size={16} color={colors.textSecondary} />
        <Text style={styles.metaText}>{`${recipe.prepTimeMinutes} min`}</Text>
      </View>
      {withDifficulty ? (
        <Text style={styles.metaText}>{DIFFICULTY_LABELS[recipe.difficulty]}</Text>
      ) : null}
    </View>
  );
}

export function RecipeHeader({
  recipe,
  safety,
  cuisineName,
  photoUri,
  downloadedAt,
  onSealPress,
  compact = false,
}: RecipeHeaderProps) {
  if (compact) {
    return (
      <View style={styles.compact} testID="recipe-header-compact">
        <View style={styles.row}>
          <AllergenSeal state={safety.allergenState} onPress={onSealPress} />
          <Meta recipe={recipe} cuisineName={cuisineName} withDifficulty={false} />
        </View>
        {safety.hasRestrictions ? <AllergenScopeBanner size="compact" /> : null}
      </View>
    );
  }

  const allergens = allergenSummary(recipe);
  return (
    <View testID="recipe-header">
      <DishThumb
        variant="cover"
        image={photoUri ? { uri: photoUri } : undefined}
        accessibilityLabel={`Foto: ${recipe.name}`}
      />
      <View style={styles.details}>
        <Meta recipe={recipe} cuisineName={cuisineName} withDifficulty />
        <AllergenSeal state={safety.allergenState} onPress={onSealPress} />
        {allergens ? <Text style={styles.secondary}>{allergens}</Text> : null}
        {/* RN17: the source is always credited, with a link to the original. */}
        <View style={styles.source}>
          <Text style={styles.secondary}>Receita adaptada de</Text>
          <TextLink
            label={recipe.sourceName}
            onPress={() => void Linking.openURL(recipe.sourceUrl)}
          />
        </View>
        {downloadedAt ? <LastSync syncedAt={downloadedAt} /> : null}
        {safety.hasRestrictions ? <AllergenScopeBanner /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { gap: spacing.sm, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  details: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md - spacing.xs },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md - spacing.xs,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.caption, color: colors.textSecondary },
  secondary: { ...typography.caption, color: colors.textSecondary },
  source: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.xs },
});
