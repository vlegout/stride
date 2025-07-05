import { Box, Typography } from "@mui/material";
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
  TooltipItem,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface WeeklyTSSData {
  week_start: string;
  total_tss: number;
}

interface TSSChartProps {
  weeklyTss: WeeklyTSSData[];
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
        borderColor: "rgb(153, 102, 255)",
        backgroundColor: "rgba(153, 102, 255, 0.1)",
        tension: 0.1,
        fill: true,
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
          title: function (context: TooltipItem<"line">[]) {
            return context[0].label || "";
          },
          label: function (context: TooltipItem<"line">) {
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
        <Line data={weeklyTssChartData} options={weeklyTssChartOptions} />
      </Box>
    </Box>
  );
};

export default TSSChart;
