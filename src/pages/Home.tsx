import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { Box } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

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
        <div key={activity.id}>
          <ul>
            <li>
              Title: <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
            </li>
            <li>Description: {activity.description}</li>
            <li>Sport: {activity.sport}</li>
            <li>Start Time: {formatDateTime(activity.start_time)}</li>
            <li>Total Timer Time: {formatDuration(activity.total_timer_time)}</li>
            <li>Total Elapsed Time: {formatDuration(activity.total_elapsed_time)}</li>
            <li>Total Distance: {formatDistance(activity.total_distance)}</li>
            <li>Average Speed: {formatSpeed(activity.average_speed)}</li>
          </ul>
          <MapContainer center={[activity.lat, activity.lon]} zoom={12} style={{ height: "500px", width: "500px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={activity.points} />
          </MapContainer>
        </div>
      ))}
    </Box>
  );
};

export default Home;
