import { useInfiniteQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Grid, Chip, Alert, Typography, Button, CircularProgress } from "@mui/material";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";

import { fetchWeeks } from "../api";
import type { Sport, WeeksResponse } from "../types";
import { formatDate, formatDuration, formatDistance, formatSpeed } from "../utils";
import ActivityLogo from "../components/ActivityLogo";
import { PageHeader, StatsCard, DataTable, SectionContainer, Column } from "../components/ui";

interface ActivityRow {
  id: string;
  race?: boolean;
  sport: Sport;
}

const WEEKS_PER_PAGE = 5;

const WeeksPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ["weeks"],
    queryFn: ({ pageParam = 0 }) => fetchWeeks(pageParam, WEEKS_PER_PAGE),
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more) {
        return lastPage.next_offset;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">Error loading weeks: {error?.message ?? "Unknown error"}</Alert>
      </Box>
    );
  }

  const allWeeks = data?.pages.flatMap((page) => page.weeks) ?? [];

  if (allWeeks.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">No weeks data available</Alert>
      </Box>
    );
  }

  return (
    <WeeksContent
      weeks={allWeeks}
      hasMore={hasNextPage ?? false}
      isLoadingMore={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    />
  );
};

interface WeeksContentProps {
  weeks: WeeksResponse["weeks"];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const WeeksContent = ({ weeks, hasMore, isLoadingMore, onLoadMore }: WeeksContentProps) => {
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
      render: (value, row) => formatSpeed(value as number, row.sport as Sport, "--"),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Weekly Summary" />

      {weeks.map((week) => {
        const sportsBreakdown = week.sports_breakdown;

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
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatsCard title="Activities" value={week.total_activities} variant="primary" size="small" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatsCard
                    title="Distance"
                    value={formatDistance(week.total_distance)}
                    variant="primary"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatsCard title="Time" value={formatDuration(week.total_time)} variant="primary" size="small" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatsCard title="TSS" value={week.total_tss?.toFixed(0) || "0"} variant="primary" size="small" />
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

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 4 }}>
          <Button variant="outlined" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {isLoadingMore ? "Loading..." : "Load More Weeks"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WeeksPage;
