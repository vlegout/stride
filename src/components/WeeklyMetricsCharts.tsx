import { Box, Typography, Grid } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WeeklyData {
  week_start: string;
  distance: number;
  time: number;
}

interface WeeklyMetricsChartsProps {
  weeklyRunning: WeeklyData[];
  weeklyCycling: WeeklyData[];
}

const WeeklyMetricsCharts = ({ weeklyRunning, weeklyCycling }: WeeklyMetricsChartsProps) => {
  const createChartOptions = (title: string, yAxisLabel: string) => ({
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

  const runningDistanceChartData = {
    labels: weeklyRunningLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklyRunningDistances,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const runningTimeChartData = {
    labels: weeklyRunningLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyRunningTimes,
        borderColor: "rgb(255, 159, 64)",
        backgroundColor: "rgba(255, 159, 64, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const cyclingDistanceChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Distance (km)",
        data: weeklyCyclingDistances,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const cyclingTimeChartData = {
    labels: weeklyCyclingLabels,
    datasets: [
      {
        label: "Weekly Time (hours)",
        data: weeklyCyclingTimes,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        fill: true,
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
            <Line
              data={runningDistanceChartData}
              options={createChartOptions("Weekly Running Distance", "Distance (km)")}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 300, width: "100%" }}>
            <Line data={runningTimeChartData} options={createChartOptions("Weekly Running Time", "Time (hours)")} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 300, width: "100%" }}>
            <Line
              data={cyclingDistanceChartData}
              options={createChartOptions("Weekly Cycling Distance", "Distance (km)")}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 300, width: "100%" }}>
            <Line data={cyclingTimeChartData} options={createChartOptions("Weekly Cycling Time", "Time (hours)")} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeeklyMetricsCharts;
