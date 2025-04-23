import axios from "axios";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Box } from "@chakra-ui/react";

import type { Activity } from "../types";

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    axios
      .get("/activities.json")
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
            <li>
              Start Time:{" "}
              {DateTime.fromSQL(activity.start_time).toLocaleString(
                DateTime.DATETIME_MED_WITH_SECONDS,
              )}
            </li>
            <li>Total Elapsed Time: {activity.total_elapsed_time}</li>
            <li>Total Timer Time: {activity.total_timer_time}</li>
            <li>Total Distance: {activity.total_distance}</li>
            <li>Average Speed: {activity.average_speed}</li>
          </ul>
        </div>
      ))}
    </Box>
  );
};

export default Home;
