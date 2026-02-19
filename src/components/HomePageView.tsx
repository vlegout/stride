import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import type { Activity } from "../types";
import ActivityBox from "./ActivityBox";
import { PageHeader, SectionContainer } from "./ui";

interface HomePageViewProps {
  activities: Activity[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const HomePageView = ({ activities, hasMore, isLoadingMore, onLoadMore }: HomePageViewProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Recent Activities" />

      <SectionContainer maxWidth="1000px" centered>
        {activities.map((activity: Activity) => (
          <Box key={activity.id} sx={{ mb: 3 }}>
            <ActivityBox activity={activity} />
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </SectionContainer>

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 4 }}>
          <Button variant="outlined" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {isLoadingMore ? "Loading..." : "Load More Activities"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default HomePageView;
