import { Redirect, Tabs } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { useDependencies } from '../../src/app/composition/dependencies-context';
import { type IconName, LoadingScreen, TabBar } from '../../src/shared/ui';

type TabBarRenderProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Readonly<Record<string, IconName>> = {
  discover: 'tab-discover',
  kitchen: 'tab-kitchen',
  collection: 'tab-collection',
  profile: 'tab-profile',
};

// Adapter from react-navigation's tab bar props to the presentational shared/ui TabBar.
function RouterTabBar({ state, descriptors, navigation, insets }: TabBarRenderProps) {
  const items = state.routes.map((route, index) => {
    const active = state.index === index;
    return {
      key: route.name,
      label: descriptors[route.key]?.options.title ?? route.name,
      icon: TAB_ICONS[route.name] ?? 'tab-discover',
      active,
      // Wired to "new candidate in the kitchen" in #78.
      hasNews: false,
      onPress: () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      },
    };
  });
  return <TabBar items={items} bottomInset={insets.bottom} />;
}

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
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RouterTabBar {...props} />}>
      <Tabs.Screen name="discover" options={{ title: 'Descobrir' }} />
      <Tabs.Screen name="kitchen" options={{ title: 'Cozinha' }} />
      <Tabs.Screen name="collection" options={{ title: 'Coleção' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
