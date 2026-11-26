import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { DiscoverScreen } from '../../src/features/suggestions/ui/DiscoverScreen';

export default function DiscoverRoute() {
  const { suggestions } = useDependencies();
  const router = useRouter();
  // Tabs stay mounted: on focus, pick up a round invalidated by a Profile change (#86). Same
  // version → same state → no reload, so plain tab switching keeps the cards in place.
  const [roundVersion, setRoundVersion] = useState(() => suggestions.version());
  useFocusEffect(useCallback(() => setRoundVersion(suggestions.version()), [suggestions]));

  return (
    <DiscoverScreen
      round={suggestions}
      refreshKey={roundVersion}
      onOpenRecipe={(dishId) => router.push({ pathname: '/recipe/[dishId]', params: { dishId } })}
      onGoToKitchen={() => router.navigate('/(tabs)/kitchen')}
      onGoToProfile={() => router.navigate('/(tabs)/profile')}
    />
  );
}
