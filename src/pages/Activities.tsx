import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import ActivitiesTable from "../components/ActivitiesTable";
import { useActivitiesStore } from "../store";
import type { Sport } from "../types";
import { PageHeader, FormField, SelectOption } from "../components/ui";

const ActivitiesPage = () => {
  const { sport, distance, race, setSport, setDistance, setRace } = useActivitiesStore();

  const sportOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "cycling", label: "Cycling" },
    { value: "running", label: "Running" },
  ];

  const handleDistanceChange = (_event: React.SyntheticEvent | Event, value: number | number[]) => {
    setDistance(value as [number, number]);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Activities" />

      <Grid
        container
        spacing={{ xs: 2, sm: 2, md: 2 }}
        sx={{
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: "column", sm: "column", md: "row" },
        }}
      >
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormField
            type="select"
            label="Sport"
            value={sport ?? ""}
            onChange={(value) => setSport(value === "" ? undefined : (value as Sport))}
            options={sportOptions}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: "flex", alignItems: "center" }}>
          <FormField
            type="checkbox"
            label="Race"
            checkboxProps={{
              checked: race,
              onChange: (e) => setRace(e.target.checked),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 7 }}>
          <FormField
            type="slider"
            label="Distance"
            value={distance}
            sliderProps={{
              min: 0,
              max: 100,
              valueLabelDisplay: "auto",
              onChangeCommitted: handleDistanceChange,
            }}
          />
        </Grid>
      </Grid>
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <ActivitiesTable />
      </Box>
    </Box>
  );
};

export default ActivitiesPage;
