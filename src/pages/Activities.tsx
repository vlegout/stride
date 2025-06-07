import { useState } from "react";
import { FormControl, InputLabel, MenuItem, Slider, FormControlLabel, Checkbox } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import ActivitiesTable from "../components/ActivitiesTable";

const ActivitiesPage = () => {
  const [page, setPage] = useState<number>(1);
  const [sport, setSport] = useState<string>("");
  const [distance, setDistance] = useState<number[]>([0, 100]);
  const [race, setRace] = useState<boolean>(false);

  const handleChange = (event: SelectChangeEvent) => {
    setSport(event.target.value);
  };

  const handleDistanceChange = (_event: React.SyntheticEvent | Event, value: number[]) => {
    setDistance(value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRace(event.target.checked);
  };

  return (
    <Box paddingLeft={"20px"} paddingRight="20px">
      <Grid container spacing={2} marginTop="20px" marginBottom="20px">
        <Grid size={3}>
          <FormControl fullWidth>
            <InputLabel id="activities-sport">Sport</InputLabel>
            <Select labelId="activities-sport" value={sport} label="Sport" onChange={handleChange}>
              <MenuItem value={""}>All</MenuItem>
              <MenuItem value={"cycling"}>Cycling</MenuItem>
              <MenuItem value={"running"}>Running</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={2} display="flex" alignItems="center">
          <FormControlLabel control={<Checkbox checked={race} onChange={handleRaceChange} />} label="Race" />
        </Grid>
        <Grid size={7}>
          <FormControl fullWidth>
            Distance
            <Box marginLeft="10px" marginRight="10px">
              <Slider
                getAriaLabel={() => "Minimum distance"}
                value={distance}
                onChangeCommitted={handleDistanceChange}
                valueLabelDisplay="auto"
                disableSwap
                min={0}
                max={100}
              />
            </Box>
          </FormControl>
        </Grid>
      </Grid>
      <ActivitiesTable sport={sport} distance={distance} race={race} page={page} onPageChange={handlePageChange} />
    </Box>
  );
};

export default ActivitiesPage;
