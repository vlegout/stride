import LoadingIndicator from "../components/LoadingIndicator";
import HomePageView from "../components/HomePageView";
import { useHomeActivities } from "../hooks";

const Home = ({ race = false }: { race?: boolean }) => {
  const { data, error, isPending, isFetching } = useHomeActivities(race);

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activities..." />;
  }

  return <HomePageView activities={data.activities} race={race} />;
};

export default Home;
