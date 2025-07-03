import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchCurrentUser } from "../api";
import LoadingIndicator from "../components/LoadingIndicator";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";

const Settings = () => {
  const {
    data: user,
    error,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading settings..." />;
  }

  const userInfoColumns: Column[] = [
    {
      id: "field",
      label: "Field",
      width: "40%",
    },
    {
      id: "value",
      label: "Value",
      width: "60%",
    },
  ];

  const userInfoRows = [
    { id: 1, field: "First Name", value: user.first_name },
    { id: 2, field: "Last Name", value: user.last_name },
    { id: 3, field: "Email", value: user.email },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Settings" />

      <SectionContainer maxWidth={{ xs: "100%", sm: "600px", md: "800px" }} centered variant="paper">
        <DataTable
          columns={userInfoColumns}
          rows={userInfoRows}
          minWidth={isMobile ? 300 : 650}
          responsive
          showHeader={false}
        />
      </SectionContainer>
    </Box>
  );
};

export default Settings;
