import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme';

export interface OnboardingScreenProps {
  /** Persists completion and navigates on; injected by the route (A8). */
  readonly onStart: () => Promise<void>;
}

/** Quick first-launch onboarding (MVP-01). Real content and copy come from UX-01A (#61). */
export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleStart() {
    setBusy(true);
    setFailed(false);
    try {
      await onStart();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Bem-vindo ao Panelada
        </Text>
        <Text style={styles.subtitle}>
          Descubra pratos do mundo, cozinhe offline e complete sua coleção.
        </Text>
        {failed && <Text style={styles.error}>Não foi possível continuar. Tente de novo.</Text>}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={handleStart}
          style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>Começar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.subtitle, color: colors.textSecondary },
  error: { ...typography.caption, color: colors.danger },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { ...typography.button, color: colors.onPrimary },
});
