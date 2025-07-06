import LoadingIndicator from "../components/LoadingIndicator";
import HomePageView from "../components/HomePageView";
import { useHomeActivities } from "../hooks";

const Home = () => {
  const { data, error, isPending, isFetching } = useHomeActivities();

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activities..." />;
  }

  return <HomePageView activities={data.activities} />;
};

export default Home;
