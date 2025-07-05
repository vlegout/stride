import { useParams } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import LoadingIndicator from "../components/LoadingIndicator";
import ActivityPageView from "../components/ActivityPageView";

import { useActivityData } from "../hooks";

const ActivityPage = () => {
  const params = useParams();
  const { data, error, isPending, isFetching } = useActivityData(params.id as string);

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activity..." />;
  }

  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

  return <ActivityPageView data={data} />;
};

export default ActivityPage;
