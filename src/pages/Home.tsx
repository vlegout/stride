import { Box, Heading, Separator, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

import { fetchLastActivities } from "../api";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

const Home = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["lastActivitiesId"],
    queryFn: async () => fetchLastActivities(),
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Box>
      {data.map((activity) => (
        <Box key={activity.id} paddingTop="10px">
          <Heading>
            <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
          </Heading>
          <Text>{activity.description}</Text>
          <ul>
            <li>Sport: {activity.sport}</li>
            <li>Start Time: {formatDateTime(activity.start_time)}</li>
            <li>Total Timer Time: {formatDuration(activity.total_timer_time)}</li>
            <li>Total Elapsed Time: {formatDuration(activity.total_elapsed_time)}</li>
            <li>Total Distance: {formatDistance(activity.total_distance)}</li>
            <li>Total Ascent: {activity.total_ascent}</li>
            <li>Total Calories: {activity.total_calories}</li>
            <li>Total Training Effect: {activity.total_training_effect}</li>
            <li>Average Speed: {formatSpeed(activity.average_speed)}</li>
          </ul>
          <Box padding="10px">
            <MapContainer center={[activity.lat, activity.lon]} zoom={12} style={{ height: "500px", width: "500px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={activity.trace_points} />
            </MapContainer>
          </Box>
          <Separator size="lg" />
        </Box>
      ))}
    </Box>
  );
};

export default Home;
