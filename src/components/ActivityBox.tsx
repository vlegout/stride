import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import { Activity } from "../types";

import Map from "./Map";
import SportLogo from "./SportLogo";

interface ActivityBoxProps {
  activity: Activity;
  isDetailed?: boolean;
}

const ActivityBox = ({ activity, isDetailed = false }: ActivityBoxProps) => {
  const title = isDetailed ? (
    <Typography variant="h5">{activity.title}</Typography>
  ) : (
    <Typography variant="h5">
      <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
    </Typography>
  );

  return (
    <Grid container spacing={2} marginBottom={"20px"}>
      <Grid size={6}>
        {title}
        <Grid container spacing={1} marginTop={"10px"} marginBottom={"10px"}>
          <Grid size={1}>
            <SportLogo sport={activity.sport} />
          </Grid>
          <Grid size={11} display="flex" alignItems="center">
            {formatDateTime(activity.start_time)}
          </Grid>
        </Grid>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2}>{activity.location}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Timer Time: {formatDuration(activity.total_timer_time)}</TableCell>
                <TableCell>Elapsed Time: {formatDuration(activity.total_elapsed_time)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Distance: {formatDistance(activity.total_distance)}</TableCell>
                <TableCell>Average Speed: {formatSpeed(activity.avg_speed)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Avg Heart Rate: {activity.avg_heart_rate}</TableCell>
                <TableCell>Max Heart Rate: {activity.max_heart_rate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Avg Power: {activity.avg_power}</TableCell>
                <TableCell>Normalized Power: {activity.np_power}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Calories: {activity.total_calories}</TableCell>
                <TableCell>Training Effect: {activity.total_training_effect}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Device: {activity.device}</TableCell>
                <TableCell>Ascent: {activity.total_ascent} m</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid size={6}>
        <Map
          bounds={[
            [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
            [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
          ]}
          points={activity.tracepoints}
        />
      </Grid>
    </Grid>
  );
};

export default ActivityBox;
