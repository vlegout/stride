import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { colors } from "../../colors";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "primary" | "secondary" | "default";
  size?: "small" | "medium" | "large";
}

const StatsCard = ({ title, value, subtitle, variant = "default", size = "medium" }: StatsCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getDisplayValue = () => {
    if (value === null || value === undefined || value === 0) {
      return "—";
    }
    return value;
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return colors.primarySoft;
      case "secondary":
        return "rgba(0, 0, 0, 0.04)";
      default:
        return "rgba(0, 0, 0, 0.02)";
    }
  };

  const getValueVariant = () => {
    switch (size) {
      case "small":
        return isMobile ? "body1" : "h6";
      case "large":
        return isMobile ? "h4" : "h3";
      default:
        return isMobile ? "h5" : "h4";
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return { xs: 1.5, sm: 2 };
      case "large":
        return { xs: 2.5, sm: 3 };
      default:
        return { xs: 2, sm: 2.5 };
    }
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        p: getPadding(),
        bgcolor: getBackgroundColor(),
        borderRadius: 1,
        border: variant === "primary" ? `1px solid ${colors.primary}` : "1px solid transparent",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Typography
        variant={getValueVariant()}
        component="div"
        sx={{
          fontWeight: "bold",
          color: variant === "primary" ? colors.primary : "text.primary",
          mb: 0.5,
          wordBreak: "break-word",
          hyphens: "auto",
          lineHeight: 1.2,
        }}
      >
        {getDisplayValue()}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontSize: isMobile ? "0.75rem" : "0.875rem",
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: isMobile ? "0.7rem" : "0.75rem",
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default StatsCard;
