import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";

import { fetchActivities } from "../api";
import { Activity } from "../types";

import ActivityBox from "../components/ActivityBox";

const Home = ({ race = false }: { race?: boolean }) => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["", [0, 100], true, 5, race, 1, "", ""],
    queryFn: fetchActivities,
  });

  if (isPending || isFetching || error) return "Loading...";

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
