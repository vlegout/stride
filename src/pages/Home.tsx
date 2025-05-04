import { Box, Center, Flex, Heading, Separator } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

import { fetchLastActivities } from "../api";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import SportLogo from "../components/SportLogo";

const Home = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["lastActivitiesId"],
    queryFn: async () => fetchLastActivities(),
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Flex justifyContent="center" paddingTop="20px">
      <Box maxWidth="1000px">
        {data.map((activity) => (
          <Box key={activity.id} paddingTop="10px">
            <Heading>
              <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
            </Heading>
            <Flex>
              <Box marginRight="10px" marginLeft="10px">
                <SportLogo sport={activity.sport} />
              </Box>
              <Center h="40px">{formatDateTime(activity.start_time)}</Center>
            </Flex>
            <ul>
              <li>Total Timer Time: {formatDuration(activity.total_timer_time)}</li>
              <li>Total Elapsed Time: {formatDuration(activity.total_elapsed_time)}</li>
              <li>Total Distance: {formatDistance(activity.total_distance)}</li>
              <li>Total Ascent: {activity.total_ascent}</li>
              <li>Total Calories: {activity.total_calories}</li>
              <li>Total Training Effect: {activity.total_training_effect}</li>
              <li>Average Speed: {formatSpeed(activity.average_speed)}</li>
            </ul>
            <Box padding="10px">
              <MapContainer
                bounds={[
                  [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
                  [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
                ]}
                style={{ height: "500px", width: "500px" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={activity.trace_points} />
              </MapContainer>
            </Box>
            <Separator size="lg" />
          </Box>
        ))}
      </Box>
    </Flex>
  );
};

export default Home;
