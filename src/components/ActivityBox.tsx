import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";

import { formatDateTime, formatDistance, formatDuration, formatSpeed } from "../utils";
import { Activity } from "../types";
import { useAuthStore } from "../store";

import MapComponent from "./Map";
import MapOLComponent from "./MapOL";
import MapMapbox from "./MapMapbox";
import ActivityLogo from "./ActivityLogo";
import EditActivityModal from "./EditActivityModal";
import { StatsCard, PageHeader } from "./ui";

interface ActivityBoxProps {
  activity: Activity;
  isDetailed?: boolean;
}

const ActivityBox = ({ activity, isDetailed = false }: ActivityBoxProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuthStore();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const mapProvider = user?.map || "leaflet";

  const locationText = [activity.city, activity.country].filter(Boolean).join(", ") || "—";
  const mapPoints = activity.tracepoints.map(
    (point) => [point.lat, point.lng || (point as { lon?: number }).lon || 0] as [number, number],
  );

  const title = isDetailed ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <Box sx={{ flexGrow: 1 }}>
        <PageHeader title={activity.title} subtitle={locationText} />
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setEditModalOpen(true)}
        sx={{ flexShrink: 0, minWidth: "auto", p: 1 }}
      >
        <EditIcon />
      </Button>
    </Box>
  ) : (
    <Typography variant={isSmall ? "h6" : "h5"}>
      <MuiLink component={Link} to={`/activities/${activity.id}`}>
        {activity.title}
      </MuiLink>
    </Typography>
  );

  return (
    <Grid container spacing={isMobile ? 1 : 2} marginBottom={isMobile ? "16px" : "20px"}>
      <Grid size={{ xs: 12, md: 6 }}>
        {isDetailed ? <>{title}</> : title}
        <Grid container spacing={1} marginTop={"10px"} marginBottom={"10px"}>
          <Grid size={isSmall ? 2 : 1}>
            <ActivityLogo sport={activity.sport} />
          </Grid>
          <Grid size={isSmall ? 10 : 11} display="flex" alignItems="center">
            <Typography variant={isSmall ? "body2" : "body1"}>{formatDateTime(activity.start_time)}</Typography>
          </Grid>
        </Grid>
        {!isDetailed && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 700 }}>
              {locationText}
            </Typography>
          </Box>
        )}

        <Grid container spacing={1}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Distance" value={formatDistance(activity.total_distance)} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Timer Time" value={formatDuration(activity.total_timer_time)} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatsCard title="Avg Speed" value={formatSpeed(activity.avg_speed, activity.sport)} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Avg HR" value={activity.avg_heart_rate || 0} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Max HR" value={activity.max_heart_rate} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Calories" value={activity.total_calories} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Avg Power" value={activity.avg_power} size="small" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <StatsCard title="Ascent" value={activity.total_ascent ? `${activity.total_ascent} m` : "—"} size="small" />
          </Grid>
          {activity.device && (
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatsCard title="Device" value={activity.device} size="small" />
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: isMobile ? "250px" : "auto" }}>
        {mapProvider === "leaflet" && activity.sport !== "swimming" ? (
          <MapComponent
            bounds={[
              [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
              [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
            ]}
            points={mapPoints}
          />
        ) : mapProvider === "openlayers" && activity.sport !== "swimming" ? (
          <MapOLComponent
            bounds={[
              [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
              [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
            ]}
            points={mapPoints}
          />
        ) : activity.sport !== "swimming" ? (
          <MapMapbox
            bounds={[
              [activity.lat - activity.delta_lat, activity.lon - activity.delta_lon],
              [activity.lat + activity.delta_lat, activity.lon + activity.delta_lon],
            ]}
            points={mapPoints}
          />
        ) : (
          <Box></Box>
        )}
      </Grid>
      {isDetailed && (
        <EditActivityModal open={editModalOpen} onClose={() => setEditModalOpen(false)} activity={activity} />
      )}
    </Grid>
  );
};

export default ActivityBox;
