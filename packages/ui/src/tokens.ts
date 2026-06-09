// PeixeAqui Design Tokens
// Dark mode first. These are the single source of truth for all styling.

export const colors = {
  // ─── Dark mode backgrounds ─────────────────────────────────────────────────
  dark: {
    bgPrimary: '#0A0E1A',   // near-black with ocean blue undertone
    bgSurface: '#111827',   // component surfaces
    bgElevated: '#1C2537',  // elevated sheets / modals
    bgOverlay: 'rgba(10, 14, 26, 0.85)',
    border: '#263147',      // subtle borders
  },

  // ─── Light mode backgrounds ────────────────────────────────────────────────
  light: {
    bgPrimary: '#F5F0EB',   // warm sand, not pure white
    bgSurface: '#FFFFFF',
    bgElevated: '#FFFFFF',
    bgOverlay: 'rgba(245, 240, 235, 0.92)',
    border: '#E2DAD0',
  },

  // ─── Brand ────────────────────────────────────────────────────────────────
  brand: {
    teal: '#0AABB5',         // ocean/water — primary brand
    tealDark: '#078F99',     // pressed state
    tealLight: '#0EC8D4',    // highlights
    amber: '#F0920A',        // dawn light / action — secondary brand
    amberDark: '#D47E09',
    amberLight: '#F7A832',
  },

  // ─── Fishing score semantic colors ────────────────────────────────────────
  score: {
    excellent: '#22C55E',    // 76-100
    good: '#84CC16',         // 51-75
    moderate: '#F59E0B',     // 26-50
    poor: '#EF4444',         // 0-25
  },

  // ─── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#475569',
    inverse: '#0A0E1A',      // text on light backgrounds
  },

  textLight: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#F1F5F9',
  },

  // ─── Spot type colors ─────────────────────────────────────────────────────
  spotType: {
    beach: '#F59E0B',
    river: '#3B82F6',
    lake: '#06B6D4',
    reservoir: '#0EA5E9',
    mangrove: '#16A34A',
    rocky_shore: '#78716C',
    estuary: '#2DD4BF',
    pier: '#6366F1',
    boat_ramp: '#8B5CF6',
    offshore: '#0284C7',
    waterfall: '#22D3EE',
    dam: '#64748B',
  },
} as const

export const typography = {
  // Fonts must be loaded by the app (expo-font)
  family: {
    sans: 'PlusJakartaSans',
    sansBold: 'PlusJakartaSans-Bold',
    mono: 'JetBrainsMono',
    monoBold: 'JetBrainsMono-Bold',
  },

  size: {
    hero: 32,
    title: 22,
    heading: 17,
    body: 15,
    caption: 13,
    tiny: 11,
    data: 20,      // numeric data: tide height, wind speed, etc.
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
} as const

// Score label to color mapping
export function getScoreColor(score: number): string {
  if (score >= 76) return colors.score.excellent
  if (score >= 51) return colors.score.good
  if (score >= 26) return colors.score.moderate
  return colors.score.poor
}

// Spot type to readable label
export const SPOT_TYPE_LABELS: Record<string, string> = {
  beach: 'Praia',
  river: 'Rio',
  lake: 'Lago',
  reservoir: 'Represa',
  mangrove: 'Mangue',
  rocky_shore: 'Costão',
  estuary: 'Estuário',
  pier: 'Píer',
  boat_ramp: 'Rampa',
  offshore: 'Offshore',
  waterfall: 'Cachoeira',
  dam: 'Barragem',
}

export const ENVIRONMENT_LABELS: Record<string, string> = {
  saltwater: 'Salgada',
  freshwater: 'Doce',
  brackish: 'Salobra',
}
