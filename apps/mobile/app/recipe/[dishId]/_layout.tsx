import { Stack } from 'expo-router';

// Recipe flow (§1.1): outside (tabs), so the tab bar is hidden; rating and celebration open as
// full-screen modals over the recipe. Each screen issue fills only its own route file.
export default function RecipeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="rate" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="celebrate" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
