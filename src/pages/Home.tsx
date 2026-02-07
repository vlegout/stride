import { Box, Alert, CircularProgress } from "@mui/material";

import HomePageView from "../components/HomePageView";
import { useHomeActivities } from "../hooks";

const Home = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useHomeActivities();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">Error loading activities: {error?.message ?? "Unknown error"}</Alert>
      </Box>
    );
  }

  const allActivities = data?.pages.flatMap((page) => page.activities) ?? [];

  return (
    <HomePageView
      activities={allActivities}
      hasMore={hasNextPage ?? false}
      isLoadingMore={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    />
  );
};

export default Home;
