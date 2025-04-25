import { Box } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

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
      <div>
        <ul>
          <li>Title: {data.title}</li>
          <li>Description: {data.description}</li>
          <li>Sport: {data.sport}</li>
          <li>Start Time: {formatDateTime(data.start_time)}</li>
          <li>Total Timer Time: {formatDuration(data.total_timer_time)}</li>
          <li>Total Elapsed Time: {formatDuration(data.total_elapsed_time)}</li>
          <li>Total Distance: {formatDistance(data.total_distance)}</li>
          <li>Average Speed: {formatSpeed(data.average_speed)}</li>
        </ul>
      </div>
    </Box>
  );
};

export default ActivityComponent;
