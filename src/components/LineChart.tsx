import { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import { colors } from "../colors";

interface LineChartProps {
  labels: number[];
  data: number[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const LineChart = ({ labels, data, title, xAxisLabel, yAxisLabel }: LineChartProps) => {
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
          display: !isSmall,
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel || "",
          font: {
            size: isSmall ? 11 : 13,
          },
        },
      },
      y: {
        grid: {
          display: !isSmall,
        },
        ticks: {
          font: {
            size: isSmall ? 10 : 12,
          },
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel || "",
          font: {
            size: isSmall ? 11 : 13,
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
      title: {
        display: !!title,
        text: title || "",
        font: {
          size: isSmall ? 14 : 16,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
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
        backgroundColor: colors.chart.primaryLight,
        borderColor: colors.chart.primary,
      },
    ],
  };

  const chartHeight = isSmall ? 140 : isMobile ? 160 : 180;

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
