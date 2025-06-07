import { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";

const LineChart = ({ labels, data }: { labels: number[]; data: number[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    scales: {
      x: {
        type: "linear",
        max: Math.max(...labels),
        grid: {
          display: !isSmall, // Hide grid on very small screens
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
      },
      y: {
        grid: {
          display: !isSmall, // Hide grid on very small screens
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
      },
    },
    elements: {
      point: {
        radius: isSmall ? 1 : 0, // Small points on mobile for better touch interaction
        hoverRadius: isMobile ? 6 : 4,
      },
      line: {
        tension: 0.1, // Slight curve for better mobile viewing
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        titleFont: {
          size: isSmall ? 12 : 14,
        },
        bodyFont: {
          size: isSmall ? 11 : 13,
        },
        padding: isMobile ? 12 : 8,
      },
    },
  };

  const lineData = {
    labels: labels,
    datasets: [
      {
        data: data,
        borderWidth: isMobile ? 3 : 2, // Thicker line on mobile
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        borderColor: "rgba(54, 162, 235, 1)",
      },
    ],
  };

  const chartHeight = isSmall ? 80 : isMobile ? 100 : 120;

  return (
    <Box
      sx={{
        width: "100%",
        height: `${chartHeight}px`,
        touchAction: "pan-y", // Allow vertical scrolling but prevent horizontal pan conflicts
      }}
    >
      <Line options={lineOptions} data={lineData} />
    </Box>
  );
};

export default LineChart;
