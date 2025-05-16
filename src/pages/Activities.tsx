import { useState } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FormControl, InputLabel, MenuItem, Slider } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { fetchActivities } from "../api";
import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import SportLogo from "../components/SportLogo";

const ActivitiesComponent = () => {
  const [sport, setSport] = useState("all");
  const [distance, setDistance] = useState<number[]>([1, 100]);

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: [sport, distance],
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
    <Flex justifyContent="center">
      <Box>
        <Flex marginBottom="10px">
          <Box flex="1" marginRight="10px">
            <FormControl fullWidth>
              <InputLabel id="activities-sport">Age</InputLabel>
              <Select labelId="activities-sport" value={sport} label="Age" onChange={handleChange}>
                <MenuItem value={"all"}>All</MenuItem>
                <MenuItem value={"cycling"}>Cycling</MenuItem>
                <MenuItem value={"running"}>Running</MenuItem>
                <MenuItem value={"swimming"}>Swimming</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box flex="1" marginLeft="10px">
            <FormControl fullWidth>
              Distance
              <Box marginLeft="10px" marginRight="10px">
                <Slider
                  getAriaLabel={() => "Minimum distance"}
                  value={distance}
                  onChangeCommitted={handleDistanceChange}
                  valueLabelDisplay="auto"
                  disableSwap
                  min={5}
                  max={100}
                />
              </Box>
            </FormControl>
          </Box>
        </Flex>
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
              {data.map((activity) => (
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
                  <TableCell>{formatSpeed(activity.average_speed)}</TableCell>
                  <TableCell>{activity.total_ascent}</TableCell>
                  <TableCell>{activity.total_calories}</TableCell>
                  <TableCell>{activity.total_training_effect}</TableCell>
                  <TableCell>{activity.device}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Flex>
  );
};

export default ActivitiesComponent;
