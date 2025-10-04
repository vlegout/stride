import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { colors } from "../../colors";

interface StatsCardProps {
  title: string;
  value: string | number;
  variant?: "primary" | "default";
  size?: "small" | "large";
}

const StatsCard = ({ title, value, variant = "default", size = "small" }: StatsCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getDisplayValue = (): string | number => {
    if (value === null || value === undefined || value === 0) {
      return "—";
    }
    return value;
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case "primary":
        return colors.primarySoft;
      default:
        return "rgba(0, 0, 0, 0.02)";
    }
  };

  const getValueVariant = (): "h3" | "h4" | "h6" | "body1" => {
    switch (size) {
      case "large":
        return isMobile ? "h4" : "h3";
      default:
        return isMobile ? "body1" : "h6";
    }
  };

  const getPadding = (): { xs: number; sm: number } => {
    switch (size) {
      case "large":
        return { xs: 2.5, sm: 3 };
      default:
        return { xs: 1.5, sm: 2 };
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
    </Box>
  );
};

export default StatsCard;
