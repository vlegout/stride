import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

import { fetchActivities, createActivitiesQueryKey } from "../api";
import { Activity, ActivitiesQueryParams } from "../types";

import ActivityBox from "../components/ActivityBox";
import LoadingIndicator from "../components/LoadingIndicator";
import { PageHeader, SectionContainer } from "../components/ui";

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
    <Box sx={{ width: "100%" }}>
      <PageHeader
        title={race ? "Recent Races" : "Recent Activities"}
        subtitle="Your latest fitness activities"
        centered
      />

      <SectionContainer maxWidth="1000px" centered>
        {data.activities.map((activity: Activity) => (
          <Box key={activity.id} sx={{ mb: 3 }}>
            <ActivityBox activity={activity} />
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </SectionContainer>
    </Box>
  );
};

export default Home;
