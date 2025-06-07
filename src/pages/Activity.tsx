import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { fetchActivity } from "../api";
import { TracePoint } from "../types";

import LineChart from "../components/LineChart";
import LapChart from "../components/LapChart";
import Performances from "../components/Performances";
import ActivityBox from "../components/ActivityBox";

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
        <Box marginTop="20px" marginBottom="20px">
          <ActivityBox activity={data} isDetailed={true} />
          <Box maxWidth="500px">
            <LapChart laps={data.laps} />
          </Box>
        </Box>
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
