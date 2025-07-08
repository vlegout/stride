import { Box, Typography } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ZoneData {
  zone: number;
  time: number;
  percentage: number;
}

interface ActivityZonesProps {
  zones: ZoneData[];
  title: string;
}

const ActivityZones = ({ zones, title }: ActivityZonesProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  if (!zones || zones.length === 0) {
    return null;
  }

  const getZoneColor = (zone: number): string => {
    const colors = [
      "#64B5F6", // Zone 1 - Light Blue
      "#4FC3F7", // Zone 2 - Cyan
      "#26C6DA", // Zone 3 - Light Cyan
      "#26A69A", // Zone 4 - Teal
      "#66BB6A", // Zone 5 - Light Green
      "#9CCC65", // Zone 6 - Light Lime
      "#FFCA28", // Zone 7 - Amber
      "#FF7043", // Zone 8 - Deep Orange
      "#EF5350", // Zone 9 - Red
      "#E91E63", // Zone 10 - Pink
    ];
    return colors[zone - 1] || "#9E9E9E";
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const chartData = {
    labels: zones.map((zone) => `Zone ${zone.zone}`),
    datasets: [
      {
        data: zones.map((zone) => zone.time / 60), // Convert to minutes
        backgroundColor: zones.map((zone) => getZoneColor(zone.zone)),
        borderColor: zones.map((zone) => getZoneColor(zone.zone)),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const zoneIndex = context.dataIndex;
            const zone = zones[zoneIndex];
            return `${formatTime(zone.time)} (${zone.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: isSmall ? 12 : 14,
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Time (minutes)",
          font: {
            size: isSmall ? 12 : 14,
          },
        },
        ticks: {
          font: {
            size: isSmall ? 12 : 14,
          },
        },
      },
    },
  };

  return (
    <Box sx={{ width: "100%", margin: "auto" }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: isSmall ? 300 : isMobile ? 350 : 400,
          position: "relative",
        }}
      >
        <Bar data={chartData} options={chartOptions} />
      </Box>
    </Box>
  );
};

export default ActivityZones;
