import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

// Font families
const fontFamilyDisplay = '"Inter", "Helvetica Neue", Arial, sans-serif';
const fontFamilyBody = '"Roboto", "Helvetica Neue", Arial, sans-serif';

const baseLinkStyles = {
  color: colors.text.primary,
  textDecoration: "none",
  fontWeight: 500,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    color: colors.primary,
    textDecoration: "underline",
    textDecorationColor: colors.primary,
    textUnderlineOffset: "3px",
  },
  "&:focus": {
    color: colors.primary,
    outline: "none",
    boxShadow: "none",
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "none",
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    background: {
      default: colors.grey[50],
      paper: colors.white,
    },
  },
  typography: {
    fontFamily: fontFamilyBody,
    // Display headings - Inter with tight letter-spacing
    h1: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
      color: colors.text.primary,
    },
    h2: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.25,
      letterSpacing: "-0.015em",
      color: colors.text.primary,
    },
    h3: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
      color: colors.text.primary,
    },
    h4: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.35,
      letterSpacing: "-0.005em",
      color: colors.text.primary,
    },
    h5: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.4,
      letterSpacing: "0",
      color: colors.text.primary,
    },
    h6: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.4,
      letterSpacing: "0",
      color: colors.text.primary,
    },
    // Body text - Roboto
    body1: {
      fontFamily: fontFamilyBody,
      fontSize: "1rem",
      lineHeight: 1.6,
      letterSpacing: "0.01em",
      color: colors.text.primary,
    },
    body2: {
      fontFamily: fontFamilyBody,
      fontSize: "0.875rem",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
      color: colors.text.secondary,
    },
    // Labels and captions - slightly wider letter-spacing
    subtitle1: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 500,
      fontSize: "1rem",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
    },
    subtitle2: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 500,
      fontSize: "0.875rem",
      lineHeight: 1.5,
      letterSpacing: "0.02em",
    },
    caption: {
      fontFamily: fontFamilyBody,
      fontSize: "0.75rem",
      lineHeight: 1.5,
      letterSpacing: "0.03em",
      color: colors.text.secondary,
    },
    overline: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "0.75rem",
      lineHeight: 1.5,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: colors.text.secondary,
    },
    button: {
      fontFamily: fontFamilyDisplay,
      fontWeight: 600,
      fontSize: "0.875rem",
      letterSpacing: "0.02em",
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: baseLinkStyles,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          ...baseLinkStyles,
          "&:visited": {
            color: colors.text.primary,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 20px",
          fontWeight: 600,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: fontFamilyDisplay,
          fontWeight: 500,
          borderRadius: 6,
        },
        filled: {
          backgroundColor: colors.grey[100],
          "&:hover": {
            backgroundColor: colors.grey[200],
          },
        },
        outlined: {
          borderColor: colors.grey[300],
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: fontFamilyDisplay,
          fontWeight: 600,
          backgroundColor: colors.primarySoft,
          color: colors.primary,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.grey[200],
          padding: "12px 16px",
        },
        head: {
          fontFamily: fontFamilyDisplay,
          fontWeight: 600,
          backgroundColor: colors.grey[50],
          color: colors.text.primary,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: colors.grey[50],
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.2s ease-in-out",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.grey[400],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[800],
          borderRadius: 6,
          fontSize: "0.75rem",
          fontWeight: 500,
          padding: "6px 12px",
        },
        arrow: {
          color: colors.grey[800],
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          color: "#15803d",
        },
        standardError: {
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#b91c1c",
        },
        standardWarning: {
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          color: "#c2410c",
        },
        standardInfo: {
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          color: "#1d4ed8",
        },
      },
    },
  },
});
