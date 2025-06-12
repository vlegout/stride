import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from "@mui/material";
import { Link } from "react-router-dom";

import { fetchWeeks } from "../api";
import { formatDate, formatDuration, formatDistance, formatPace } from "../utils";
import SportLogo from "../components/SportLogo";
import LoadingIndicator from "../components/LoadingIndicator";
import { colors } from "../colors";

const WeeksPage = () => {
  const {
    data: weeksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["weeks"],
    queryFn: fetchWeeks,
  });

  if (isLoading) {
    return <LoadingIndicator message="Loading weekly summary..." />;
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">Failed to load weeks data</Alert>
      </Box>
    );
  }

  if (!weeksData || !weeksData.weeks) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">No weeks data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Weekly Summary
      </Typography>

      {weeksData.weeks.map((week) => {
        const sportsBreakdown =
          (week.sports_breakdown as Record<string, { distance: number; time: number; count: number }>) || {};

        return (
          <Card key={`${week.year}-${week.week_number}`} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Week {week.week_number}, {week.year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(new Date(week.week_start))}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2, bgcolor: colors.primarySoft, borderRadius: 1 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                      {week.total_activities}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activities
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2, bgcolor: colors.primarySoft, borderRadius: 1 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                      {formatDistance(week.total_distance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Distance
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2, bgcolor: colors.primarySoft, borderRadius: 1 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                      {formatDuration(week.total_time)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Time
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Sports Breakdown */}
              {Object.keys(sportsBreakdown).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Sports Breakdown
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {Object.entries(sportsBreakdown).map(([sport, stats]) => (
                      <Chip
                        key={sport}
                        icon={<SportLogo sport={sport} width={16} />}
                        label={`${sport}: ${stats.count} (${formatDistance(stats.distance)})`}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Activities Table */}
              {week.activities.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Activities
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Activity</TableCell>
                          <TableCell>Sport</TableCell>
                          <TableCell align="right">Distance</TableCell>
                          <TableCell align="right">Time</TableCell>
                          <TableCell align="right">Pace</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {week.activities.map((activity) => (
                          <TableRow key={activity.id} hover>
                            <TableCell>{formatDate(new Date(activity.start_time * 1000))}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Link
                                  to={`/activities/${activity.id}`}
                                  style={{ textDecoration: "none", color: "inherit" }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      "&:hover": {
                                        textDecoration: "underline",
                                      },
                                    }}
                                  >
                                    {activity.title}
                                  </Typography>
                                </Link>
                                {activity.race && <Chip label="Race" size="small" color="primary" />}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <SportLogo sport={activity.sport} width={20} />
                                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                                  {activity.sport}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">{formatDistance(activity.total_distance)}</TableCell>
                            <TableCell align="right">{formatDuration(activity.total_timer_time)}</TableCell>
                            <TableCell align="right">{formatPace(activity.avg_speed, activity.sport)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default WeeksPage;
