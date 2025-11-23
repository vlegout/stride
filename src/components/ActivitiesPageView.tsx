import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import ActivitiesTable from "./ActivitiesTable";
import type { Sport } from "../types";
import { DistanceRange, Sport as SportValidator } from "../types";
import { PageHeader, FormField, SelectOption } from "./ui";
import { type } from "arktype";

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
    const validated = DistanceRange(value);
    if (validated instanceof type.errors) {
      console.warn("Invalid distance range value received:", value, validated.summary);
      return;
    }
    onDistanceChange(validated);
  };

  const handleSportChange = (value: unknown): void => {
    const validated = SportValidator.or("''")(value);
    if (validated instanceof type.errors) {
      console.warn("Invalid sport value received:", value, validated.summary);
      return;
    }
    onSportChange(validated === "" ? undefined : validated);
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
