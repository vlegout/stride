import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";

import { fetchActivities, createActivitiesQueryKey } from "../api";
import { Activity, ActivitiesQueryParams } from "../types";

import ActivityBox from "../components/ActivityBox";
import LoadingIndicator from "../components/LoadingIndicator";

const Home = ({ race = false }: { race?: boolean }) => {
  const queryParams: ActivitiesQueryParams = {
    sport: "",
    distance: [0, 100],
    fetchMap: true,
    limit: 5,
    race,
    page: 1,
    order: "desc",
    orderBy: "",
  };

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: createActivitiesQueryKey(queryParams),
    queryFn: fetchActivities,
  });

  if (isPending || isFetching || error) {
    return <LoadingIndicator message="Loading activities..." />;
  }

  return (
    <Container>
      <Box maxWidth="1000px" margin="auto">
        {data.activities.map((activity: Activity) => (
          <Box key={activity.id} marginTop="20px" marginBottom={"20px"}>
            <ActivityBox activity={activity} />
            <Divider />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Home;
