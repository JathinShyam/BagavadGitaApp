// Design tokens for the app UI
export const Palette = {
  light: {
    // Light theme - warm cream/beige colors
    background: "#FFF8E7",
    surface: "#F5F2EA",
    surfaceElevated: "#EFEEE8",
    primary: "#B8860B",
    primarySoft: "#DAA520",
    onPrimary: "#FFFFFF",
    text: "#2C2A26",
    textMuted: "#6B6B6B",
    outline: "#D4C4A8",
    cardBorder: "#B8860B",
    success: "#4CAF50",
    warning: "#FF9800",
    danger: "#F44336",
  },
  dark: {
    // Dark theme - current dark gold theme
    background: "#0B0A09",
    surface: "#11100E",
    surfaceElevated: "#161512",
    primary: "#E6B74A",
    primarySoft: "#F2D48A",
    onPrimary: "#1B1302",
    text: "#F5F2EA",
    textMuted: "#C9C3B2",
    outline: "rgba(230, 183, 74, 0.4)",
    cardBorder: "#E6B74A",
    success: "#7AD19F",
    warning: "#F3BE6C",
    danger: "#F08A7E",
  },
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const Typography = {
  // These will map to loaded fonts in _layout
  heading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    letterSpacing: 0.5,
  },
  headingXL: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 36,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.4,
  },
};

// Default export to fix the warning
export default {
  Palette,
  Spacing,
  Radius,
  Shadows,
  Typography,
};
