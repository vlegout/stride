import { Box, Table } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchActivities } from "../api";

import { formatDateTime, formatDistance, formatSpeed } from "../utils";

const Home = () => {
  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["activitiesId"],
    queryFn: async () => fetchActivities(),
  });

  if (isPending || isFetching || error) return "Loading...";

  return (
    <Box>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Title</Table.ColumnHeader>
            <Table.ColumnHeader>Sport</Table.ColumnHeader>
            <Table.ColumnHeader>Start Time</Table.ColumnHeader>
            <Table.ColumnHeader>Total Distance</Table.ColumnHeader>
            <Table.ColumnHeader>Average Speed</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((activity) => (
            <Table.Row key={activity.id}>
              <Table.Cell>
                <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
              </Table.Cell>
              <Table.Cell>{activity.sport}</Table.Cell>
              <Table.Cell>{formatDateTime(activity.start_time)}</Table.Cell>
              <Table.Cell>{formatDistance(activity.total_distance)}</Table.Cell>
              <Table.Cell>{formatSpeed(activity.average_speed)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default Home;
