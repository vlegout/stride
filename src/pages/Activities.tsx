import { Box, Flex } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { fetchActivities } from "../api";

import { formatDateTime, formatDistance, formatSpeed } from "../utils";

const Home = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activitiesId"],
    queryFn: async () => fetchActivities(),
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Flex justifyContent="center" paddingTop="20px">
      <Box maxWidth="1000px">
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Distance</TableCell>
                <TableCell>Average Speed</TableCell>
                <TableCell>Total Ascent</TableCell>
                <TableCell>Calories</TableCell>
                <TableCell>Device</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                  </TableCell>
                  <TableCell>{formatDateTime(activity.start_time)}</TableCell>
                  <TableCell>{formatDistance(activity.total_distance)}</TableCell>
                  <TableCell>{formatSpeed(activity.average_speed)}</TableCell>
                  <TableCell>{activity.total_ascent}</TableCell>
                  <TableCell>{activity.total_calories}</TableCell>
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

export default Home;
