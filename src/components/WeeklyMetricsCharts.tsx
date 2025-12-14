import { Box, Typography, Grid } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { WeeklyActivityData } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface WeeklyMetricsChartsProps {
  weeklyRunning: WeeklyActivityData[];
  weeklyCycling: WeeklyActivityData[];
  weeklySwimming: WeeklyActivityData[];
}

const WeeklyMetricsCharts = ({ weeklyRunning, weeklyCycling, weeklySwimming }: WeeklyMetricsChartsProps) => {
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
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  const runningTimeChartData = {
    labels: weeklyRunningLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyRunningTimes,
        backgroundColor: "rgba(255, 159, 64, 0.7)",
      },
    ],
  };

  const cyclingDistanceChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklyCyclingDistances,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  const cyclingTimeChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyCyclingTimes,
        backgroundColor: "rgba(75, 192, 192, 0.7)",
      },
    ],
  };

  const swimmingDistanceChartData = {
    labels: weeklySwimmingLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklySwimmingDistances,
        backgroundColor: "rgba(153, 102, 255, 0.7)",
      },
    ],
  };

  const swimmingTimeChartData = {
    labels: weeklySwimmingLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklySwimmingTimes,
        backgroundColor: "rgba(255, 193, 7, 0.7)",
      },
    ],
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Activity Metrics
        </Typography>
      </Box>

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
    </Box>
  );
};

export default WeeklyMetricsCharts;
