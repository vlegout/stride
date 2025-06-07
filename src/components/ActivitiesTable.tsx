import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";

import { fetchActivities } from "../api";
import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import { Activity } from "../types";
import SportLogo from "./SportLogo";

interface ActivitiesTableProps {
  sport: string;
  distance: number[];
  race: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

const ActivitiesTable = ({ sport, distance, race, page, onPageChange }: ActivitiesTableProps) => {
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<string>("");

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: [sport, distance, false, 10, race, page, order, orderBy],
    queryFn: fetchActivities,
  });

  const sortHandler = (property: keyof Activity) => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrderBy(property);
    setOrder(newOrder);
  };

  if (isPending || isFetching || error) return <div>Loading...</div>;

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Sport</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell key="total_distance" sortDirection={orderBy === "total_distance" ? order : false}>
                <TableSortLabel
                  active={orderBy === "total_distance"}
                  direction={orderBy === "total_distance" ? order : "asc"}
                  onClick={() => sortHandler("total_distance")}
                >
                  Distance
                </TableSortLabel>
              </TableCell>
              <TableCell>Average Speed</TableCell>
              <TableCell>Avg Power</TableCell>
              <TableCell>Total Ascent</TableCell>
              <TableCell>Calories</TableCell>
              <TableCell>Training Effect</TableCell>
              <TableCell>Race</TableCell>
              <TableCell>Device</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.activities.map((activity: Activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <SportLogo sport={activity.sport} width={25} />
                </TableCell>
                <TableCell>
                  <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
                </TableCell>
                <TableCell>{activity.location}</TableCell>
                <TableCell>{formatDateTime(activity.start_time)}</TableCell>
                <TableCell>{formatDistance(activity.total_distance)}</TableCell>
                <TableCell>{formatSpeed(activity.avg_speed)}</TableCell>
                <TableCell>{activity.avg_power}</TableCell>
                <TableCell>{activity.total_ascent}</TableCell>
                <TableCell>{activity.total_calories}</TableCell>
                <TableCell>{activity.total_training_effect}</TableCell>
                <TableCell>{activity.race ? "Yes" : "No"}</TableCell>
                <TableCell>{activity.device}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box margin={"auto"} marginTop="20px" display="flex" justifyContent="center">
        <Pagination
          count={Math.ceil(data.pagination.total / data.pagination.per_page)}
          shape="rounded"
          page={page}
          onChange={(_event, value) => {
            onPageChange(value);
          }}
        />
      </Box>
    </>
  );
};

export default ActivitiesTable;
