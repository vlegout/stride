import { Link } from "react-router-dom";
import Box from "@mui/material/Box";

const Header = () => {
  return (
    <Box sx={{ bgcolor: "#e0e0e0", display: "flex", alignItems: "center", paddingLeft: "10px", height: "64px" }}>
      <Link to="/" style={{ marginRight: "20px" }}>
        Home
      </Link>
      <Link to="/activities" style={{ marginRight: "20px" }}>
        Activities
      </Link>
      <Link to="/profile" style={{ marginRight: "20px" }}>
        Profile
      </Link>
      <Link to="/races">Races</Link>
    </Box>
  );
};

export default Header;
