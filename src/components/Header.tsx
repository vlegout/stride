import { useState } from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { colors } from "../colors";
import { useAuthStore } from "../store";

const menus = [
  { to: "/", label: "Home" },
  { to: "/activities", label: "Activities" },
  { to: "/weeks", label: "Weeks" },
  { to: "/races", label: "Races" },
  { to: "/fitness", label: "Fitness" },
  { to: "/best", label: "Best" },
];

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { logout, user } = useAuthStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: colors.primarySoft, color: colors.text.onLight }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img
                src="/logo.svg"
                alt="Logo"
                style={{
                  height: isMobile ? "28px" : "32px",
                  width: "auto",
                  cursor: "pointer",
                }}
              />
            </Link>
          </Box>

          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <Link to="/upload" style={{ textDecoration: "none" }}>
                <IconButton edge="end" color="inherit" aria-label="upload" sx={{ color: colors.text.onLight, mr: 1 }}>
                  <AddIcon />
                </IconButton>
              </Link>
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
                <MenuItem onClick={handleMenuClose}>
                  <Link
                    to="/settings"
                    style={{
                      textDecoration: "none",
                      color: colors.text.primary,
                      width: "100%",
                    }}
                  >
                    Settings
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon />
                </MenuItem>
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
              <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
                <Link to="/upload" style={{ textDecoration: "none" }}>
                  <IconButton
                    color="inherit"
                    aria-label="upload"
                    sx={{
                      color: colors.text.onLight,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Link>
                {user && (
                  <>
                    {user.google_picture && (
                      <Avatar
                        src={user.google_picture}
                        alt={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                        sx={{ width: 32, height: 32 }}
                      />
                    )}
                    <Link to="/profile" style={{ textDecoration: "none" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.text.onLight,
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </Typography>
                    </Link>
                    <Link to="/settings" style={{ textDecoration: "none" }}>
                      <IconButton
                        color="inherit"
                        aria-label="settings"
                        sx={{
                          color: colors.text.onLight,
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        }}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Link>
                  </>
                )}
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: colors.text.onLight,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <LogoutIcon />
                </IconButton>
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
