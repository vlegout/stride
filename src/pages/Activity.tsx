import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

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
    <Container>
      <Box maxWidth="1000px" margin="auto">
        <Grid container spacing={2} marginTop="20px" marginBottom="20px">
          <Grid size={6}>
            <Box>
              <Typography variant="h5">{data.title}</Typography>
              <Grid container spacing={1} marginTop="10px" marginBottom="10px">
                <Grid size={1}>
                  <SportLogo sport={data.sport} />
                </Grid>
                <Grid size={11} display="flex" alignItems="center">
                  {formatDateTime(data.start_time)}
                </Grid>
              </Grid>
              <TableContainer component={Paper}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={2}>{data.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Timer Time: {formatDuration(data.total_timer_time)}</TableCell>
                      <TableCell>Elapsed Time: {formatDuration(data.total_elapsed_time)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Distance: {formatDistance(data.total_distance)}</TableCell>
                      <TableCell>Average Speed: {formatSpeed(data.avg_speed)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Avg Heart Rate: {data.avg_heart_rate}</TableCell>
                      <TableCell>Max Heart Rate: {data.max_heart_rate}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Calories: {data.total_calories}</TableCell>
                      <TableCell>Training Effect: {data.total_training_effect}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Device: {data.device}</TableCell>
                      <TableCell>Ascent: {data.total_ascent}m</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box maxWidth="500px">
              <LapChart laps={data.laps} />
            </Box>
          </Grid>

          <Grid size={6}>
            <Map
              bounds={[
                [data.lat - data.delta_lat, data.lon - data.delta_lon],
                [data.lat + data.delta_lat, data.lon + data.delta_lon],
              ]}
              points={data.tracepoints}
            />
          </Grid>
        </Grid>
        <Container>
          <Box maxWidth="400px">
            <Performances performances={data.performances} />
          </Box>
        </Container>
        <Container>
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
        </Container>
      </Box>
    </Container>
  );
};

export default ActivityPage;
