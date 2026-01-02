import { useParams } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import QueryBoundary from "../components/QueryBoundary";
import ActivityPageView from "../components/ActivityPageView";

import { useActivityData } from "../hooks";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

const ActivityPage = () => {
  const params = useParams();
  const query = useActivityData(params.id as string);

  return (
    <QueryBoundary query={query} loadingMessage="Loading activity...">
      {(data) => <ActivityPageView data={data} />}
    </QueryBoundary>
  );
};

export default ActivityPage;
