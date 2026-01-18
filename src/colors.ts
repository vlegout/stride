export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Shadow tokens for consistent depth
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
  glow: "0 0 20px rgba(255, 107, 53, 0.15)",
  card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  cardHover: "0 10px 40px rgba(0, 0, 0, 0.12)",
  header: "0 1px 3px rgba(0, 0, 0, 0.05)",
} as const;

// Gradient tokens for backgrounds
export const gradients = {
  primarySubtle: "linear-gradient(135deg, #FFF4F1 0%, #FFE8E1 100%)",
  warmGlow: "linear-gradient(180deg, rgba(255, 107, 53, 0.03) 0%, transparent 100%)",
  coolFade: "linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)",
  headerShine:
    "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%)",
} as const;

// Spacing tokens for consistent rhythm (in MUI spacing units, 1 unit = 8px)
export const spacing = {
  // Section spacing
  section: { xs: 4, sm: 5, md: 6 }, // 32px / 40px / 48px
  sectionCompact: { xs: 2, sm: 3, md: 4 }, // 16px / 24px / 32px

  // Page padding
  page: { xs: 2, sm: 3, md: 4 }, // 16px / 24px / 32px

  // Card/container internal padding
  card: { xs: 2, sm: 2.5, md: 3 }, // 16px / 20px / 24px
  cardCompact: { xs: 1.5, sm: 2, md: 2.5 }, // 12px / 16px / 20px

  // Content max-width for readability
  contentMaxWidth: "75ch",

  // Gap between items
  gap: { xs: 2, sm: 2.5, md: 3 }, // 16px / 20px / 24px
  gapSmall: { xs: 1, sm: 1.5, md: 2 }, // 8px / 12px / 16px
} as const;

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

  // Chart colors - unified data visualization palette
  chart: {
    // Primary chart color (derived from brand)
    primary: "#FF6B35",
    primaryLight: "rgba(255, 107, 53, 0.15)",

    // Sport-specific colors (harmonious with primary orange)
    running: "#E85D4A", // Warm red-orange
    runningLight: "rgba(232, 93, 74, 0.15)",
    cycling: "#3B82F6", // Vibrant blue
    cyclingLight: "rgba(59, 130, 246, 0.15)",
    swimming: "#0EA5E9", // Sky blue
    swimmingLight: "rgba(14, 165, 233, 0.15)",

    // Secondary metrics
    overall: "#1E293B", // Slate for overall/aggregate data
    overallLight: "rgba(30, 41, 59, 0.15)",

    // Single metric charts (power, TSS, FTP)
    power: "#FF6B35", // Primary orange for power metrics
    powerLight: "rgba(255, 107, 53, 0.15)",

    // Training zone colors (progressive intensity scale)
    zones: [
      "rgba(148, 163, 184, 0.75)", // Zone 1 - Recovery (slate gray)
      "rgba(59, 130, 246, 0.75)", // Zone 2 - Endurance (blue)
      "rgba(34, 197, 94, 0.75)", // Zone 3 - Tempo (green)
      "rgba(250, 204, 21, 0.75)", // Zone 4 - Threshold (yellow)
      "rgba(249, 115, 22, 0.75)", // Zone 5 - VO2max (orange)
      "rgba(239, 68, 68, 0.75)", // Zone 6 - Anaerobic (red)
      "rgba(168, 85, 247, 0.75)", // Zone 7 - Neuromuscular (purple)
      "rgba(236, 72, 153, 0.75)", // Zone 8 - Extended (pink)
      "rgba(139, 92, 246, 0.75)", // Zone 9 - Extended (violet)
      "rgba(99, 102, 241, 0.75)", // Zone 10 - Extended (indigo)
    ],

    // Distance/Time chart pairs (for weekly metrics)
    metrics: {
      runningDistance: "#E85D4A",
      runningTime: "rgba(232, 93, 74, 0.65)",
      cyclingDistance: "#3B82F6",
      cyclingTime: "rgba(59, 130, 246, 0.65)",
      swimmingDistance: "#0EA5E9",
      swimmingTime: "rgba(14, 165, 233, 0.65)",
    },

    // Lap chart color scale (performance gradient)
    lap: {
      slow: "#94A3B8", // Slate for slower laps
      fast: "#FF6B35", // Primary orange for fast laps
    },
  },
} as const;

export type Colors = typeof colors;
