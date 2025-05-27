import { Box, Center, Flex, Heading, Separator, Table } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchActivities } from "../api";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

import Map from "../components/Map";
import SportLogo from "../components/SportLogo";

const Home = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["all", [0, 10000], true, 5],
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
                <Table.Root marginTop="10px">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell colSpan={2}>{activity.location}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Timer Time: {formatDuration(activity.total_timer_time)}</Table.Cell>
                      <Table.Cell>Elapsed Time: {formatDuration(activity.total_elapsed_time)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Distance: {formatDistance(activity.total_distance)}</Table.Cell>
                      <Table.Cell>Average Speed: {formatSpeed(activity.avg_speed)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Avg Heart Rate: {activity.avg_heart_rate}</Table.Cell>
                      <Table.Cell>Max Heart Rate: {activity.max_heart_rate}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Calories: {activity.total_calories}</Table.Cell>
                      <Table.Cell>Training Effect: {activity.total_training_effect}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Device: {activity.device}</Table.Cell>
                      <Table.Cell>Ascent: {activity.total_ascent} m</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
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
