import { useRouter } from 'expo-router';
import { useDependencies } from '../src/app/composition/dependencies-context';
import { OnboardingScreen } from '../src/features/profile/ui/OnboardingScreen';

export default function OnboardingRoute() {
  const { onboarding } = useDependencies();
  const router = useRouter();

  return (
    <OnboardingScreen
      onStart={async () => {
        await onboarding.markCompleted(new Date());
        router.replace('/discover');
      }}
    />
  );
}
