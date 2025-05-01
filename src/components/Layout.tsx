import { Outlet } from "react-router-dom";
import { Box, Grid } from "@chakra-ui/react";

import Header from "../components/Header";

const Layout = () => {
  return (
    <Grid>
      <main>
        <Header />
        <Box>
          <Outlet />
        </Box>
      </main>
    </Grid>
  );
};

export default Layout;
