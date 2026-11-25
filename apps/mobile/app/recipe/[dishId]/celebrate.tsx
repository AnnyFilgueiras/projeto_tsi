import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useDependencies } from '../../../src/app/composition/dependencies-context';
import {
  CelebrationScreen,
  type CelebrationRouteParams,
} from '../../../src/features/progress/ui/celebration/CelebrationScreen';

export default function CelebrateRoute() {
  const {
    dishId = '',
    ratingId,
    evolutions,
    badges,
    repeat,
  } = useLocalSearchParams<Omit<CelebrationRouteParams, 'dishId'> & { dishId: string }>();
  const { progress } = useDependencies();
  const router = useRouter();
  // Exits close the modal and the recipe under it, so back from the tab never reopens the
  // finished flow (§9: the rating form was already sent).
  const leaveTo = useCallback((href: Href) => router.dismissTo(href), [router]);
  const goToKitchen = useCallback(() => leaveTo('/(tabs)/kitchen'), [leaveTo]);

  // Android back goes to the Kitchen, never to the sent rating form. Only while focused: once
  // "Conhecer" pushes the evolution recipe on top, back must return here, not skip to the tab.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goToKitchen();
        return true;
      });
      return () => subscription.remove();
    }, [goToKitchen]),
  );

  return (
    <CelebrationScreen
      progress={progress.snapshots}
      routeParams={{ dishId, ratingId, evolutions, badges, repeat }}
      onOpenDish={(id) => router.push({ pathname: '/recipe/[dishId]', params: { dishId: id } })}
      onOpenCollection={(view) => leaveTo({ pathname: '/(tabs)/collection', params: { view } })}
      onGoToKitchen={goToKitchen}
      onGoToDiscover={() => leaveTo('/(tabs)/discover')}
    />
  );
}
