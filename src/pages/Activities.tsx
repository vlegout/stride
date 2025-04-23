import axios from "axios";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Box, Table } from "@chakra-ui/react";

import type { Activity } from "../types";

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    axios
      .get("/activities.json")
      .then((response) => {
        setActivities(response.data.activities);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

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
          {activities.map((activity) => (
            <Table.Row key={activity.id}>
              <Table.Cell>{activity.title}</Table.Cell>
              <Table.Cell>{activity.sport}</Table.Cell>
              <Table.Cell>
                {" "}
                {DateTime.fromSQL(activity.start_time).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}
              </Table.Cell>
              <Table.Cell>{activity.total_distance}</Table.Cell>
              <Table.Cell>{activity.average_speed}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default Home;
