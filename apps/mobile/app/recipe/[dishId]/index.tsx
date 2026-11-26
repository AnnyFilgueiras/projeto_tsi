import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDependencies } from '../../../src/app/composition/dependencies-context';
import { RecipeScreen } from '../../../src/features/recipe/ui/RecipeScreen';

export default function RecipeRoute() {
  const { dishId = '' } = useLocalSearchParams<{ dishId: string }>();
  const { recipe } = useDependencies();
  const router = useRouter();

  return (
    <RecipeScreen
      // Remount per dish: opening the base dish from a locked evolution starts a fresh screen.
      key={dishId}
      dishId={dishId}
      recipes={recipe}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/kitchen'))}
      onOpenDish={(id) => router.push(`/recipe/${id}`)}
      onRate={() => router.push(`/recipe/${dishId}/rate`)}
    />
  );
}
