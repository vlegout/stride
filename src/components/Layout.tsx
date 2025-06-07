import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";

import Header from "../components/Header";
import Footer from "../components/Footer";

const Layout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />
      <Box component="main" sx={{ flexGrow: 1, mb: 3 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
