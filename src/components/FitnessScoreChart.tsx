import { useRef } from "react";
import { Box, IconButton, Stack, Tooltip as MuiTooltip } from "@mui/material";
import { ZoomIn, ZoomOut, RestartAlt } from "@mui/icons-material";
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
import zoomPlugin from "chartjs-plugin-zoom";
import { FitnessScore } from "../types";
import { colors } from "../colors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

interface FitnessScoreChartProps {
  scores: FitnessScore[];
  title?: string;
}

const FitnessScoreChart = ({ scores, title = "Fitness Score Over Time" }: FitnessScoreChartProps) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const labels = scores.map((score) => score.date);
  const overallScores = scores.map((score) => score.overall);
  const runningScores = scores.map((score) => score.running);
  const cyclingScores = scores.map((score) => score.cycling);
  const swimmingScores = scores.map((score) => score.swimming);

  const sampledLabels = labels.filter((_, index) => index % 7 === 0);
  const sampledOverall = overallScores.filter((_, index) => index % 7 === 0);
  const sampledRunning = runningScores.filter((_, index) => index % 7 === 0);
  const sampledCycling = cyclingScores.filter((_, index) => index % 7 === 0);
  const sampledSwimming = swimmingScores.filter((_, index) => index % 7 === 0);

  const chartData = {
    labels: sampledLabels,
    datasets: [
      {
        label: "Overall",
        data: sampledOverall,
        borderColor: colors.chart.overall,
        backgroundColor: colors.chart.overallLight,
        tension: 0.1,
      },
      {
        label: "Running",
        data: sampledRunning,
        borderColor: colors.chart.running,
        backgroundColor: colors.chart.runningLight,
        tension: 0.1,
      },
      {
        label: "Cycling",
        data: sampledCycling,
        borderColor: colors.chart.cycling,
        backgroundColor: colors.chart.cyclingLight,
        tension: 0.1,
      },
      {
        label: "Swimming",
        data: sampledSwimming,
        borderColor: colors.chart.swimming,
        backgroundColor: colors.chart.swimmingLight,
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
            } else if (datasetLabel === "Swimming") {
              actualScore = scores[index]?.swimming || 0;
            }

            return `${datasetLabel}: ${actualScore}`;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          drag: {
            enabled: true,
            backgroundColor: "rgba(255, 107, 53, 0.1)",
            borderColor: colors.primary,
            borderWidth: 1,
          },
          mode: "x" as const,
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

  const handleZoomIn = () => {
    chartRef.current?.zoom(1.2);
  };

  const handleZoomOut = () => {
    chartRef.current?.zoom(0.8);
  };

  const handleResetZoom = () => {
    chartRef.current?.resetZoom();
  };

  return (
    <Box sx={{ height: 400, width: "100%", mb: 4 }}>
      <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mb: 1 }}>
        <MuiTooltip title="Zoom in">
          <IconButton size="small" onClick={handleZoomIn}>
            <ZoomIn fontSize="small" />
          </IconButton>
        </MuiTooltip>
        <MuiTooltip title="Zoom out">
          <IconButton size="small" onClick={handleZoomOut}>
            <ZoomOut fontSize="small" />
          </IconButton>
        </MuiTooltip>
        <MuiTooltip title="Reset zoom">
          <IconButton size="small" onClick={handleResetZoom}>
            <RestartAlt fontSize="small" />
          </IconButton>
        </MuiTooltip>
      </Stack>
      <Box sx={{ height: "calc(100% - 40px)" }}>
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </Box>
    </Box>
  );
};

export default FitnessScoreChart;
