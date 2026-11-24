/**
 * Semantic design tokens (UX-01, docs/fase3/ux-onda1a.md §1.2).
 *
 * Components and screens read every color, spacing, radius, font size and shadow from here; no
 * literal values in `shared/ui` or feature UI. The `allergen*` colors carry food-safety meaning
 * (A06) and must never be reused for anything else.
 */
export const colors = {
  // Surfaces
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EDE4',
  border: '#E3DCD1',
  // Brand and actions
  primary: '#B4441F',
  onPrimary: '#FFFFFF',
  primarySoft: '#FBE9E1',
  // Text
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  // Fails AA on surfaceAlt (4.15:1); use textSecondary there.
  textMuted: '#6B7280',
  // Food safety (A06)
  allergenSafe: '#166534',
  allergenSafeSoft: '#DCFCE7',
  allergenWarning: '#92400E',
  allergenWarningSoft: '#FEF3C7',
  allergenDanger: '#B91C1C',
  allergenDangerSoft: '#FEE2E2',
  onAllergenDanger: '#FFFFFF',
  // Network / sync state (ADR-008)
  offlineBanner: '#E2E8F0',
  onOfflineBanner: '#1E293B',
  // Rewards (ADR-016)
  successUnlock: '#6D28D9',
  successUnlockSoft: '#EDE9FE',
  progress: '#B4441F',
  // Generic technical errors (not food-safety)
  danger: '#B91C1C',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  // Current recipe step, readable from the kitchen counter (A04).
  stepBody: { fontSize: 22, lineHeight: 32, fontWeight: '500' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
} as const;

// Android reads `elevation`; iOS reads the shadow* keys.
export const elevation = {
  none: { elevation: 0 },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sheet: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
} as const;

// dp — §1.6: every tappable element is at least `min`; recipe step navigation uses `comfortable`.
export const touchTarget = { min: 48, comfortable: 56 } as const;
