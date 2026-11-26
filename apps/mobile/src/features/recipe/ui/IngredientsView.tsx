import { StyleSheet, View } from 'react-native';
import { IngredientRow, SwapButton, spacing } from '../../../shared';
import type { Recipe, RecipeIngredient } from '../domain';

export interface IngredientsViewProps {
  readonly recipe: Recipe;
  readonly restrictedIngredientIds: readonly string[];
  readonly onOpenSwaps: (ingredientId: string) => void;
}

const quantityOf = (ingredient: RecipeIngredient) =>
  [ingredient.quantity, ingredient.unit].filter(Boolean).join(' ') || undefined;

export function IngredientsView({
  recipe,
  restrictedIngredientIds,
  onOpenSwaps,
}: IngredientsViewProps) {
  const restricted = new Set(restrictedIngredientIds);
  return (
    <View style={styles.list}>
      {recipe.ingredients.map((ingredient) => (
        <IngredientRow
          key={ingredient.ingredientId}
          name={ingredient.name}
          quantity={quantityOf(ingredient)}
          restricted={restricted.has(ingredient.ingredientId)}
          trailing={
            <SwapButton
              onPress={() => onOpenSwaps(ingredient.ingredientId)}
              accessibilityLabel={`Trocas para ${ingredient.name}`}
            />
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.md },
});
