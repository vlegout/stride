import { Box, Typography, Grid } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { WeeklyZoneData } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface WeeklyZonesChartsProps {
  weeklyZones: WeeklyZoneData[];
}

const WeeklyZonesCharts = ({ weeklyZones }: WeeklyZonesChartsProps) => {
  const createChartOptions = (title: string, yAxisLabel: string) => ({
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
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Week",
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  });

  // Generate colors for each zone
  const generateZoneColors = (numZones: number) => {
    const colors = [
      "rgba(75, 192, 192, 0.7)", // Zone 1 - Teal
      "rgba(54, 162, 235, 0.7)", // Zone 2 - Blue
      "rgba(255, 206, 86, 0.7)", // Zone 3 - Yellow
      "rgba(255, 99, 132, 0.7)", // Zone 4 - Pink
      "rgba(153, 102, 255, 0.7)", // Zone 5 - Purple
      "rgba(255, 159, 64, 0.7)", // Zone 6 - Orange
      "rgba(199, 199, 199, 0.7)", // Zone 7 - Gray
    ];
    return colors.slice(0, numZones);
  };

  // Create heart rate zones chart data for running
  const createRunningHeartRateZoneData = () => {
    const labels = weeklyZones.map((week) => week.week_start);
    const maxZones = Math.max(...weeklyZones.map((week) => week.heart_rate_zones.length));
    const colors = generateZoneColors(maxZones);

    const datasets = [];
    for (let i = 0; i < maxZones; i++) {
      datasets.push({
        label: `Zone ${i + 1}`,
        data: weeklyZones.map((week) => {
          const zone = week.heart_rate_zones.find((z) => z.zone_index === i + 1);
          return zone ? (zone.running_time || 0) / 60 : 0; // Convert to minutes
        }),
        backgroundColor: colors[i],
      });
    }

    return { labels, datasets };
  };

  // Create heart rate zones chart data for cycling
  const createCyclingHeartRateZoneData = () => {
    const labels = weeklyZones.map((week) => week.week_start);
    const maxZones = Math.max(...weeklyZones.map((week) => week.heart_rate_zones.length));
    const colors = generateZoneColors(maxZones);

    const datasets = [];
    for (let i = 0; i < maxZones; i++) {
      datasets.push({
        label: `Zone ${i + 1}`,
        data: weeklyZones.map((week) => {
          const zone = week.heart_rate_zones.find((z) => z.zone_index === i + 1);
          return zone ? (zone.cycling_time || 0) / 60 : 0; // Convert to minutes
        }),
        backgroundColor: colors[i],
      });
    }

    return { labels, datasets };
  };

  // Create pace zones chart data
  const createPaceZoneData = () => {
    const labels = weeklyZones.map((week) => week.week_start);
    const maxZones = Math.max(...weeklyZones.map((week) => week.pace_zones.length));
    const colors = generateZoneColors(maxZones);

    const datasets = [];
    for (let i = 0; i < maxZones; i++) {
      datasets.push({
        label: `Zone ${i + 1}`,
        data: weeklyZones.map((week) => {
          const zone = week.pace_zones.find((z) => z.zone_index === i + 1);
          return zone ? zone.total_time / 60 : 0; // Convert to minutes
        }),
        backgroundColor: colors[i],
      });
    }

    return { labels, datasets };
  };

  // Create power zones chart data
  const createPowerZoneData = () => {
    const labels = weeklyZones.map((week) => week.week_start);
    const maxZones = Math.max(...weeklyZones.map((week) => week.power_zones.length));
    const colors = generateZoneColors(maxZones);

    const datasets = [];
    for (let i = 0; i < maxZones; i++) {
      datasets.push({
        label: `Zone ${i + 1}`,
        data: weeklyZones.map((week) => {
          const zone = week.power_zones.find((z) => z.zone_index === i + 1);
          return zone ? zone.total_time / 60 : 0; // Convert to minutes
        }),
        backgroundColor: colors[i],
      });
    }

    return { labels, datasets };
  };

  const runningHeartRateData = createRunningHeartRateZoneData();
  const cyclingHeartRateData = createCyclingHeartRateZoneData();
  const paceData = createPaceZoneData();
  const powerData = createPowerZoneData();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Training Zones
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 400, width: "100%" }}>
            <Bar
              data={runningHeartRateData}
              options={createChartOptions("Weekly Running Heart Rate Zones", "Time (minutes)")}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 400, width: "100%" }}>
            <Bar
              data={cyclingHeartRateData}
              options={createChartOptions("Weekly Cycling Heart Rate Zones", "Time (minutes)")}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 400, width: "100%" }}>
            <Bar data={paceData} options={createChartOptions("Weekly Pace Zones", "Time (minutes)")} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ height: 400, width: "100%" }}>
            <Bar data={powerData} options={createChartOptions("Weekly Power Zones", "Time (minutes)")} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeeklyZonesCharts;
