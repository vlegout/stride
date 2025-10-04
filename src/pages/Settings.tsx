import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchCurrentUser, updateUser } from "../api";
import LoadingIndicator from "../components/LoadingIndicator";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";
import { useAuthStore } from "../store";
import type { User } from "../types";

const Settings = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const {
    data: user,
    error,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["currentUser"], updatedUser);
      setUser(updatedUser);
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading settings..." />;
  }

  const handleMapChange = (mapProvider: "leaflet" | "openlayers" | "mapbox"): void => {
    updateUserMutation.mutate({ map: mapProvider });
  };

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
        <FormControl fullWidth sx={{ mt: 3 }}>
          <InputLabel id="map-provider-label">Map Provider</InputLabel>
          <Select
            labelId="map-provider-label"
            value={user.map}
            label="Map Provider"
            onChange={(e) => handleMapChange(e.target.value as "leaflet" | "openlayers" | "mapbox")}
            disabled={updateUserMutation.isPending}
          >
            <MenuItem value="leaflet">Leaflet</MenuItem>
            <MenuItem value="openlayers">OpenLayers</MenuItem>
            <MenuItem value="mapbox">Mapbox</MenuItem>
          </Select>
        </FormControl>
      </SectionContainer>
    </Box>
  );
};

export default Settings;
