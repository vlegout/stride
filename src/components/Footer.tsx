import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import DescriptionIcon from "@mui/icons-material/Description";

import { colors } from "../colors";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: colors.primarySoft,
        color: colors.text.onLight,
        py: 2,
        px: 3,
        mt: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="https://docs.stride.ovh"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: colors.text.onLight,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <DescriptionIcon fontSize="small" />
          <Typography variant="body2">Documentation</Typography>
        </Link>
        <Link
          href="https://github.com/vlegout/stride"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: colors.text.onLight,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <GitHubIcon fontSize="small" />
          <Typography variant="body2">GitHub</Typography>
        </Link>
        <Typography variant="body2">Version: {__APP_VERSION__}</Typography>
      </Box>
    </Box>
  );
};

export default Footer;
