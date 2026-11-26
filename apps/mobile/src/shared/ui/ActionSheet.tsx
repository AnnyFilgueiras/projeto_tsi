import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing, typography } from '../theme';
import { useReducedMotion } from './motion';

export interface ActionSheetProps {
  readonly visible: boolean;
  /** Backdrop and Android back; pass a no-op while an action is running. */
  readonly onClose: () => void;
  readonly title: string;
  readonly children?: ReactNode;
  /** Pinned between the scrolling body and the actions, so it never scrolls out of view. */
  readonly footer?: ReactNode;
  /** Footer buttons (e.g. Cancelar / Remover), laid out side by side. */
  readonly actions: ReactNode;
  readonly testID?: string;
}

const HANDLE_WIDTH = 40;
const MAX_HEIGHT = '85%';

/**
 * Bottom sheet that asks for a decision. Same look as `BottomSheet`, but the caller owns the
 * buttons: a fixed "Fechar" next to "Cancelar" would be two ways of saying the same thing.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  actions,
  testID,
}: ActionSheetProps) {
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
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children ? (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {children}
            </ScrollView>
          ) : null}
          {footer}
          <View style={styles.actions}>{actions}</View>
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
    gap: spacing.md,
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
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  title: { ...typography.subtitle, color: colors.textPrimary },
  body: { flexGrow: 0 },
  bodyContent: { gap: spacing.md },
  // Each button takes half the row, like the Figma dialog.
  actions: { flexDirection: 'row', gap: spacing.sm },
});
