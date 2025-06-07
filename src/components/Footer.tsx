import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.200",
        color: "black",
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
