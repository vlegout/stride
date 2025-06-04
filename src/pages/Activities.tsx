import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FormControl, InputLabel, MenuItem, Slider } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";

import { fetchActivities } from "../api";
import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import SportLogo from "../components/SportLogo";

const ActivitiesPage = () => {
  const [page, setPage] = useState<number>(1);
  const [sport, setSport] = useState<string>("");
  const [distance, setDistance] = useState<number[]>([0, 100]);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: [sport, distance, false, 10, false, page],
    queryFn: fetchActivities,
  });

  const handleChange = (event: SelectChangeEvent) => {
    setSport(event.target.value);
  };

  const handleDistanceChange = (_event: React.SyntheticEvent | Event, value: number[]) => {
    setDistance(value);
  };

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Box paddingLeft={"20px"} paddingRight="20px">
      <Grid container spacing={2} marginTop="20px" marginBottom="20px">
        <Grid size={4}>
          <FormControl fullWidth>
            <InputLabel id="activities-sport">Sport</InputLabel>
            <Select labelId="activities-sport" value={sport} label="Sport" onChange={handleChange}>
              <MenuItem value={""}>All</MenuItem>
              <MenuItem value={"cycling"}>Cycling</MenuItem>
              <MenuItem value={"running"}>Running</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={8}>
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
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Sport</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Distance</TableCell>
              <TableCell>Average Speed</TableCell>
              <TableCell>Total Ascent</TableCell>
              <TableCell>Calories</TableCell>
              <TableCell>Training Effect</TableCell>
              <TableCell>Device</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <SportLogo sport={activity.sport} width={25} />
                </TableCell>
                <TableCell>
                  <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                </TableCell>
                <TableCell>{activity.location}</TableCell>
                <TableCell>{formatDateTime(activity.start_time)}</TableCell>
                <TableCell>{formatDistance(activity.total_distance)}</TableCell>
                <TableCell>{formatSpeed(activity.avg_speed)}</TableCell>
                <TableCell>{activity.total_ascent}</TableCell>
                <TableCell>{activity.total_calories}</TableCell>
                <TableCell>{activity.total_training_effect}</TableCell>
                <TableCell>{activity.device}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box margin={"auto"} marginTop="20px" display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil(data.pagination.total / data.pagination.per_page)}
          shape="rounded"
          page={page}
          onChange={(_event, value) => {
            setPage(value);
          }}
        />
      </Box>
    </Box>
  );
};

export default ActivitiesPage;
