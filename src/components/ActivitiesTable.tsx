import { Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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

import { fetchActivities, createActivitiesQueryKey } from "../api";
import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import { Activity, ActivitiesQueryParams } from "../types";
import SportLogo from "./SportLogo";
import { useActivitiesStore } from "../store";

const ActivitiesTable = () => {
  const { sport, distance, race, page, order, orderBy, setPage, setOrder, setOrderBy } = useActivitiesStore();

  const queryParams: ActivitiesQueryParams = {
    sport,
    distance,
    fetchMap: false,
    limit: 10,
    race,
    page,
    order,
    orderBy,
  };

  const { data, error, isPending } = useQuery({
    queryKey: createActivitiesQueryKey(queryParams),
    queryFn: fetchActivities,
    placeholderData: keepPreviousData,
  });

  const sortHandler = (property: keyof Activity) => {
    const newOrder = order === "asc" ? "desc" : "asc";
    setOrderBy(property);
    setOrder(newOrder);
  };

  if (isPending || error) return <div>Loading...</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, "& .MuiTableCell-root": { whiteSpace: "nowrap" } }} aria-label="simple table">
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
              <TableCell key="avg_speed" sortDirection={orderBy === "avg_speed" ? order : false}>
                <TableSortLabel
                  active={orderBy === "avg_speed"}
                  direction={orderBy === "avg_speed" ? order : "asc"}
                  onClick={() => sortHandler("avg_speed")}
                >
                  Average Speed
                </TableSortLabel>
              </TableCell>
              <TableCell key="avg_power" sortDirection={orderBy === "avg_power" ? order : false}>
                <TableSortLabel
                  active={orderBy === "avg_power"}
                  direction={orderBy === "avg_power" ? order : "asc"}
                  onClick={() => sortHandler("avg_power")}
                >
                  Avg Power
                </TableSortLabel>
              </TableCell>
              <TableCell key="total_ascent" sortDirection={orderBy === "total_ascent" ? order : false}>
                <TableSortLabel
                  active={orderBy === "total_ascent"}
                  direction={orderBy === "total_ascent" ? order : "asc"}
                  onClick={() => sortHandler("total_ascent")}
                >
                  Total Ascent
                </TableSortLabel>
              </TableCell>
              <TableCell key="total_calories" sortDirection={orderBy === "total_calories" ? order : false}>
                <TableSortLabel
                  active={orderBy === "total_calories"}
                  direction={orderBy === "total_calories" ? order : "asc"}
                  onClick={() => sortHandler("total_calories")}
                >
                  Calories
                </TableSortLabel>
              </TableCell>
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
            setPage(value);
          }}
        />
      </Box>
    </>
  );
};

export default ActivitiesTable;
