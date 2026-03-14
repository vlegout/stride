import { Box, CircularProgress, Typography } from "@mui/material";
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
import QueryBoundary from "../components/QueryBoundary";
import FitnessOverview from "../components/FitnessOverview";
import FitnessScoreChart from "../components/FitnessScoreChart";
import WeeklyMetricsCharts from "../components/WeeklyMetricsCharts";
import WeeklyZonesCharts from "../components/WeeklyZonesCharts";
import TSSChart from "../components/TSSChart";
import FTPChart from "../components/FTPChart";
import DateSelector, { type DateRangeOption } from "../components/DateSelector";
import { fetchFitnessScores, fetchFitnessZones, fetchFitnessFtp } from "../api";
import { filterDataByDateRange, filterWeeklyDataByDateRange, getDateRangeLabel } from "../utils/date";
import type { WeeklyZoneData, FtpData } from "../types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Fitness = () => {
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("1y");

  const scoresQuery = useQuery({
    queryKey: ["fitness", "scores"],
    queryFn: fetchFitnessScores,
  });

  const zonesQuery = useQuery({
    queryKey: ["fitness", "zones"],
    queryFn: fetchFitnessZones,
  });

  const ftpQuery = useQuery({
    queryKey: ["fitness", "ftp"],
    queryFn: fetchFitnessFtp,
  });

  return (
    <QueryBoundary query={scoresQuery} loadingMessage="Loading fitness data...">
      {(scoresData) => {
        if (!scoresData?.scores || !scoresData?.weekly_tss) {
          return (
            <Box sx={{ width: "100%" }}>
              <PageHeader title="Fitness" />
              <SectionContainer>
                <Typography>No fitness data available</Typography>
              </SectionContainer>
            </Box>
          );
        }

        const filteredScores = filterDataByDateRange(scoresData.scores, selectedRange);
        const filteredWeeklyTss = filterWeeklyDataByDateRange(scoresData.weekly_tss, selectedRange);
        const filteredWeeklyRunning = filterWeeklyDataByDateRange(scoresData.weekly_running, selectedRange);
        const filteredWeeklyCycling = filterWeeklyDataByDateRange(scoresData.weekly_cycling, selectedRange);
        const filteredWeeklySwimming = filterWeeklyDataByDateRange(scoresData.weekly_swimming || [], selectedRange);

        const overallScores = filteredScores.map((score) => score.overall);
        const runningScores = filteredScores.map((score) => score.running);
        const cyclingScores = filteredScores.map((score) => score.cycling);
        const swimmingScores = filteredScores.map((score) => score.swimming);

        const currentOverall = overallScores[overallScores.length - 1] || 0;
        const currentRunning = runningScores[runningScores.length - 1] || 0;
        const currentCycling = cyclingScores[cyclingScores.length - 1] || 0;
        const currentSwimming = swimmingScores[swimmingScores.length - 1] || 0;

        const maxOverall = overallScores.length > 0 ? Math.max(...overallScores) : 0;
        const maxRunning = runningScores.length > 0 ? Math.max(...runningScores) : 0;
        const maxCycling = cyclingScores.length > 0 ? Math.max(...cyclingScores) : 0;
        const maxSwimming = swimmingScores.length > 0 ? Math.max(...swimmingScores) : 0;

        const avgOverall =
          overallScores.length > 0 ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length) : 0;
        const avgRunning =
          runningScores.length > 0 ? Math.round(runningScores.reduce((a, b) => a + b, 0) / runningScores.length) : 0;
        const avgCycling =
          cyclingScores.length > 0 ? Math.round(cyclingScores.reduce((a, b) => a + b, 0) / cyclingScores.length) : 0;
        const avgSwimming =
          swimmingScores.length > 0 ? Math.round(swimmingScores.reduce((a, b) => a + b, 0) / swimmingScores.length) : 0;

        const weeklyTssValues = filteredWeeklyTss.map((week) => week.total_tss);
        const currentWeeklyTss = weeklyTssValues[weeklyTssValues.length - 1] || 0;
        const maxWeeklyTss = weeklyTssValues.length > 0 ? Math.max(...weeklyTssValues) : 0;
        const avgWeeklyTss =
          weeklyTssValues.length > 0
            ? Math.round(weeklyTssValues.reduce((a, b) => a + b, 0) / weeklyTssValues.length)
            : 0;

        const filteredFtp: FtpData[] = ftpQuery.data ? filterDataByDateRange(ftpQuery.data.ftp, selectedRange) : [];
        const ftpValues = filteredFtp.map((ftp) => ftp.ftp);
        const currentFtp = ftpValues.length > 0 ? ftpValues[ftpValues.length - 1] : undefined;
        const maxFtp = ftpValues.length > 0 ? Math.max(...ftpValues) : undefined;
        const avgFtp =
          ftpValues.length > 0 ? Math.round(ftpValues.reduce((a, b) => a + b, 0) / ftpValues.length) : undefined;

        const filteredWeeklyZones: WeeklyZoneData[] = zonesQuery.data
          ? filterWeeklyDataByDateRange(zonesQuery.data.weekly_zones, selectedRange)
          : [];

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
                currentSwimming={currentSwimming}
                maxSwimming={maxSwimming}
                avgSwimming={avgSwimming}
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

            {zonesQuery.isPending ? (
              <SectionContainer>
                <Box display="flex" alignItems="center" gap={2} py={2}>
                  <CircularProgress size={20} />
                  <Typography color="text.secondary">Loading zone data...</Typography>
                </Box>
              </SectionContainer>
            ) : filteredWeeklyZones.length > 0 ? (
              <SectionContainer>
                <WeeklyZonesCharts weeklyZones={filteredWeeklyZones} />
              </SectionContainer>
            ) : null}

            {ftpQuery.isPending ? (
              <SectionContainer>
                <Box display="flex" alignItems="center" gap={2} py={2}>
                  <CircularProgress size={20} />
                  <Typography color="text.secondary">Loading FTP data...</Typography>
                </Box>
              </SectionContainer>
            ) : filteredFtp.length > 0 ? (
              <SectionContainer>
                <FTPChart ftp={filteredFtp} />
              </SectionContainer>
            ) : null}
          </Box>
        );
      }}
    </QueryBoundary>
  );
};

export default Fitness;
