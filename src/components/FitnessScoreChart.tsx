import { Box } from "@mui/material";
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
  TooltipItem,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface FitnessScore {
  date: string;
  overall: number;
  running: number;
  cycling: number;
}

interface FitnessScoreChartProps {
  scores: FitnessScore[];
  title?: string;
}

const FitnessScoreChart = ({ scores, title = "Fitness Score Over Time" }: FitnessScoreChartProps) => {
  const labels = scores.map((score) => score.date);
  const overallScores = scores.map((score) => score.overall);
  const runningScores = scores.map((score) => score.running);
  const cyclingScores = scores.map((score) => score.cycling);

  const sampledLabels = labels.filter((_, index) => index % 7 === 0);
  const sampledOverall = overallScores.filter((_, index) => index % 7 === 0);
  const sampledRunning = runningScores.filter((_, index) => index % 7 === 0);
  const sampledCycling = cyclingScores.filter((_, index) => index % 7 === 0);

  const chartData = {
    labels: sampledLabels,
    datasets: [
      {
        label: "Overall",
        data: sampledOverall,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
      },
      {
        label: "Running",
        data: sampledRunning,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.1,
      },
      {
        label: "Cycling",
        data: sampledCycling,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            const index = context[0].dataIndex * 7;
            return scores[index]?.date || "";
          },
          label: function (context: TooltipItem<"line">) {
            const index = context.dataIndex * 7;
            const datasetLabel = context.dataset.label || "";
            let actualScore = 0;

            if (datasetLabel === "Overall") {
              actualScore = scores[index]?.overall || 0;
            } else if (datasetLabel === "Running") {
              actualScore = scores[index]?.running || 0;
            } else if (datasetLabel === "Cycling") {
              actualScore = scores[index]?.cycling || 0;
            }

            return `${datasetLabel}: ${actualScore}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Fitness Score",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <Box sx={{ height: 400, width: "100%", mb: 4 }}>
      <Line data={chartData} options={chartOptions} />
    </Box>
  );
};

export default FitnessScoreChart;
