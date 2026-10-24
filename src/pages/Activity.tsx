import { useParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  BarElement,
  LinearScale,
  Tooltip,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";

import Box from "@mui/material/Box";
import { SkeletonStats, SkeletonChart } from "../components/ui/Skeleton";
import QueryBoundary from "../components/QueryBoundary";
import ActivityPageView from "../components/ActivityPageView";

import { useActivityData } from "../hooks";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Filler);

const ActivityPage = () => {
  const params = useParams();
  const query = useActivityData(params.id as string);

  return (
    <QueryBoundary
      query={query}
      loadingMessage="Loading activity..."
      skeleton={
        <Box sx={{ p: 2, display: "grid", gap: 2 }}>
          <SkeletonStats />
          <SkeletonChart />
          <SkeletonChart />
        </Box>
      }
    >
      {(data) => <ActivityPageView data={data} />}
    </QueryBoundary>
  );
};

export default ActivityPage;
