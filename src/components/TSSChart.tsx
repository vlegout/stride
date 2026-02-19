import { Box, Typography } from "@mui/material";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import type { WeeklyTSS } from "../types";
import { colors } from "../colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface TSSChartProps {
  weeklyTss: WeeklyTSS[];
}

const calculateRollingAverage = (data: number[], windowSize: number): (number | null)[] => {
  return data.map((_, index) => {
    if (index < windowSize - 1) return null;
    const window = data.slice(index - windowSize + 1, index + 1);
    return Math.round(window.reduce((sum, val) => sum + val, 0) / windowSize);
  });
};

const TSSChart = ({ weeklyTss }: TSSChartProps) => {
  const weeklyTssLabels = weeklyTss.map((week) => week.week_start);
  const weeklyTssValues = weeklyTss.map((week) => week.total_tss);
  const rollingAverage = calculateRollingAverage(weeklyTssValues, 4);

  const weeklyTssChartData = {
    labels: weeklyTssLabels,
    datasets: [
      {
        type: "bar" as const,
        label: "Weekly TSS",
        data: weeklyTssValues,
        backgroundColor: colors.chart.primary,
        order: 2,
      },
      {
        type: "line" as const,
        label: "4-Week Average",
        data: rollingAverage,
        borderColor: colors.chart.overall,
        backgroundColor: colors.chart.overallLight,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        order: 1,
      },
    ],
  };

  const weeklyTssChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Weekly Training Stress Score",
      },
      tooltip: {
        callbacks: {
          title: (context: TooltipItem<"bar" | "line">[]) => context[0].label || "",
          label: (context: TooltipItem<"bar" | "line">) => {
            const label = context.dataset.label || "";
            if (context.parsed.y === null) return "";
            return `${label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "TSS",
        },
      },
      x: {
        title: {
          display: true,
          text: "Week",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Training Stress Score
        </Typography>
      </Box>

      <Box sx={{ height: 400, width: "100%" }}>
        <Chart type="bar" data={weeklyTssChartData} options={weeklyTssChartOptions} />
      </Box>
    </Box>
  );
};

export default TSSChart;
