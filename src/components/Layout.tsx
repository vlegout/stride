import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

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
      <Box
        component="main"
        sx={{
          width: "100%",
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 2, sm: 3 },
          flexGrow: 1,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 0, sm: 1, md: 2 },
            maxWidth: { xs: "100%", sm: "100%", md: "1200px" },
          }}
        >
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
