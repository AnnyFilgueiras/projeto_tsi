import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { useReducedMotion } from './motion';

export interface BottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  /** Small label above the title (e.g. "Trocas seguras"). */
  readonly overline?: string;
  readonly children: ReactNode;
  readonly testID?: string;
}

const HANDLE_WIDTH = 40;
const MAX_HEIGHT = '85%';

/**
 * Short contextual sheet (swaps, seal meaning). Closes by the "Fechar" button, the backdrop or the
 * Android back gesture; screen readers stay inside it while open.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  overline,
  children,
  testID,
}: BottomSheetProps) {
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        />
        <View style={styles.sheet} accessibilityViewIsModal testID={testID}>
          <View style={styles.handle} />
          {overline ? <Text style={styles.overline}>{overline}</Text> : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          <Button label="Fechar" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.textPrimary, opacity: 0.4 },
  sheet: {
    maxHeight: MAX_HEIGHT,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
    ...elevation.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE_WIDTH,
    height: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  overline: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.subtitle, color: colors.textPrimary },
  body: { flexGrow: 0 },
  bodyContent: { gap: spacing.sm, paddingBottom: spacing.sm },
});
