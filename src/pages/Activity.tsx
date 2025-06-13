import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";
import Box from "@mui/material/Box";

import { fetchActivity } from "../api";
import { TracePoint } from "../types";

import LineChart from "../components/LineChart";
import LapChart from "../components/LapChart";
import Performances from "../components/Performances";
import ActivityBox from "../components/ActivityBox";
import LoadingIndicator from "../components/LoadingIndicator";
import { SectionContainer } from "../components/ui";

const ActivityPage = () => {
  const params = useParams();

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activityId"],
    queryFn: async () => fetchActivity(params.id as string),
  });

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activity..." />;
  }

  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

  const tracePoints: TracePoint[] = data?.tracepoints ?? [];
  const labels = tracePoints.map((point: TracePoint) => point.distance / 1000);
  const speedData = tracePoints.map((point: TracePoint) => point.speed);
  const hrData = tracePoints.map((point: TracePoint) => point.heart_rate);
  const altitudeData = tracePoints.map((point: TracePoint) => point.altitude);
  const powerData = tracePoints.map((point: TracePoint) => point.power);

  return (
    <Box sx={{ width: "100%" }}>
      <SectionContainer spacing="compact">
        <ActivityBox activity={data} isDetailed={true} />
      </SectionContainer>

      <SectionContainer maxWidth={{ xs: "100%", sm: "600px", md: "500px" }} centered>
        <LapChart laps={data.laps} />
      </SectionContainer>

      <SectionContainer maxWidth={{ xs: "100%", sm: "500px", md: "400px" }} centered>
        <Performances performances={data.performances} />
      </SectionContainer>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, sm: 4 },
          alignItems: "center",
        }}
      >
        <SectionContainer maxWidth={{ xs: "100%", sm: "90%", md: "800px" }} centered>
          <LineChart labels={labels} data={speedData} />
        </SectionContainer>

        <SectionContainer maxWidth={{ xs: "100%", sm: "90%", md: "800px" }} centered>
          <LineChart labels={labels} data={hrData} />
        </SectionContainer>

        <SectionContainer maxWidth={{ xs: "100%", sm: "90%", md: "800px" }} centered>
          <LineChart labels={labels} data={altitudeData} />
        </SectionContainer>

        <SectionContainer maxWidth={{ xs: "100%", sm: "90%", md: "800px" }} centered>
          <LineChart labels={labels} data={powerData} />
        </SectionContainer>
      </Box>
    </Box>
  );
};

export default ActivityPage;
