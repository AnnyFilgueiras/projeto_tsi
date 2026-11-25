import { useRouter } from 'expo-router';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { DiscoverScreen } from '../../src/features/suggestions/ui/DiscoverScreen';

export default function DiscoverRoute() {
  const { suggestions } = useDependencies();
  const router = useRouter();
  return (
    <DiscoverScreen
      round={suggestions}
      onOpenRecipe={(dishId) => router.push({ pathname: '/recipe/[dishId]', params: { dishId } })}
      onGoToKitchen={() => router.navigate('/(tabs)/kitchen')}
      onGoToProfile={() => router.navigate('/(tabs)/profile')}
    />
  );
}
