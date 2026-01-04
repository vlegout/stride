import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export default function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box sx={{ color: "text.secondary" }}>{children}</Box>
    </Box>
  );
}
