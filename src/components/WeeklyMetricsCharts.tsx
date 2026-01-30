import { useState } from "react";
import { Box, Typography, Grid, ToggleButtonGroup, ToggleButton, Stack } from "@mui/material";
import { ViewModule, ViewStream } from "@mui/icons-material";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { WeeklyActivityData } from "../types";
import { colors } from "../colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ViewMode = "individual" | "combined";

interface WeeklyMetricsChartsProps {
  weeklyRunning: WeeklyActivityData[];
  weeklyCycling: WeeklyActivityData[];
  weeklySwimming: WeeklyActivityData[];
}

const WeeklyMetricsCharts = ({ weeklyRunning, weeklyCycling, weeklySwimming }: WeeklyMetricsChartsProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("individual");

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const createChartOptions = (title: string, yAxisLabel: string): object => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
      x: {
        title: {
          display: true,
          text: "Week",
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
    },
  });

  const weeklyRunningDistances = weeklyRunning.map((week) => week.distance);
  const weeklyRunningTimes = weeklyRunning.map((week) => week.time);
  const weeklyRunningLabels = weeklyRunning.map((week) => week.week_start);

  const weeklyCyclingDistances = weeklyCycling.map((week) => week.distance);
  const weeklyCyclingTimes = weeklyCycling.map((week) => week.time);
  const weeklyCyclingLabels = weeklyCycling.map((week) => week.week_start);

  const weeklySwimmingDistances = weeklySwimming.map((week) => week.distance);
  const weeklySwimmingTimes = weeklySwimming.map((week) => week.time);
  const weeklySwimmingLabels = weeklySwimming.map((week) => week.week_start);

  const runningDistanceChartData = {
    labels: weeklyRunningLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklyRunningDistances,
        backgroundColor: colors.chart.metrics.runningDistance,
      },
    ],
  };

  const runningTimeChartData = {
    labels: weeklyRunningLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyRunningTimes,
        backgroundColor: colors.chart.metrics.runningTime,
      },
    ],
  };

  const cyclingDistanceChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklyCyclingDistances,
        backgroundColor: colors.chart.metrics.cyclingDistance,
      },
    ],
  };

  const cyclingTimeChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyCyclingTimes,
        backgroundColor: colors.chart.metrics.cyclingTime,
      },
    ],
  };

  const swimmingDistanceChartData = {
    labels: weeklySwimmingLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklySwimmingDistances,
        backgroundColor: colors.chart.metrics.swimmingDistance,
      },
    ],
  };

  const swimmingTimeChartData = {
    labels: weeklySwimmingLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklySwimmingTimes,
        backgroundColor: colors.chart.metrics.swimmingTime,
      },
    ],
  };

  const combinedLabels = weeklyRunningLabels;

  const combinedDistanceChartData = {
    labels: combinedLabels,
    datasets: [
      {
        label: "Running",
        data: weeklyRunningDistances,
        backgroundColor: colors.chart.running,
      },
      {
        label: "Cycling",
        data: weeklyCyclingDistances,
        backgroundColor: colors.chart.cycling,
      },
      {
        label: "Swimming",
        data: weeklySwimmingDistances,
        backgroundColor: colors.chart.swimming,
      },
    ],
  };

  const combinedTimeChartData = {
    labels: combinedLabels,
    datasets: [
      {
        label: "Running",
        data: weeklyRunningTimes,
        backgroundColor: colors.chart.running,
      },
      {
        label: "Cycling",
        data: weeklyCyclingTimes,
        backgroundColor: colors.chart.cycling,
      },
      {
        label: "Swimming",
        data: weeklySwimmingTimes,
        backgroundColor: colors.chart.swimming,
      },
    ],
  };

  const createStackedChartOptions = (title: string, yAxisLabel: string): object => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Week",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">Weekly Activity Metrics</Typography>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small">
          <ToggleButton value="individual">
            <ViewModule sx={{ mr: 0.5 }} fontSize="small" />
            By Sport
          </ToggleButton>
          <ToggleButton value="combined">
            <ViewStream sx={{ mr: 0.5 }} fontSize="small" />
            Combined
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {viewMode === "individual" ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar
                data={runningDistanceChartData}
                options={createChartOptions("Weekly Running Distance", "Distance (km)")}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar data={runningTimeChartData} options={createChartOptions("Weekly Running Time", "Time (hours)")} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar
                data={cyclingDistanceChartData}
                options={createChartOptions("Weekly Cycling Distance", "Distance (km)")}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar data={cyclingTimeChartData} options={createChartOptions("Weekly Cycling Time", "Time (hours)")} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar
                data={swimmingDistanceChartData}
                options={createChartOptions("Weekly Swimming Distance", "Distance (km)")}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 300, width: "100%" }}>
              <Bar data={swimmingTimeChartData} options={createChartOptions("Weekly Swimming Time", "Time (hours)")} />
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 400, width: "100%" }}>
              <Bar
                data={combinedDistanceChartData}
                options={createStackedChartOptions("Total Weekly Distance", "Distance (km)")}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ height: 400, width: "100%" }}>
              <Bar
                data={combinedTimeChartData}
                options={createStackedChartOptions("Total Weekly Time", "Time (hours)")}
              />
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default WeeklyMetricsCharts;
