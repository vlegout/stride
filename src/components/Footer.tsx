import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import DescriptionIcon from "@mui/icons-material/Description";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import GavelIcon from "@mui/icons-material/Gavel";
import { Link as RouterLink } from "react-router-dom";

import { colors, gradients } from "../colors";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: gradients.primarySubtle,
        color: colors.text.onLight,
        py: 2.5,
        px: 3,
        mt: "auto",
        borderTop: `1px solid ${colors.grey[200]}`,
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
          component={RouterLink}
          to="/privacy"
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
          <PrivacyTipIcon fontSize="small" />
          <Typography variant="body2">Privacy Policy</Typography>
        </Link>
        <Link
          component={RouterLink}
          to="/terms"
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
          <GavelIcon fontSize="small" />
          <Typography variant="body2">Terms of Service</Typography>
        </Link>
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
      </Box>
    </Box>
  );
};

export default Footer;
