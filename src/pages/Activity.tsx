import { Box, Center, Flex, Heading, Table } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import { fetchActivity } from "../api";
import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import { TracePoint } from "../types";

import Map from "../components/Map";
import LineChart from "../components/LineChart";
import LapChart from "../components/LapChart";
import Performances from "../components/Performances";
import SportLogo from "../components/SportLogo";

const ActivityPage = () => {
  const params = useParams();

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activityId"],
    queryFn: async () => fetchActivity(params.id as string),
  });

  if (isPending || isFetching || error) return "Loading...";

  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

  const tracePoints: TracePoint[] = data?.tracepoints ?? [];
  const labels = tracePoints.map((point: TracePoint) => point.distance / 1000);
  const speedData = tracePoints.map((point: TracePoint) => point.speed);
  const hrData = tracePoints.map((point: TracePoint) => point.heart_rate);
  const altitudeData = tracePoints.map((point: TracePoint) => point.altitude);
  const powerData = tracePoints.map((point: TracePoint) => point.power);

  return (
    <Flex justifyContent="center">
      <Box maxWidth="1000px">
        <Flex>
          <Box padding="10px" width="50vw">
            <Box>
              <Heading>{data.title}</Heading>
              <Flex paddingTop="20px">
                <Box marginRight="10px" marginLeft="10px">
                  <SportLogo sport={data.sport} />
                </Box>
                <Center h="40px">{formatDateTime(data.start_time)}</Center>
              </Flex>
              <Table.Root marginTop="10px">
                <Table.Body>
                  <Table.Row>
                    <Table.Cell colSpan={2}>{data.location}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Timer Time: {formatDuration(data.total_timer_time)}</Table.Cell>
                    <Table.Cell>Elapsed Time: {formatDuration(data.total_elapsed_time)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Distance: {formatDistance(data.total_distance)}</Table.Cell>
                    <Table.Cell>Average Speed: {formatSpeed(data.avg_speed)}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Avg Heart Rate: {data.avg_heart_rate}</Table.Cell>
                    <Table.Cell>Max Heart Rate: {data.max_heart_rate}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Calories: {data.total_calories}</Table.Cell>
                    <Table.Cell>Training Effect: {data.total_training_effect}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Device: {data.device}</Table.Cell>
                    <Table.Cell>Ascent: {data.total_ascent}m</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Box>
            <Box maxWidth="500px" paddingTop="20px">
              <LapChart laps={data.laps} />
            </Box>
          </Box>

          <Box padding="10px" width="50vw">
            <Map
              bounds={[
                [data.lat - data.delta_lat, data.lon - data.delta_lon],
                [data.lat + data.delta_lat, data.lon + data.delta_lon],
              ]}
              points={data.tracepoints}
            />
          </Box>
        </Flex>
        <Flex justifyContent="center" paddingTop="20px" flexDirection="column" alignItems="center">
          <Box>
            <Performances performances={data.performances} />
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
    </Flex>
  );
};

export default ActivityPage;
