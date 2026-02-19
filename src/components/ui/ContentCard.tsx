import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { colors, shadows, spacing } from "../../colors";

interface ContentCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  accentColor?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

const ContentCard = ({
  children,
  title,
  subtitle,
  headerAction,
  accentColor,
  noPadding = false,
  onClick,
}: ContentCardProps) => {
  const isClickable = !!onClick;

  const hoverProps = isClickable
    ? {
        whileHover: {
          y: -4,
          boxShadow: shadows.cardHover,
          transition: { duration: 0.2 },
        },
      }
    : {};

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      {...hoverProps}
      sx={{
        bgcolor: colors.white,
        borderRadius: 3,
        border: `1px solid ${colors.grey[200]}`,
        boxShadow: shadows.card,
        overflow: "hidden",
        cursor: isClickable ? "pointer" : "default",
        position: "relative",
        // Accent line on top
        ...(accentColor && {
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: accentColor,
            borderRadius: "12px 12px 0 0",
          },
        }),
      }}
    >
      {(title || headerAction) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: spacing.card,
            pt: spacing.card,
            pb: noPadding ? spacing.cardCompact : 0,
            borderBottom: noPadding ? `1px solid ${colors.grey[100]}` : "none",
          }}
        >
          <Box>
            {title && (
              <Typography variant="h6" component="h3">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerAction && <Box>{headerAction}</Box>}
        </Box>
      )}
      <Box
        sx={{
          p: noPadding ? 0 : spacing.card,
          pt: title && !noPadding ? spacing.cardCompact : noPadding ? 0 : spacing.card,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ContentCard;
