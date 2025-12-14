import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import WeeklyZonesCharts from "../components/WeeklyZonesCharts";
import TSSChart from "../components/TSSChart";
import FTPChart from "../components/FTPChart";
import DateSelector, { DateRangeOption } from "../components/DateSelector";
import { fetchFitness } from "../api";
import { filterDataByDateRange, filterWeeklyDataByDateRange, getDateRangeLabel } from "../utils/date";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Fitness = () => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("1y");

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

  const filteredScores = filterDataByDateRange(fitnessData.scores, selectedRange);
  const filteredWeeklyTss = filterWeeklyDataByDateRange(fitnessData.weekly_tss, selectedRange);
  const filteredWeeklyRunning = filterWeeklyDataByDateRange(fitnessData.weekly_running, selectedRange);
  const filteredWeeklyCycling = filterWeeklyDataByDateRange(fitnessData.weekly_cycling, selectedRange);
  const filteredWeeklySwimming = filterWeeklyDataByDateRange(fitnessData.weekly_swimming || [], selectedRange);
  const filteredWeeklyZones = fitnessData.weekly_zones
    ? filterWeeklyDataByDateRange(fitnessData.weekly_zones, selectedRange)
    : [];
  const filteredFtp = fitnessData.ftp ? filterDataByDateRange(fitnessData.ftp, selectedRange) : [];

  const overallScores = filteredScores.map((score) => score.overall);
  const runningScores = filteredScores.map((score) => score.running);
  const cyclingScores = filteredScores.map((score) => score.cycling);

  const currentOverall = overallScores[overallScores.length - 1] || 0;
  const currentRunning = runningScores[runningScores.length - 1] || 0;
  const currentCycling = cyclingScores[cyclingScores.length - 1] || 0;

  const maxOverall = overallScores.length > 0 ? Math.max(...overallScores) : 0;
  const maxRunning = runningScores.length > 0 ? Math.max(...runningScores) : 0;
  const maxCycling = cyclingScores.length > 0 ? Math.max(...cyclingScores) : 0;

  const avgOverall =
    overallScores.length > 0 ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length) : 0;
  const avgRunning =
    runningScores.length > 0 ? Math.round(runningScores.reduce((a, b) => a + b, 0) / runningScores.length) : 0;
  const avgCycling =
    cyclingScores.length > 0 ? Math.round(cyclingScores.reduce((a, b) => a + b, 0) / cyclingScores.length) : 0;

  const weeklyTssValues = filteredWeeklyTss.map((week) => week.total_tss);
  const currentWeeklyTss = weeklyTssValues[weeklyTssValues.length - 1] || 0;
  const maxWeeklyTss = weeklyTssValues.length > 0 ? Math.max(...weeklyTssValues) : 0;
  const avgWeeklyTss =
    weeklyTssValues.length > 0 ? Math.round(weeklyTssValues.reduce((a, b) => a + b, 0) / weeklyTssValues.length) : 0;

  const ftpValues = filteredFtp.map((ftp) => ftp.ftp);
  const currentFtp = ftpValues.length > 0 ? ftpValues[ftpValues.length - 1] : undefined;
  const maxFtp = ftpValues.length > 0 ? Math.max(...ftpValues) : undefined;
  const avgFtp = ftpValues.length > 0 ? Math.round(ftpValues.reduce((a, b) => a + b, 0) / ftpValues.length) : undefined;

  return (
    <Box sx={{ width: "100%" }}>
      <PageHeader title="Fitness" />
      <SectionContainer>
        <DateSelector selectedRange={selectedRange} onChange={setSelectedRange} />
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

        <FitnessScoreChart
          scores={filteredScores}
          title={`Fitness Score Over Time (Past ${getDateRangeLabel(selectedRange)})`}
        />
      </SectionContainer>

      <SectionContainer>
        <WeeklyMetricsCharts
          weeklyRunning={filteredWeeklyRunning}
          weeklyCycling={filteredWeeklyCycling}
          weeklySwimming={filteredWeeklySwimming}
        />
      </SectionContainer>

      <SectionContainer>
        <TSSChart weeklyTss={filteredWeeklyTss} />
      </SectionContainer>

      {filteredWeeklyZones.length > 0 && (
        <SectionContainer>
          <WeeklyZonesCharts weeklyZones={filteredWeeklyZones} />
        </SectionContainer>
      )}

      {filteredFtp.length > 0 && (
        <SectionContainer>
          <FTPChart ftp={filteredFtp} />
        </SectionContainer>
      )}
    </Box>
  );
};

export default Fitness;
