import { Box } from "@mui/material";
import { colors } from "../../colors";

interface DividerProps {
  variant?: "full" | "inset" | "middle";
  spacing?: "sm" | "md" | "lg";
  accent?: boolean;
}

const Divider = ({ variant = "full", spacing = "md", accent = false }: DividerProps) => {
  const getSpacing = () => {
    switch (spacing) {
      case "sm":
        return { xs: 2, sm: 2 };
      case "lg":
        return { xs: 4, sm: 5 };
      default:
        return { xs: 3, sm: 4 };
    }
  };

  const getMargin = () => {
    switch (variant) {
      case "inset":
        return { left: { xs: 2, sm: 3 }, right: 0 };
      case "middle":
        return { left: { xs: 3, sm: 4 }, right: { xs: 3, sm: 4 } };
      default:
        return { left: 0, right: 0 };
    }
  };

  const margins = getMargin();

  return (
    <Box
      sx={{
        my: getSpacing(),
        ml: margins.left,
        mr: margins.right,
        height: accent ? "2px" : "1px",
        background: accent
          ? `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 50%, transparent 100%)`
          : colors.grey[200],
        borderRadius: accent ? "1px" : 0,
        maxWidth: accent ? "120px" : "none",
      }}
    />
  );
};

export default Divider;
