import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ActivitiesTable from "./ActivitiesTable";
import type { Sport } from "../types";
import { PageHeader, FormField, SelectOption } from "./ui";

interface ActivitiesPageViewProps {
  sport: Sport | undefined;
  distance: [number, number];
  race: boolean;
  onSportChange: (sport: Sport | undefined) => void;
  onDistanceChange: (distance: [number, number]) => void;
  onRaceChange: (race: boolean) => void;
}

const ActivitiesPageView = ({
  sport,
  distance,
  race,
  onSportChange,
  onDistanceChange,
  onRaceChange,
}: ActivitiesPageViewProps) => {
  const sportOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "cycling", label: "Cycling" },
    { value: "running", label: "Running" },
    { value: "swimming", label: "Swimming" },
  ];

  const handleDistanceChange = (_event: React.SyntheticEvent | Event, value: number | number[]): void => {
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      onDistanceChange([value[0], value[1]]);
    } else {
      console.warn("Invalid distance range value received:", value);
    }
  };

  const handleSportChange = (value: unknown): void => {
    if (typeof value === "string") {
      if (value === "") {
        onSportChange(undefined);
      } else if (value === "cycling" || value === "running" || value === "swimming") {
        onSportChange(value as Sport);
      } else {
        console.warn("Invalid sport value received:", value);
      }
    } else {
      console.warn("Sport value must be a string, received:", typeof value);
    }
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
            onChange={handleSportChange}
            options={sportOptions}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: "flex", alignItems: "center" }}>
          <FormField
            type="checkbox"
            label="Race"
            checkboxProps={{
              checked: race,
              onChange: (e) => onRaceChange(e.target.checked),
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

export default ActivitiesPageView;
