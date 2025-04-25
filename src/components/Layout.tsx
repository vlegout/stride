import { Outlet } from "react-router-dom";
import { Box, Flex, Grid } from "@chakra-ui/react";

import Header from "../components/Header";

const Layout = () => {
  return (
    <Grid>
      <main>
        <Header />
        <Flex justifyContent="center" paddingTop="20px">
          <Box maxWidth="800px">
            <Outlet />
          </Box>
        </Flex>
      </main>
    </Grid>
  );
};

export default Layout;
