import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
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

import { colors, shadows, gradients } from "../colors";
import { useAuthStore } from "../store";

const menus = [
  { to: "/", label: "Home" },
  { to: "/activities", label: "Activities" },
  { to: "/weeks", label: "Weeks" },
  { to: "/fitness", label: "Fitness" },
  { to: "/best", label: "Best" },
  { to: "/heatmap", label: "Heatmap" },
];

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { logout, user } = useAuthStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    logout();
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: gradients.primarySubtle,
          color: colors.text.onLight,
          boxShadow: shadows.header,
          borderBottom: `1px solid ${colors.grey[200]}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img
                src="/logo.svg"
                alt="Stride home"
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
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      boxShadow: shadows.lg,
                      borderRadius: 2,
                      border: `1px solid ${colors.grey[200]}`,
                      backdropFilter: "blur(8px)",
                      bgcolor: "rgba(255, 255, 255, 0.95)",
                    },
                  },
                }}
              >
                {menus.map(({ to, label }) => (
                  <MenuItem key={to} onClick={handleMenuClose}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      style={({ isActive }) => ({
                        textDecoration: "none",
                        color: isActive ? colors.primary : colors.text.primary,
                        fontWeight: isActive ? 700 : undefined,
                        width: "100%",
                      })}
                    >
                      {label}
                    </NavLink>
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
                <MenuItem onClick={handleLogout} aria-label="log out">
                  <LogoutIcon />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {menus.map(({ to, label }) => (
                  <NavLink key={to} to={to} end={to === "/"} style={{ textDecoration: "none", color: colors.text.onLight }}>
                    {({ isActive }) => (
                      <Typography
                        component="div"
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          fontWeight: isActive ? 700 : 400,
                          boxShadow: isActive ? `inset 0 -3px 0 ${colors.primary}` : "none",
                          transition: "background-color 0.2s",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        }}
                      >
                        {label}
                      </Typography>
                    )}
                  </NavLink>
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
                  aria-label="log out"
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
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
