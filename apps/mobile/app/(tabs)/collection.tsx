import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { CollectionScreen } from '../../src/features/progress/ui/collection/CollectionScreen';
import { parseCollectionView } from '../../src/features/progress/ui/collection/collection-view';

export default function CollectionRoute() {
  const { progress } = useDependencies();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  // Tabs stay mounted, so focus (not mount) is what tells the screen to re-read the collection.
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(useCallback(() => setRefreshKey((key) => key + 1), []));

  return (
    <CollectionScreen
      progress={progress.collection}
      refreshKey={refreshKey}
      view={parseCollectionView(params.view)}
      onChangeView={(view) => router.setParams({ view })}
      onOpenRecipe={(dishId) => router.push({ pathname: '/recipe/[dishId]', params: { dishId } })}
      onGoToDiscover={() => router.navigate('/(tabs)/discover')}
      onGoToKitchen={() => router.navigate('/(tabs)/kitchen')}
    />
  );
}
