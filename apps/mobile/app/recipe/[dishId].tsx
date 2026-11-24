import { useLocalSearchParams } from 'expo-router';
import { RecipeScreen } from '../../src/features/recipe/ui/RecipeScreen';

export default function RecipeRoute() {
  const { dishId } = useLocalSearchParams<{ dishId: string }>();
  return <RecipeScreen dishId={dishId ?? ''} />;
}
