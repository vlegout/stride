import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
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
} from "chart.js";

import PageHeader from "../components/ui/PageHeader";
import SectionContainer from "../components/ui/SectionContainer";
import LoadingIndicator from "../components/LoadingIndicator";
import FitnessOverview from "../components/FitnessOverview";
import FitnessScoreChart from "../components/FitnessScoreChart";
import WeeklyMetricsCharts from "../components/WeeklyMetricsCharts";
import TSSChart from "../components/TSSChart";
import FTPChart from "../components/FTPChart";
import { fetchFitness } from "../api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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

  const overallScores = fitnessData.scores.map((score) => score.overall);
  const runningScores = fitnessData.scores.map((score) => score.running);
  const cyclingScores = fitnessData.scores.map((score) => score.cycling);

  const currentOverall = overallScores[overallScores.length - 1] || 0;
  const currentRunning = runningScores[runningScores.length - 1] || 0;
  const currentCycling = cyclingScores[cyclingScores.length - 1] || 0;

  const maxOverall = Math.max(...overallScores);
  const maxRunning = Math.max(...runningScores);
  const maxCycling = Math.max(...cyclingScores);

  const avgOverall = Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length);
  const avgRunning = Math.round(runningScores.reduce((a, b) => a + b, 0) / runningScores.length);
  const avgCycling = Math.round(cyclingScores.reduce((a, b) => a + b, 0) / cyclingScores.length);

  const weeklyTssValues = fitnessData.weekly_tss.map((week) => week.total_tss);
  const currentWeeklyTss = weeklyTssValues[weeklyTssValues.length - 1] || 0;
  const maxWeeklyTss = Math.max(...weeklyTssValues);
  const avgWeeklyTss = Math.round(weeklyTssValues.reduce((a, b) => a + b, 0) / weeklyTssValues.length);

  const ftpValues = fitnessData.ftp?.map((ftp) => ftp.ftp) || [];
  const currentFtp = ftpValues.length > 0 ? ftpValues[ftpValues.length - 1] : undefined;
  const maxFtp = ftpValues.length > 0 ? Math.max(...ftpValues) : undefined;
  const avgFtp = ftpValues.length > 0 ? Math.round(ftpValues.reduce((a, b) => a + b, 0) / ftpValues.length) : undefined;

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Fitness" />
      <SectionContainer>
        <FitnessOverview
          currentOverall={currentOverall}
          maxOverall={maxOverall}
          avgOverall={avgOverall}
          currentRunning={currentRunning}
          maxRunning={maxRunning}
          avgRunning={avgRunning}
          currentCycling={currentCycling}
          maxCycling={maxCycling}
          avgCycling={avgCycling}
          currentWeeklyTss={currentWeeklyTss}
          maxWeeklyTss={maxWeeklyTss}
          avgWeeklyTss={avgWeeklyTss}
          {...(currentFtp !== undefined && { currentFtp })}
          {...(maxFtp !== undefined && { maxFtp })}
          {...(avgFtp !== undefined && { avgFtp })}
        />

        <FitnessScoreChart scores={fitnessData.scores} />
      </SectionContainer>

      <SectionContainer>
        <WeeklyMetricsCharts weeklyRunning={fitnessData.weekly_running} weeklyCycling={fitnessData.weekly_cycling} />
      </SectionContainer>

      <SectionContainer>
        <TSSChart weeklyTss={fitnessData.weekly_tss} />
      </SectionContainer>

      {fitnessData.ftp && fitnessData.ftp.length > 0 && (
        <SectionContainer>
          <FTPChart ftp={fitnessData.ftp} />
        </SectionContainer>
      )}
    </Box>
  );
};

export default Fitness;
