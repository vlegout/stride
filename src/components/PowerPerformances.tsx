import { PowerPerformance } from "../types";
import { formatInterval } from "../utils";
import { DataTable, Column, SectionContainer } from "./ui";
import { Line } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";

const PowerPerformances = ({
  performances,
  showChart = true,
  showTitle = true,
}: {
  performances: PowerPerformance[];
  showChart?: boolean;
  showTitle?: boolean;
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // Convert ISO 8601 duration to seconds for sorting
  const durationToSeconds = (duration: string): number => {
    // Parse PT format (e.g., PT1M, PT5M, PT20M, PT1H, PT30S, etc.)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    return hours * 3600 + minutes * 60 + seconds;
  };

  const allowedTimePeriods = ["PT1M", "PT5M", "PT20M", "PT1H"];
  const filteredPerformances = performances
    .filter((performance) => allowedTimePeriods.includes(performance.time))
    .sort((a, b) => durationToSeconds(a.time) - durationToSeconds(b.time));

  if (performances.length === 0) {
    return null;
  }

  const columns: Column<PowerPerformance>[] = [
    {
      id: "time",
      label: "Duration",
      format: (value) => formatInterval(value as string),
    },
    {
      id: "power",
      label: "Power (W)",
      format: (value) => `${Math.round(value as number)}W`,
    },
  ];

  // Prepare data for power curve chart (using ALL performances)
  const allSortedPerformances = [...performances]
    .filter((p) => p.power > 0) // Only include performances with actual power data
    .sort((a, b) => durationToSeconds(a.time) - durationToSeconds(b.time));

  const chartLabels = allSortedPerformances.map((p) => formatInterval(p.time));
  const chartData = allSortedPerformances.map((p) => Math.round(p.power));

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Duration",
          font: { size: isSmall ? 11 : 13 },
        },
        ticks: {
          font: { size: isSmall ? 10 : 12 },
        },
      },
      y: {
        title: {
          display: true,
          text: "Power (W)",
          font: { size: isSmall ? 11 : 13 },
        },
        ticks: {
          font: { size: isSmall ? 10 : 12 },
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Power Curve",
        font: { size: isSmall ? 14 : 16 },
        padding: { top: 10, bottom: 20 },
      },
      legend: { display: false },
      tooltip: {
        enabled: true,
        titleFont: { size: isSmall ? 12 : 14 },
        bodyFont: { size: isSmall ? 11 : 13 },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.1,
      },
    },
  };

  const lineData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartData,
        borderWidth: 2,
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        borderColor: "rgba(54, 162, 235, 1)",
        fill: false,
      },
    ],
  };

  return (
    <SectionContainer {...(showTitle ? { title: "Power Performances" } : {})} maxWidth="100%">
      {showChart && (
        <Box sx={{ mb: 1, height: 500, width: "100%" }}>
          <Line options={chartOptions} data={lineData} />
        </Box>
      )}
      {filteredPerformances.length > 0 && (
        <Box sx={{ maxWidth: 500, mx: "auto" }}>
          <DataTable
            columns={columns}
            rows={filteredPerformances}
            emptyMessage="No power performances available"
            minWidth={200}
          />
        </Box>
      )}
    </SectionContainer>
  );
};

export default PowerPerformances;
