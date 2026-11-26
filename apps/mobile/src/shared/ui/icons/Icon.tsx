import { colors } from '../../theme';
import { ICONS, type IconName } from './registry';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  /** Only for icons that carry meaning on their own; otherwise the icon is hidden from readers. */
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export function Icon({
  name,
  size = 24,
  color = colors.textPrimary,
  accessibilityLabel,
  testID,
}: IconProps) {
  const Glyph = ICONS[name];
  if (accessibilityLabel) {
    return (
      <Glyph
        width={size}
        height={size}
        color={color}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      />
    );
  }
  return (
    <Glyph
      width={size}
      height={size}
      color={color}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    />
  );
}
