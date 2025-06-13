import { ReactNode } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

interface SectionContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "plain" | "paper" | "bordered";
  spacing?: "compact" | "normal" | "spacious";
  maxWidth?: string | number | Record<string, string | number>;
  centered?: boolean;
  divider?: boolean;
  elevation?: number;
}

const SectionContainer = ({
  children,
  title,
  subtitle,
  actions,
  variant = "plain",
  spacing = "normal",
  maxWidth,
  centered = false,
  divider = false,
  elevation = 1,
}: SectionContainerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getSpacing = () => {
    switch (spacing) {
      case "compact":
        return { xs: 1, sm: 2 };
      case "spacious":
        return { xs: 3, sm: 4 };
      default:
        return { xs: 2, sm: 3 };
    }
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

    if (variant === "bordered") {
      return {
        sx: {
          ...baseProps.sx,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
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
    if (!title && !actions) return null;

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 2 },
          mb: title || subtitle ? 2 : 0,
        }}
      >
        {(title || subtitle) && (
          <Box sx={{ textAlign: centered ? "center" : "left" }}>
            {title && (
              <Typography variant={getTitleVariant()} component="h2" gutterBottom={!!subtitle} sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {actions && (
          <Box
            sx={{
              flexShrink: 0,
              alignSelf: { xs: centered ? "center" : "flex-start", sm: "flex-start" },
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box {...getContainerProps()}>
      {renderHeader()}

      {divider && (title || actions) && <Divider sx={{ mb: 2 }} />}

      {children}
    </Box>
  );
};

export default SectionContainer;
