import { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { colors, shadows } from "../../colors";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: { xs: 6, sm: 8 },
        px: { xs: 3, sm: 4 },
        bgcolor: colors.grey[50],
        borderRadius: 3,
        border: `1px dashed ${colors.grey[300]}`,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: "50%",
            bgcolor: colors.background.primarySoft,
            color: colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: shadows.sm,
            "& svg": {
              fontSize: 32,
            },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        variant="h6"
        sx={{
          mb: description ? 1 : 0,
          color: colors.text.primary,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: "40ch",
            mb: action ? 3 : 0,
          }}
        >
          {description}
        </Typography>
      )}
      {action && <Box>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
