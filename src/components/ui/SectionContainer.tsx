import { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  variant?: "paper";
  spacing?: "compact";
  maxWidth?: string | number | Record<string, string | number>;
  centered?: boolean;
  elevation?: number;
}

const SectionContainer = ({
  children,
  title,
  variant,
  spacing,
  maxWidth,
  centered = false,
  elevation = 1,
}: SectionContainerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getSpacing = () => {
    if (spacing === "compact") {
      return { xs: 1, sm: 2 };
    }
    return { xs: 2, sm: 3 };
  };

  const getContainerProps = () => {
    const baseProps = {
      sx: {
        mb: getSpacing(),
        mx: centered ? "auto" : 0,
        ...(maxWidth && { maxWidth }),
        ...(centered && { textAlign: "center" }),
      },
    };

    if (variant === "paper") {
      return {
        component: Paper,
        elevation,
        sx: {
          ...baseProps.sx,
          p: getSpacing(),
        },
      };
    }

    return baseProps;
  };

  const getTitleVariant = () => {
    if (isMobile) {
      return "subtitle1";
    }
    return "h6";
  };

  const renderHeader = () => {
    if (!title) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant={getTitleVariant()}
          component="h2"
          sx={{ fontWeight: 700, textAlign: centered ? "center" : "left" }}
        >
          {title}
        </Typography>
      </Box>
    );
  };

  return (
    <Box {...getContainerProps()}>
      {renderHeader()}
      {children}
    </Box>
  );
};

export default SectionContainer;
