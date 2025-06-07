import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";

import Header from "../components/Header";

const Layout = () => {
  return (
    <Box>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, mb: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
