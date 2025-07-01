export const colors = {
  primary: "#FF6B35", // Main orange-red from logo
  primaryLight: "#FF8C60", // Lighter shade used in logo highlights
  primaryLighter: "#FFB299", // Even lighter for backgrounds
  primarySoft: "#FFD4C4", // Very light for subtle backgrounds
  primaryDark: "#E5572A", // Darker variation for contrast

  // Opacity variations for backgrounds
  primaryAlpha08: "#FF6B35", // Can be used with 0.08 opacity
  primaryAlpha12: "#FF6B35", // Can be used with 0.12 opacity

  // Neutral colors
  white: "#FFFFFF",
  black: "#000000",
  grey: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  // Background colors derived from logo
  background: {
    primary: "#FF6B35", // Full primary color
    primarySoft: "#FFF4F1", // Very light background
    primaryMuted: "#FFE8E1", // Muted background
  },

  // Text colors
  text: {
    primary: "#212121",
    secondary: "#757575",
    onPrimary: "#FFFFFF", // White text on primary background
    onLight: "#424242", // Dark text on light backgrounds
  },
} as const;

export type Colors = typeof colors;
