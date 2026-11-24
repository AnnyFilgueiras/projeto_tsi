import { View } from 'react-native';

// Jest does not run the Metro SVG transformer; every `*.svg` import becomes this inert view so
// components that draw icons still render and expose their accessibility props.
export default function SvgMock(props: Record<string, unknown>) {
  return <View {...props} />;
}
