import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { colors } from "../colors";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: colors.primaryLighter,
        color: colors.text.onLight,
        py: 2,
        px: 3,
        mt: "auto",
        textAlign: "center",
      }}
    >
      <Typography variant="body2">Version: {__APP_VERSION__}</Typography>
    </Box>
  );
};

export default Footer;
