import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import { Activity } from "../types";

import Map from "./Map";
import SportLogo from "./SportLogo";

interface ActivityBoxProps {
  activity: Activity;
  isDetailed?: boolean;
}

const ActivityBox = ({ activity, isDetailed = false }: ActivityBoxProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const title = isDetailed ? (
    <Typography variant={isSmall ? "h6" : "h5"}>{activity.title}</Typography>
  ) : (
    <Typography variant={isSmall ? "h6" : "h5"}>
      <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
    </Typography>
  );

  return (
    <Grid container spacing={isMobile ? 1 : 2} marginBottom={isMobile ? "16px" : "20px"}>
      <Grid size={{ xs: 12, md: 6 }}>
        {title}
        <Grid container spacing={1} marginTop={"10px"} marginBottom={"10px"}>
          <Grid size={isSmall ? 2 : 1}>
            <SportLogo sport={activity.sport} />
          </Grid>
          <Grid size={isSmall ? 10 : 11} display="flex" alignItems="center">
            <Typography variant={isSmall ? "body2" : "body1"}>{formatDateTime(activity.start_time)}</Typography>
          </Grid>
        </Grid>
        <TableContainer component={Paper}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} sx={{ fontSize: isSmall ? "0.875rem" : "inherit" }}>
                  {activity.location}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Timer Time: {formatDuration(activity.total_timer_time)}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Elapsed Time: {formatDuration(activity.total_elapsed_time)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Distance: {formatDistance(activity.total_distance)}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Average Speed: {formatSpeed(activity.avg_speed)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Avg Heart Rate: {activity.avg_heart_rate}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Max Heart Rate: {activity.max_heart_rate}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Avg Power: {activity.avg_power}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Normalized Power: {activity.np_power}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Calories: {activity.total_calories}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Training Effect: {activity.total_training_effect}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Device: {activity.device}
                </TableCell>
                <TableCell sx={{ fontSize: isSmall ? "0.75rem" : "inherit", padding: isSmall ? "8px" : "inherit" }}>
                  Ascent: {activity.total_ascent} m
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: isMobile ? "250px" : "auto" }}>
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
