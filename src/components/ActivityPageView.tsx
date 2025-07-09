import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import ActivityBox from "./ActivityBox";
import LapChart from "./LapChart";
import Performances from "./Performances";
import PowerPerformances from "./PowerPerformances";
import ActivityCharts from "./ActivityCharts";
import ActivityZones from "./ActivityZones";

import { SectionContainer } from "./ui";
import { processTracePointData } from "../utils";
import { Activity } from "../types";
import { useActivityZones } from "../hooks";

interface ActivityPageViewProps {
  data: Activity;
}

const ActivityPageView = ({ data }: ActivityPageViewProps) => {
  const { data: zonesData } = useActivityZones(data.id.toString());

  if (!data || !data.tracepoints || data.tracepoints.length === 0) {
    return null;
  }

  const chartData = processTracePointData(data.tracepoints);

  return (
    <Box sx={{ width: "100%" }}>
      <SectionContainer spacing="compact">
        <ActivityBox activity={data} isDetailed={true} />
      </SectionContainer>

      <SectionContainer maxWidth={{ xs: "100%", sm: "600px", md: "500px" }} centered>
        <LapChart laps={data.laps} sport={data.sport} />
      </SectionContainer>

      <SectionContainer maxWidth={{ xs: "100%", sm: "500px", md: "400px" }} centered>
        <Performances performances={data.performances} />
      </SectionContainer>

      {data.sport === "cycling" && (
        <SectionContainer maxWidth="100%" spacing="compact">
          <PowerPerformances performances={data.performance_power} />
        </SectionContainer>
      )}

      {zonesData && (
        <Box sx={{ width: "100%", px: 2 }}>
          <Grid container spacing={2} sx={{ justifyContent: "center", maxWidth: "1200px", margin: "0 auto" }}>
            {zonesData.heartRate && zonesData.heartRate.length > 0 && (
              <Grid size={{ xs: 12, md: 4 }}>
                <SectionContainer maxWidth="100%" centered>
                  <ActivityZones zones={zonesData.heartRate} title="Heart Rate Zones" />
                </SectionContainer>
              </Grid>
            )}

            {zonesData.power && zonesData.power.length > 0 && data.sport === "cycling" && (
              <Grid size={{ xs: 12, md: 4 }}>
                <SectionContainer maxWidth="100%" centered>
                  <ActivityZones zones={zonesData.power} title="Power Zones" />
                </SectionContainer>
              </Grid>
            )}

            {zonesData.pace && zonesData.pace.length > 0 && data.sport === "running" && (
              <Grid size={{ xs: 12, md: 4 }}>
                <SectionContainer maxWidth="100%" centered>
                  <ActivityZones zones={zonesData.pace} title="Pace Zones" />
                </SectionContainer>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      <ActivityCharts chartData={chartData} />
    </Box>
  );
};

export default ActivityPageView;
