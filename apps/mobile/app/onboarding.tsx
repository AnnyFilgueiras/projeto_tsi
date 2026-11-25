import { useRouter } from 'expo-router';
import { useDependencies } from '../src/app/composition/dependencies-context';
import { OnboardingFlow } from '../src/features/profile/ui/onboarding/OnboardingFlow';

export default function OnboardingRoute() {
  const { onboarding, profile } = useDependencies();
  const router = useRouter();

  return (
    <OnboardingFlow
      prepareAccount={profile.prepareAccount}
      registerRestrictions={profile.registerRestrictions}
      listCuisines={profile.listCuisines}
      saveCulinaryPreferences={profile.saveCulinaryPreferences}
      onFinish={async () => {
        await onboarding.markCompleted(new Date());
        // replace: going back must not reopen onboarding.
        router.replace('/(tabs)/discover');
      }}
    />
  );
}
