import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchCurrentUser, updateUser } from "../api";
import QueryBoundary from "../components/QueryBoundary";
import { PageHeader, DataTable, SectionContainer, Column } from "../components/ui";
import { useAuthStore } from "../store";
import type { User } from "../types";

const Settings = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const query = useQuery({
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

  const handleMapChange = (mapProvider: "leaflet" | "openlayers" | "mapbox"): void => {
    updateUserMutation.mutate({ map: mapProvider });
  };

  const handleSportToggle = (
    sport: "running_enabled" | "cycling_enabled" | "swimming_enabled",
    value: boolean,
  ): void => {
    updateUserMutation.mutate({ [sport]: value });
  };

  return (
    <QueryBoundary query={query} loadingMessage="Loading settings...">
      {(user) => {
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

        const sports = [
          { key: "running_enabled" as const, label: "Running" },
          { key: "cycling_enabled" as const, label: "Cycling" },
          { key: "swimming_enabled" as const, label: "Swimming" },
        ];
        const enabledCount = sports.filter(({ key }) => user[key]).length;

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
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Enabled Sports
                </Typography>
                {sports.map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        checked={user[key]}
                        onChange={(e) => handleSportToggle(key, e.target.checked)}
                        disabled={updateUserMutation.isPending || (user[key] && enabledCount === 1)}
                      />
                    }
                    label={label}
                    sx={{ display: "block" }}
                  />
                ))}
              </Box>
            </SectionContainer>
          </Box>
        );
      }}
    </QueryBoundary>
  );
};

export default Settings;
