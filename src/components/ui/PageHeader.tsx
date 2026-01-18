import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { motion } from "framer-motion";
import { spacing as spacingTokens } from "../../colors";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "h4" | "h5" | "h6";
  spacing?: "compact" | "normal" | "spacious";
}

const PageHeader = ({ title, subtitle, variant = "h4", spacing = "normal" }: PageHeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getTitleVariant = (): "h4" | "h5" | "h6" => {
    if (isMobile) {
      switch (variant) {
        case "h4":
          return "h5";
        case "h5":
          return "h6";
        default:
          return variant;
      }
    }
    return variant;
  };

  const getSpacing = () => {
    switch (spacing) {
      case "compact":
        return spacingTokens.sectionCompact;
      case "spacious":
        return { xs: 5, sm: 6, md: 8 };
      default:
        return spacingTokens.section;
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      sx={{
        mb: getSpacing(),
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant={getTitleVariant()}
            component="h1"
            gutterBottom={!!subtitle}
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              component={motion.p}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
