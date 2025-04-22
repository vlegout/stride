import { Outlet } from "react-router-dom";
import { Grid } from "@chakra-ui/react";

import Header from "../components/Header";

const Layout = () => {
  return (
    <Grid>
      <main>
        <Header />
        <Outlet />
      </main>
    </Grid>
  );
};

export default Layout;
