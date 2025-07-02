import Box from "@mui/material/Box";
import ActivityBox from "./ActivityBox";
import LapChart from "./LapChart";
import Performances from "./Performances";
import PowerPerformances from "./PowerPerformances";
import ActivityCharts from "./ActivityCharts";
import { SectionContainer } from "./ui";
import { ProcessedChartData } from "../utils";
import { Activity } from "../types";

interface ActivityPageViewProps {
  data: Activity;
  chartData: ProcessedChartData;
}

const ActivityPageView = ({ data, chartData }: ActivityPageViewProps) => {
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

      <ActivityCharts chartData={chartData} />
    </Box>
  );
};

export default ActivityPageView;
