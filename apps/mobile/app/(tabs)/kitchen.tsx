import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { KitchenScreen } from '../../src/features/recipe/ui/kitchen/KitchenScreen';

export default function KitchenRoute() {
  const { recipe, kitchenNews } = useDependencies();
  const router = useRouter();
  // Tabs stay mounted, so focus (not mount) is what tells the screen to re-read the lists.
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
      // Seeing the Kitchen is what the news dot asked for (§1.1 rule 4).
      kitchenNews.clear();
    }, [kitchenNews]),
  );

  return (
    <KitchenScreen
      kitchen={recipe}
      refreshKey={refreshKey}
      onOpenRecipe={(dishId) => router.push({ pathname: '/recipe/[dishId]', params: { dishId } })}
      onFinish={(dishId) => router.push({ pathname: '/recipe/[dishId]/rate', params: { dishId } })}
      onGoToDiscover={() => router.navigate('/(tabs)/discover')}
    />
  );
}
