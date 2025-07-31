import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";

import { PerformanceRecordPublic } from "../types";
import { formatTime, formatDistance } from "../utils";

interface PerformanceRecordsProps {
  records: PerformanceRecordPublic[];
}

const PerformanceRecords: React.FC<PerformanceRecordsProps> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No performance records for this activity
        </Typography>
      </Box>
    );
  }

  const formatRecordValue = (record: PerformanceRecordPublic) => {
    if (record.metric_type.includes("_time")) {
      // Time-based records (e.g., "1000m_time")
      return formatTime(record.value);
    } else if (record.metric_type.includes("_power")) {
      // Power-based records (e.g., "300s_power")
      return `${Math.round(record.value)}W`;
    }
    return record.value.toString();
  };

  const formatMetricType = (metricType: string) => {
    if (metricType.includes("_time")) {
      const distance = metricType.replace("m_time", "");
      return `${formatDistance(parseInt(distance))} Time`;
    } else if (metricType.includes("_power")) {
      const time = metricType.replace("s_power", "");
      return `${time}s Power`;
    }
    return metricType;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "gold";
      case 2:
        return "silver";
      case 3:
        return "#CD7F32"; // bronze
      default:
        return "primary";
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  // Group records by scope
  const yearRecords = records.filter((r) => r.scope === "year");
  const allTimeRecords = records.filter((r) => r.scope === "all_time");

  const RecordCard = ({ record }: { record: PerformanceRecordPublic }) => (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            {formatMetricType(record.metric_type)}
          </Typography>
          <Chip
            label={getRankEmoji(record.rank)}
            size="small"
            sx={{
              bgcolor: getRankColor(record.rank),
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>

        <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold", color: "primary.main" }}>
          {formatRecordValue(record)}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Rank #{record.rank} • {record.scope === "year" ? `${record.year}` : "All Time"}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        🏆 Performance Records
      </Typography>

      {yearRecords.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
            Year Records ({yearRecords[0]?.year})
          </Typography>
          <Grid container spacing={2}>
            {yearRecords.map((record) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={record.id}>
                <RecordCard record={record} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {allTimeRecords.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
            All-Time Records
          </Typography>
          <Grid container spacing={2}>
            {allTimeRecords.map((record) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={record.id}>
                <RecordCard record={record} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PerformanceRecords;
