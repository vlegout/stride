import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const menus = [
  { to: "/", label: "Home" },
  { to: "/activities", label: "Activities" },
  { to: "/profile", label: "Profile" },
  { to: "/races", label: "Races" },
];

const Header = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: "grey.200", color: "black" }}>
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.svg" alt="Logo" style={{ height: "32px", width: "auto" }} />
          </Box>
          {menus.map(({ to, label }) => (
            <Link key={to} to={to} style={{ textDecoration: "none", color: "black" }}>
              <Typography component="div" sx={{ flexGrow: 1 }} paddingRight="15px">
                {label}
              </Typography>
            </Link>
          ))}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
