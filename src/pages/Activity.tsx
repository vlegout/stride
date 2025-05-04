import { Box, Center, Flex, Heading } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import { fetchActivity } from "../api";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import { DataPoint } from "../types";

import LineChart from "../components/LineChart";
import LapChart from "../components/LapChart";
import SportLogo from "../components/SportLogo";

const ActivityComponent = () => {
  const params = useParams();

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activityId"],
    queryFn: async () => fetchActivity(params.id as string),
  });

  if (isPending || isFetching || error) return "Loading...";

  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

  const labels = data.data_points.map((point: DataPoint) => point.distance / 1000);
  const speedData = data.data_points.map((point: DataPoint) => point.speed);
  const hrData = data.data_points.map((point: DataPoint) => point.heart_rate);
  const altitudeData = data.data_points.map((point: DataPoint) => point.altitude);
  const powerData = data.data_points.map((point: DataPoint) => point.power);

  return (
    <Box>
      <Flex>
        <Box padding="10px" width="50vw">
          <Box>
            <Heading>{data.title}</Heading>
            <Flex>
              <Box marginRight="10px" marginLeft="10px">
                <SportLogo sport={data.sport} />
              </Box>
              <Center h="40px">{formatDateTime(data.start_time)}</Center>
            </Flex>
            <ul>
              <li>Total Timer Time: {formatDuration(data.total_timer_time)}</li>
              <li>Total Elapsed Time: {formatDuration(data.total_elapsed_time)}</li>
              <li>Total Distance: {formatDistance(data.total_distance)}</li>
              <li>Total Ascent: {data.total_ascent}</li>
              <li>Total Calories: {data.total_calories}</li>
              <li>Total Training Effect: {data.total_training_effect}</li>
              <li>Average Speed: {formatSpeed(data.average_speed)}</li>
            </ul>
          </Box>
          <Box maxWidth="500px">
            <LapChart laps={data.laps} />
          </Box>
        </Box>

        <Box padding="10px" width="50vw">
          <MapContainer
            bounds={[
              [data.lat - data.delta_lat, data.lon - data.delta_lon],
              [data.lat + data.delta_lat, data.lon + data.delta_lon],
            ]}
            style={{ height: "500px", width: "500px" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={data.trace_points} />
          </MapContainer>
        </Box>
      </Flex>
      <Flex justifyContent="center" paddingTop="20px" flexDirection="column" alignItems="center">
        <Box width="80%" margin="40px" maxWidth="800px">
          <LineChart labels={labels} data={speedData} />
        </Box>
        <Box width="80%" margin="40px" maxWidth="800px">
          <LineChart labels={labels} data={hrData} />
        </Box>
        <Box width="80%" margin="40px" maxWidth="800px">
          <LineChart labels={labels} data={altitudeData} />
        </Box>
        <Box width="80%" margin="40px" maxWidth="800px">
          <LineChart labels={labels} data={powerData} />
        </Box>
      </Flex>
    </Box>
  );
};

export default ActivityComponent;
