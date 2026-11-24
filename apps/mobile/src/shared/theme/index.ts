/**
 * Provisional design tokens for the navigation shell (MVP-04D).
 *
 * Final semantic tokens, contrast checks and the allergen visual pattern come from UX-01 (#60);
 * screens must read colors and spacing from here so that swap is a one-file change.
 */
export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  primary: '#B4441F',
  onPrimary: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  danger: '#B91C1C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 12,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, fontWeight: '400' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
} as const;
