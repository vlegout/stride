import { FormControl, InputLabel, MenuItem, Slider, FormControlLabel, Checkbox } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import ActivitiesTable from "../components/ActivitiesTable";
import { useActivitiesStore } from "../store";

const ActivitiesPage = () => {
  const { sport, distance, race, setSport, setDistance, setRace } = useActivitiesStore();

  const handleChange = (event: SelectChangeEvent) => {
    setSport(event.target.value);
  };

  const handleDistanceChange = (_event: React.SyntheticEvent | Event, value: number[]) => {
    setDistance(value as number[]);
  };

  const handleRaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRace(event.target.checked);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid
        container
        spacing={{ xs: 2, sm: 2, md: 2 }}
        sx={{
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: "column", sm: "column", md: "row" },
        }}
      >
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="activities-sport">Sport</InputLabel>
            <Select labelId="activities-sport" value={sport} label="Sport" onChange={handleChange}>
              <MenuItem value={""}>All</MenuItem>
              <MenuItem value={"cycling"}>Cycling</MenuItem>
              <MenuItem value={"running"}>Running</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: "flex", alignItems: "center" }}>
          <FormControlLabel
            control={<Checkbox checked={race} onChange={handleRaceChange} />}
            label="Race"
            sx={{ width: "100%" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 7 }}>
          <FormControl fullWidth>
            <Box sx={{ mb: 1, fontSize: "0.875rem", color: "text.secondary" }}>Distance</Box>
            <Box sx={{ px: { xs: 2, sm: 3 } }}>
              <Slider
                getAriaLabel={() => "Minimum distance"}
                value={distance}
                onChangeCommitted={handleDistanceChange}
                valueLabelDisplay="auto"
                disableSwap
                min={0}
                max={100}
                sx={{
                  "& .MuiSlider-thumb": {
                    width: { xs: 20, sm: 24 },
                    height: { xs: 20, sm: 24 },
                  },
                }}
              />
            </Box>
          </FormControl>
        </Grid>
      </Grid>
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <ActivitiesTable />
      </Box>
    </Box>
  );
};

export default ActivitiesPage;
