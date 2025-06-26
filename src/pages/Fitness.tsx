import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
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

import PageHeader from "../components/ui/PageHeader";
import SectionContainer from "../components/ui/SectionContainer";
import LoadingIndicator from "../components/LoadingIndicator";
import { fetchFitness } from "../api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Fitness = () => {
  const {
    data: fitnessData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fitness"],
    queryFn: fetchFitness,
  });

  if (isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <PageHeader title="Fitness" />
        <LoadingIndicator />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: "100%" }}>
        <PageHeader title="Fitness" />
        <SectionContainer>
          <Typography color="error">Failed to load fitness data</Typography>
        </SectionContainer>
      </Box>
    );
  }

  if (!fitnessData?.scores || !fitnessData?.weekly_tss) {
    return (
      <Box sx={{ width: "100%" }}>
        <PageHeader title="Fitness" />
        <SectionContainer>
          <Typography>No fitness data available</Typography>
        </SectionContainer>
      </Box>
    );
  }

  const labels = fitnessData.scores.map((score) => score.date);
  const overallScores = fitnessData.scores.map((score) => score.overall);
  const runningScores = fitnessData.scores.map((score) => score.running);
  const cyclingScores = fitnessData.scores.map((score) => score.cycling);

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
        text: "Fitness Score Over Time (Past 365 Days)",
      },
      tooltip: {
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            const index = context[0].dataIndex * 7;
            return fitnessData.scores[index]?.date || "";
          },
          label: function (context: TooltipItem<"line">) {
            const index = context.dataIndex * 7;
            const datasetLabel = context.dataset.label || "";
            let actualScore = 0;

            if (datasetLabel === "Overall") {
              actualScore = fitnessData.scores[index]?.overall || 0;
            } else if (datasetLabel === "Running") {
              actualScore = fitnessData.scores[index]?.running || 0;
            } else if (datasetLabel === "Cycling") {
              actualScore = fitnessData.scores[index]?.cycling || 0;
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

  const currentOverall = overallScores[overallScores.length - 1] || 0;
  const currentRunning = runningScores[runningScores.length - 1] || 0;
  const currentCycling = cyclingScores[cyclingScores.length - 1] || 0;

  const maxOverall = Math.max(...overallScores);
  const maxRunning = Math.max(...runningScores);
  const maxCycling = Math.max(...cyclingScores);

  const avgOverall = Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length);
  const avgRunning = Math.round(runningScores.reduce((a, b) => a + b, 0) / runningScores.length);
  const avgCycling = Math.round(cyclingScores.reduce((a, b) => a + b, 0) / cyclingScores.length);

  const weeklyTssLabels = fitnessData.weekly_tss.map((week) => week.week_start);
  const weeklyTssValues = fitnessData.weekly_tss.map((week) => week.total_tss);

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
        text: "Weekly Training Stress Score (Past 52 Weeks)",
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

  const currentWeeklyTss = weeklyTssValues[weeklyTssValues.length - 1] || 0;
  const maxWeeklyTss = Math.max(...weeklyTssValues);
  const avgWeeklyTss = Math.round(weeklyTssValues.reduce((a, b) => a + b, 0) / weeklyTssValues.length);

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Fitness" />
      <SectionContainer>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Fitness Overview
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Overall Fitness
              </Typography>
              <Typography variant="body2">Current: {currentOverall}</Typography>
              <Typography variant="body2">Peak: {maxOverall}</Typography>
              <Typography variant="body2">Average: {avgOverall}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Running Fitness
              </Typography>
              <Typography variant="body2">Current: {currentRunning}</Typography>
              <Typography variant="body2">Peak: {maxRunning}</Typography>
              <Typography variant="body2">Average: {avgRunning}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Cycling Fitness
              </Typography>
              <Typography variant="body2">Current: {currentCycling}</Typography>
              <Typography variant="body2">Peak: {maxCycling}</Typography>
              <Typography variant="body2">Average: {avgCycling}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Weekly TSS
              </Typography>
              <Typography variant="body2">Current: {currentWeeklyTss}</Typography>
              <Typography variant="body2">Peak: {maxWeeklyTss}</Typography>
              <Typography variant="body2">Average: {avgWeeklyTss}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ height: 400, width: "100%", mb: 4 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </SectionContainer>

      <SectionContainer>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Weekly Training Stress Score
          </Typography>
        </Box>

        <Box sx={{ height: 400, width: "100%" }}>
          <Line data={weeklyTssChartData} options={weeklyTssChartOptions} />
        </Box>
      </SectionContainer>
    </Box>
  );
};

export default Fitness;
