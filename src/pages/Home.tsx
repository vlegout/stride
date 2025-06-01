import { Box, Center, Flex, Heading, Separator } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import { fetchActivities } from "../api";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

import Map from "../components/Map";
import SportLogo from "../components/SportLogo";

const Home = ({ race = false }: { race?: boolean }) => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["", [0, 100], true, 5, race],
    queryFn: fetchActivities,
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Flex justifyContent="center">
      <Box maxWidth="1000px">
        {data.map((activity) => (
          <Box key={activity.id} paddingTop="10px">
            <Flex>
              <Box>
                <Heading>
                  <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                </Heading>
                <Flex paddingTop="20px">
                  <Box marginRight="10px" marginLeft="10px">
                    <SportLogo sport={activity.sport} />
                  </Box>
                  <Center h="40px">{formatDateTime(activity.start_time)}</Center>
                </Flex>
                <TableContainer component={Paper}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={2}>{activity.location}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Timer Time: {formatDuration(activity.total_timer_time)}</TableCell>
                        <TableCell>Elapsed Time: {formatDuration(activity.total_elapsed_time)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Distance: {formatDistance(activity.total_distance)}</TableCell>
                        <TableCell>Average Speed: {formatSpeed(activity.avg_speed)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Avg Heart Rate: {activity.avg_heart_rate}</TableCell>
                        <TableCell>Max Heart Rate: {activity.max_heart_rate}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Calories: {activity.total_calories}</TableCell>
                        <TableCell>Training Effect: {activity.total_training_effect}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Device: {activity.device}</TableCell>
                        <TableCell>Ascent: {activity.total_ascent} m</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box padding="10px">
                <Map
                  bounds={[
                    [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
                    [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
                  ]}
                  points={activity.tracepoints}
                />
              </Box>
            </Flex>
            <Separator size="lg" />
          </Box>
        ))}
      </Box>
    </Flex>
  );
};

export default Home;
