import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useDependencies } from '../../../src/app/composition/dependencies-context';
import { RatingScreen } from '../../../src/features/progress/ui/rating/RatingScreen';

export default function RateRoute() {
  const { dishId = '' } = useLocalSearchParams<{ dishId: string }>();
  const { progress } = useDependencies();
  const router = useRouter();
  // Stable reference: the screen reloads the context whenever this function changes.
  const loadContext = useCallback(() => progress.loadRatingContext(dishId), [progress, dishId]);

  return (
    <RatingScreen
      dishId={dishId}
      loadContext={loadContext}
      registerRating={(input) => progress.registerRating.execute(input)}
      onClose={() => router.back()}
      // replace, not push: going back from the Celebration must not reopen a sent form (#84).
      onSaved={(params) => router.replace({ pathname: '/recipe/[dishId]/celebrate', params })}
    />
  );
}
