import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import HomePageView from "../components/HomePageView";
import { useHomeActivities } from "../hooks";

const Home = ({ race = false }: { race?: boolean }) => {
  const { data, error, isPending, isFetching, refetch } = useHomeActivities(race);

  if (isPending || isFetching) {
    return <LoadingState message="Loading activities..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return <HomePageView activities={data.activities} race={race} />;
};

export default Home;
