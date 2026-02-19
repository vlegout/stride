import { useState, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { fetchPowerProfile } from "../api";
import { SectionContainer } from "./ui";
import QueryBoundary from "./QueryBoundary";
import { colors } from "../colors";

const PowerProfileComparison = () => {
  const [primarySelection, setPrimarySelection] = useState<string>("overall");
  const [compareSelection, setCompareSelection] = useState<string>("");
  const chartId = useId();

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const query = useQuery({
    queryKey: ["powerProfile"],
    queryFn: fetchPowerProfile,
  });

  return (
    <QueryBoundary query={query} loadingMessage="Loading power profile...">
      {(data) => {
        const getPowerData = (selection: string): number[] => {
          if (selection === "overall") {
            return data.overall;
          }
          const year = parseInt(selection, 10);
          return data.years[year] || [];
        };

        const getLabel = (selection: string): string => {
          if (selection === "overall") {
            return "Overall";
          }
          return selection;
        };

        const datasets = [];
        const primaryData = getPowerData(primarySelection);
        if (primaryData.length > 0) {
          datasets.push({
            label: getLabel(primarySelection),
            data: primaryData.map((p) => Math.round(p)),
            borderWidth: 2,
            backgroundColor: colors.chart.powerLight,
            borderColor: colors.chart.power,
            fill: false,
          });
        }

        const hasComparison = compareSelection !== "";
        if (hasComparison) {
          const compareData = getPowerData(compareSelection);
          if (compareData.length > 0) {
            datasets.push({
              label: getLabel(compareSelection),
              data: compareData.map((p) => Math.round(p)),
              borderWidth: 2,
              backgroundColor: colors.chart.cyclingLight,
              borderColor: colors.chart.cycling,
              fill: false,
            });
          }
        }

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
            legend: { display: hasComparison },
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
          labels: data.labels,
          datasets,
        };

        const yearOptions = [
          { value: "overall", label: "Overall" },
          ...data.available_years.map((year) => ({
            value: year.toString(),
            label: year.toString(),
          })),
        ];

        const compareOptions = [
          { value: "", label: "None" },
          ...yearOptions.filter((opt) => opt.value !== primarySelection),
        ];

        return (
          <SectionContainer title="Power Profile" maxWidth="100%">
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Primary</InputLabel>
                  <Select
                    value={primarySelection}
                    label="Primary"
                    onChange={(e) => {
                      setPrimarySelection(e.target.value);
                      if (e.target.value === compareSelection) {
                        setCompareSelection("");
                      }
                    }}
                  >
                    {yearOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Compare with</InputLabel>
                  <Select
                    value={compareSelection}
                    label="Compare with"
                    onChange={(e) => setCompareSelection(e.target.value)}
                  >
                    {compareOptions.map((option) => (
                      <MenuItem key={option.value || "none"} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mb: 1, height: 500, width: "100%" }}>
              <Line id={chartId} options={chartOptions} data={lineData} />
            </Box>
          </SectionContainer>
        );
      }}
    </QueryBoundary>
  );
};

export default PowerProfileComparison;
