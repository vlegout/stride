import { createTheme } from "@mui/material/styles";
import { colors } from "./colors";

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
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.text.primary,
          textDecoration: "none",
          fontWeight: 400,
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
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          color: colors.text.primary,
          textDecoration: "none",
          fontWeight: 400,
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
          "&:visited": {
            color: colors.text.primary,
          },
        },
      },
    },
  },
});
