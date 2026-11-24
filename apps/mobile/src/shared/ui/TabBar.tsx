import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../theme';
import { Icon } from './icons/Icon';
import type { IconName } from './icons/registry';

export interface TabBarItem {
  readonly key: string;
  readonly label: string;
  readonly icon: IconName;
  readonly active: boolean;
  /** Discreet novelty dot (§1.1 rule 4) — never a pending counter. */
  readonly hasNews?: boolean;
  readonly onPress: () => void;
}

export interface TabBarProps {
  readonly items: readonly TabBarItem[];
  /** Bottom safe-area inset, supplied by the router adapter. */
  readonly bottomInset?: number;
}

const NEWS_DOT_SIZE = 9;

/** Presentational bottom bar: icon + label always visible. Navigation wiring lives in `app/`. */
export function TabBar({ items, bottomInset = 0 }: TabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset }]} accessibilityRole="tablist">
      {items.map((item) => {
        const tint = item.active ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: item.active }}
            accessibilityLabel={item.hasNews ? `${item.label}, novidade` : item.label}
            style={styles.tab}
            testID={`tab-${item.key}`}
          >
            <View>
              <Icon name={item.icon} color={tint} />
              {item.hasNews ? <View style={styles.dot} testID={`tab-${item.key}-news`} /> : null}
            </View>
            <Text style={[styles.label, { color: tint }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: touchTarget.comfortable + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  label: { ...typography.overline, fontWeight: typography.button.fontWeight },
  dot: {
    position: 'absolute',
    top: -spacing.xxs,
    right: -spacing.xs,
    width: NEWS_DOT_SIZE,
    height: NEWS_DOT_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
