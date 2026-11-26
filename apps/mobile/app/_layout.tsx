import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { createMobileDependencies } from '../src/app/composition';
import { DependenciesProvider } from '../src/app/composition/dependencies-context';
import { colors, spacing } from '../src/shared/theme';
import { EmptyState } from '../src/shared/ui';
import { LoadingScreen } from '../src/shared/ui/LoadingScreen';

const create = () => createMobileDependencies();

export default function RootLayout() {
  return (
    <DependenciesProvider
      create={create}
      loading={<LoadingScreen />}
      renderError={(_error, retry) => (
        // No error detail on screen: it could echo local data, and the user can only retry.
        <SafeAreaView style={styles.error}>
          <EmptyState
            icon="alert-circle"
            title="Não foi possível abrir o Panelada"
            message="Tente de novo."
            actionLabel="Tentar novamente"
            onAction={retry}
          />
        </SafeAreaView>
      )}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </DependenciesProvider>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
