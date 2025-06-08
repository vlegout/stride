import { useState } from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { colors } from "../colors";

const menus = [
  { to: "/", label: "Home" },
  { to: "/activities", label: "Activities" },
  { to: "/profile", label: "Profile" },
  { to: "/races", label: "Races" },
  { to: "/upload", label: "Upload" },
];

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: colors.primarySoft, color: colors.text.onLight }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <img
              src="/logo.svg"
              alt="Logo"
              style={{
                height: isMobile ? "28px" : "32px",
                width: "auto",
              }}
            />
          </Box>

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
                sx={{ color: colors.text.onLight }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {menus.map(({ to, label }) => (
                  <MenuItem key={to} onClick={handleMenuClose}>
                    <Link
                      to={to}
                      style={{
                        textDecoration: "none",
                        color: colors.text.primary,
                        width: "100%",
                      }}
                    >
                      {label}
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {menus.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      textDecoration: "none",
                      color: colors.text.onLight,
                    }}
                  >
                    <Typography
                      component="div"
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        transition: "background-color 0.2s",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      {label}
                    </Typography>
                  </Link>
                ))}
              </Box>
              <Box sx={{ marginLeft: "auto" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.onLight,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  Version: {__APP_VERSION__}
                </Typography>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
