import { Box, Typography } from "@mui/material";

interface FitnessOverviewProps {
  currentOverall: number;
  maxOverall: number;
  avgOverall: number;
  currentRunning: number;
  maxRunning: number;
  avgRunning: number;
  currentCycling: number;
  maxCycling: number;
  avgCycling: number;
  currentWeeklyTss: number;
  maxWeeklyTss: number;
  avgWeeklyTss: number;
  currentFtp?: number;
  maxFtp?: number;
  avgFtp?: number;
}

const FitnessOverview = ({
  currentOverall,
  maxOverall,
  avgOverall,
  currentRunning,
  maxRunning,
  avgRunning,
  currentCycling,
  maxCycling,
  avgCycling,
  currentWeeklyTss,
  maxWeeklyTss,
  avgWeeklyTss,
  currentFtp,
  maxFtp,
  avgFtp,
}: FitnessOverviewProps) => {
  return (
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
        {currentFtp !== undefined && maxFtp !== undefined && avgFtp !== undefined && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              FTP (Cycling)
            </Typography>
            <Typography variant="body2">Current: {currentFtp}W</Typography>
            <Typography variant="body2">Peak: {maxFtp}W</Typography>
            <Typography variant="body2">Average: {avgFtp}W</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FitnessOverview;
