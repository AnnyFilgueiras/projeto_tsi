import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export function FoundationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Panelada</Text>
        <Text style={styles.subtitle}>Fundação do aplicativo ativa</Text>
        <Text style={styles.version}>Versão das regras de alérgenos: {PACKAGE_VERSION}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  version: {
    fontSize: 14,
    color: '#6B7280',
  },
});
