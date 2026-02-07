import { Box, Typography, Tooltip } from "@mui/material";
import { motion } from "framer-motion";

import type { Sport } from "../types";
import { formatDistance, formatDuration } from "../utils";
import { colors } from "../colors";
import ActivityLogo from "./ActivityLogo";

interface SportStats {
  distance: number;
  time: number;
  count: number;
}

interface SportsBreakdownBarProps {
  breakdown: Record<string, SportStats>;
}

const sportColors: Record<Sport, string> = {
  running: colors.chart.runningMuted,
  cycling: colors.chart.cyclingMuted,
  swimming: colors.chart.swimmingMuted,
};

const SportsBreakdownBar = ({ breakdown }: SportsBreakdownBarProps) => {
  const entries = Object.entries(breakdown) as [Sport, SportStats][];

  if (entries.length === 0) return null;

  const totalDistance = entries.reduce((sum, [, stats]) => sum + stats.distance, 0);
  const totalTime = entries.reduce((sum, [, stats]) => sum + stats.time, 0);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        Sports Breakdown
      </Typography>

      {/* Distance Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Distance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDistance(totalDistance)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            height: 24,
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: colors.grey[100],
          }}
        >
          {entries.map(([sport, stats], index) => {
            const percentage = totalDistance > 0 ? (stats.distance / totalDistance) * 100 : 0;
            if (percentage === 0) return null;

            return (
              <Tooltip
                key={sport}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {sport}
                    </Typography>
                    <Typography variant="caption">
                      {formatDistance(stats.distance)} ({percentage.toFixed(0)}%)
                    </Typography>
                    <br />
                    <Typography variant="caption">{stats.count} activities</Typography>
                  </Box>
                }
                arrow
              >
                <Box
                  component={motion.div}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  sx={{
                    width: `${percentage}%`,
                    bgcolor: sportColors[sport],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transformOrigin: "left",
                    "&:hover": {
                      filter: "brightness(1.05)",
                    },
                  }}
                >
                  {percentage > 15 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <ActivityLogo sport={sport} width={14} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          fontWeight: 600,
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        {formatDistance(stats.distance)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Time Bar */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Time
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDuration(totalTime)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            height: 24,
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: colors.grey[100],
          }}
        >
          {entries.map(([sport, stats], index) => {
            const percentage = totalTime > 0 ? (stats.time / totalTime) * 100 : 0;
            if (percentage === 0) return null;

            return (
              <Tooltip
                key={sport}
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {sport}
                    </Typography>
                    <Typography variant="caption">
                      {formatDuration(stats.time)} ({percentage.toFixed(0)}%)
                    </Typography>
                    <br />
                    <Typography variant="caption">{stats.count} activities</Typography>
                  </Box>
                }
                arrow
              >
                <Box
                  component={motion.div}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  sx={{
                    width: `${percentage}%`,
                    bgcolor: sportColors[sport],
                    opacity: 0.85,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transformOrigin: "left",
                    "&:hover": {
                      opacity: 1,
                    },
                  }}
                >
                  {percentage > 15 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {formatDuration(stats.time)}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
        {entries.map(([sport, stats]) => (
          <Box key={sport} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: sportColors[sport],
              }}
            />
            <ActivityLogo sport={sport} width={14} />
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
              {sport} ({stats.count})
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SportsBreakdownBar;
