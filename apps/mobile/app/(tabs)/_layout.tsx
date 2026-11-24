import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { colors } from '../../src/shared/theme';
import { LoadingScreen } from '../../src/shared/ui/LoadingScreen';

// Four fixed tabs (MVP-01). Onboarding runs once, before the tabs are reachable.
export default function TabsLayout() {
  const { onboarding } = useDependencies();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    onboarding
      .isCompleted()
      .then((done) => active && setOnboarded(done))
      .catch(() => active && setOnboarded(false));
    return () => {
      active = false;
    };
  }, [onboarding]);

  if (onboarded === null) return <LoadingScreen />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Descobrir' }} />
      <Tabs.Screen name="kitchen" options={{ title: 'Cozinha' }} />
      <Tabs.Screen name="collection" options={{ title: 'Coleção' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
