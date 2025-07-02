import { useParams } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import LoadingIndicator from "../components/LoadingIndicator";
import ActivityPageView from "../components/ActivityPageView";
import { useActivityData } from "../hooks";
import { processTracePointData } from "../utils";
import { TracePoint } from "../types";

const ActivityPage = () => {
  const params = useParams();
  const { data, error, isPending, isFetching } = useActivityData(params.id as string);

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activity..." />;
  }

  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

  const tracePoints: TracePoint[] = data?.tracepoints ?? [];
  const chartData = processTracePointData(tracePoints);

  return <ActivityPageView data={data} chartData={chartData} />;
};

export default ActivityPage;
