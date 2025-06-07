import { Link } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";

import { formatDateTime, formatDistance, formatSpeed } from "../utils";
import { Activity } from "../types";
import SportLogo from "./SportLogo";

interface ActivitiesTableProps {
  activities: Activity[];
  order: "asc" | "desc";
  orderBy: string;
  onSort: (property: keyof Activity) => void;
}

const ActivitiesTable = ({ activities, order, orderBy, onSort }: ActivitiesTableProps) => {
  return (
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
                onClick={() => onSort("total_distance")}
              >
                Distance
              </TableSortLabel>
            </TableCell>
            <TableCell>Average Speed</TableCell>
            <TableCell>Avg Power</TableCell>
            <TableCell>Total Ascent</TableCell>
            <TableCell>Calories</TableCell>
            <TableCell>Training Effect</TableCell>
            <TableCell>Device</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity: Activity) => (
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
              <TableCell>{activity.device}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActivitiesTable;
