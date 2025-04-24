import axios from "axios";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";

import type { Activity } from "../types";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    axios
      .get("/last.json")
      .then((response) => {
        setActivities(response.data.activities);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  return (
    <Box>
      {activities.map((activity) => (
        <div key={activity.id}>
          <ul>
            <li>Title: {activity.title}</li>
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
