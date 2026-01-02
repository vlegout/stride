import QueryBoundary from "../components/QueryBoundary";
import HomePageView from "../components/HomePageView";
import { useHomeActivities } from "../hooks";

const Home = () => {
  const query = useHomeActivities();

  return (
    <QueryBoundary query={query} loadingMessage="Loading activities...">
      {(data) => <HomePageView activities={data.activities} />}
    </QueryBoundary>
  );
};

export default Home;
