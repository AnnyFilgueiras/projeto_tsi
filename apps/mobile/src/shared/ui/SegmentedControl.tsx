import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, elevation, radius, spacing, touchTarget, typography } from '../theme';

export interface SegmentOption {
  readonly key: string;
  readonly label: string;
}

export interface SegmentedControlProps {
  readonly options: readonly SegmentOption[];
  readonly selectedKey: string;
  readonly onChange: (key: string) => void;
  readonly accessibilityLabel?: string;
}

/** Single choice between views. Scrolls horizontally when large system fonts no longer fit. */
export function SegmentedControl({
  options,
  selectedKey,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.track}
      contentContainerStyle={styles.content}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.selected]}
            testID={`segment-${option.key}`}
          >
            <Text
              style={[styles.label, { color: selected ? colors.primary : colors.textSecondary }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: { flexGrow: 0, backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  content: { flexGrow: 1, padding: spacing.xxs, gap: spacing.xxs },
  segment: {
    flexGrow: 1,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: colors.surface, ...elevation.card },
  label: { ...typography.caption, fontWeight: typography.button.fontWeight },
});
