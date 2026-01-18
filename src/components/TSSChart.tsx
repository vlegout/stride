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
import { WeeklyTSS } from "../types";
import { colors } from "../colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TSSChartProps {
  weeklyTss: WeeklyTSS[];
}

const TSSChart = ({ weeklyTss }: TSSChartProps) => {
  const weeklyTssLabels = weeklyTss.map((week) => week.week_start);
  const weeklyTssValues = weeklyTss.map((week) => week.total_tss);

  const weeklyTssChartData = {
    labels: weeklyTssLabels,
    datasets: [
      {
        label: "Weekly TSS",
        data: weeklyTssValues,
        backgroundColor: colors.chart.primary,
      },
    ],
  };

  const weeklyTssChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Weekly Training Stress Score",
      },
      tooltip: {
        callbacks: {
          title: function (context: TooltipItem<"bar">[]) {
            return context[0].label || "";
          },
          label: function (context: TooltipItem<"bar">) {
            return `TSS: ${context.parsed.y}`;
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
        <Bar data={weeklyTssChartData} options={weeklyTssChartOptions} />
      </Box>
    </Box>
  );
};

export default TSSChart;
