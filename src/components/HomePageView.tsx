import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { Activity } from "../types";
import ActivityBox from "./ActivityBox";
import { PageHeader, SectionContainer } from "./ui";

interface HomePageViewProps {
  activities: Activity[];
}

const HomePageView = ({ activities }: HomePageViewProps) => {
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
    </Box>
  );
};

export default HomePageView;
