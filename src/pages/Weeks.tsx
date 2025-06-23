import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Grid, Chip, Alert, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";

import { fetchWeeks } from "../api";
import type { Sport } from "../types";
import { formatDate, formatDuration, formatDistance, formatPace } from "../utils";
import ActivityLogo from "../components/ActivityLogo";
import LoadingIndicator from "../components/LoadingIndicator";
import { PageHeader, StatsCard, DataTable, SectionContainer, Column } from "../components/ui";

interface ActivityRow {
  id: string;
  race?: boolean;
  sport: Sport;
}

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

  const activityColumns: Column<ActivityRow>[] = [
    {
      id: "start_time",
      label: "Date",
      render: (value) => formatDate(new Date((value as number) * 1000)),
    },
    {
      id: "title",
      label: "Activity",
      render: (value, row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MuiLink component={Link} to={`/activities/${row.id}`}>
            {value as string}
          </MuiLink>
          {row.race && <Chip label="Race" size="small" color="primary" />}
        </Box>
      ),
    },
    {
      id: "sport",
      label: "Sport",
      render: (value) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ActivityLogo sport={value as Sport} width={20} />
          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
            {value as string}
          </Typography>
        </Box>
      ),
    },
    {
      id: "total_distance",
      label: "Distance",
      align: "right" as const,
      format: (value) => formatDistance(value as number),
    },
    {
      id: "total_timer_time",
      label: "Time",
      align: "right" as const,
      format: (value) => formatDuration(value as number),
    },
    {
      id: "avg_speed",
      label: "Pace",
      align: "right" as const,
      render: (value, row) => formatPace(value as number, row.sport as Sport),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Weekly Summary" />

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
                  <StatsCard title="Activities" value={week.total_activities} variant="primary" size="large" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatsCard
                    title="Total Distance"
                    value={formatDistance(week.total_distance)}
                    variant="primary"
                    size="large"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <StatsCard
                    title="Total Time"
                    value={formatDuration(week.total_time)}
                    variant="primary"
                    size="large"
                  />
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
                        icon={<ActivityLogo sport={sport as Sport} width={16} />}
                        label={`${sport}: ${stats.count} (${formatDistance(stats.distance)})`}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Activities Table */}
              {week.activities.length > 0 && (
                <SectionContainer title="Activities">
                  <DataTable columns={activityColumns} rows={week.activities} maxHeight={400} stickyHeader responsive />
                </SectionContainer>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default WeeksPage;
