import { Box, Heading, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";

import { fetchActivity } from "../api";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

const ActivityComponent = () => {
  const params = useParams();

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activityId"],
    queryFn: async () => fetchActivity(params.id as string),
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Box>
      <Heading>{data.title}</Heading>
      <Text>{data.description}</Text>
      <ul>
        <li>Sport: {data.sport}</li>
        <li>Start Time: {formatDateTime(data.start_time)}</li>
        <li>Total Timer Time: {formatDuration(data.total_timer_time)}</li>
        <li>Total Elapsed Time: {formatDuration(data.total_elapsed_time)}</li>
        <li>Total Distance: {formatDistance(data.total_distance)}</li>
        <li>Total Ascent: {data.total_ascent}</li>
        <li>Total Calories: {data.total_calories}</li>
        <li>Total Training Effect: {data.total_training_effect}</li>
        <li>Total Aerobic Training Effect: {data.total_aerobic_training_effect}</li>
        <li>Average Speed: {formatSpeed(data.average_speed)}</li>
      </ul>
      <Box padding="10px">
        <MapContainer center={[data.lat, data.lon]} zoom={12} style={{ height: "500px", width: "500px" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={data.points} />
        </MapContainer>
      </Box>
    </Box>
  );
};

export default ActivityComponent;
