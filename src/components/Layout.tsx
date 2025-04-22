import { Outlet } from "react-router-dom";

import { Grid } from "@chakra-ui/react";

const Layout = () => {
  return (
    <Grid>
      <main>
        <Outlet />
      </main>
    </Grid>
  );
};

export default Layout;
