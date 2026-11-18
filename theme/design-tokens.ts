// Design tokens for the app UI
export const Palette = {
  light: {
    // Light theme - warm cream/beige colors
    background: "#FFF8E7",
    surface: "#F5F2EA",
    surfaceElevated: "#EFEEE8",
    /** Decorative gold: borders, ornaments, fills, rings. Never text. */
    brand: "#B8860B",
    /** Gold for text and meaning-bearing icons (5.07:1 on background). */
    brandText: "#8A6410",
    /** @deprecated Use `brand` for decoration and `brandText` for text. */
    primary: "#B8860B",
    primarySoft: "#DAA520",
    onPrimary: "#FFFFFF",
    text: "#2C2A26",
    textMuted: "#6B6B6B",
    outline: "#B8860B",
    cardBorder: "#B8860B",
    success: "#2E7D32",
    warning: "#B26A00",
    danger: "#C62828",
    /** Streak flame — live streak (4.89:1 on background). */
    streakFlame: "#C2410C",
    /** Streak flame — about to expire tonight (5.14:1). */
    streakAtRisk: "#C0392B",
    /** Streak flame — streak reset, kept as a memory (5.08:1). */
    streakBroken: "#6F6A60",
    /** Lotus freeze mark (6.88:1). */
    streakFrozen: "#1E5A8A",
  },
  dark: {
    // Dark theme - current dark gold theme
    background: "#0B0A09",
    surface: "#11100E",
    surfaceElevated: "#161512",
    /** Decorative gold: borders, ornaments, fills, rings. Never text. */
    brand: "#E6B74A",
    /** Gold for text and meaning-bearing icons (10.58:1 on background). */
    brandText: "#E6B74A",
    /** @deprecated Use `brand` for decoration and `brandText` for text. */
    primary: "#E6B74A",
    primarySoft: "#F2D48A",
    onPrimary: "#1B1302",
    text: "#F5F2EA",
    textMuted: "#C9C3B2",
    outline: "#E6B74A",
    cardBorder: "#E6B74A",
    success: "#7AD19F",
    warning: "#F3BE6C",
    danger: "#F08A7E",
    /** Streak flame — live streak (8.74:1 on background). */
    streakFlame: "#FB923C",
    /** Streak flame — about to expire tonight (8.11:1). */
    streakAtRisk: "#F08A7E",
    /** Streak flame — streak reset, kept as a memory (7.65:1). */
    streakBroken: "#A8A094",
    /** Lotus freeze mark (9.09:1). */
    streakFrozen: "#7FB6DE",
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  section: 28,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 0,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
};

/**
 * The eight named type tokens (motion-and-typography spec §5.3).
 *
 * Tracking is a Latin-only tool: it is baked into `caption` and `display`,
 * which are only ever used on fixed English strings. Scripture and localized
 * content must stay untracked (BUG-026).
 */
export const Type = {
  display: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 26,
    lineHeight: 32,
  },
  heading: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    lineHeight: 26,
  },
  /** Latin sloka. Non-Latin content overrides `fontFamily` via `getScriptureFont`. */
  sloka: {
    fontFamily: "PlayfairDisplay_400Regular_Italic",
    fontSize: 24,
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
} as const;

// Default export to fix the warning
export default {
  Palette,
  Spacing,
  Radius,
  Shadows,
  Type,
};
