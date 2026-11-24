import { Stack } from 'expo-router';
import { createMobileDependencies } from '../src/app/composition';
import { DependenciesProvider } from '../src/app/composition/dependencies-context';
import { LoadingScreen } from '../src/shared/ui/LoadingScreen';
import { PlaceholderScreen } from '../src/shared/ui/PlaceholderScreen';

const create = () => createMobileDependencies();

export default function RootLayout() {
  return (
    <DependenciesProvider
      create={create}
      loading={<LoadingScreen />}
      renderError={() => (
        <PlaceholderScreen
          title="Não foi possível abrir o Panelada"
          description="Os dados do aparelho não puderam ser carregados. Feche e abra o app novamente."
        />
      )}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </DependenciesProvider>
  );
}
