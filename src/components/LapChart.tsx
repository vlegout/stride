import { Box } from "@chakra-ui/react";
import { ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";

import { Lap } from "../types";

const LineChart = ({ laps }: { laps: Lap[] }) => {
  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    scales: {
      y: {
        max: Math.max(...laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60)) + 0.2,
        min: Math.min(...laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60)) - 0.2,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context): string {
            return (
              Math.floor(context.raw as number) +
              ":" +
              Math.floor(60 * ((context.raw as number) % 1))
                .toString()
                .padStart(2, "0")
            );
          },
        },
      },
    },
  };

  const barData = {
    labels: laps.map((lap: Lap) => lap.index),
    datasets: [
      {
        data: laps.map((lap: Lap) => lap.pace.minutes + lap.pace.seconds / 60),
        barPercentage: 1,
      },
    ],
  };

  return (
    <Box>
      <Bar options={barOptions} data={barData} />
    </Box>
  );
};

export default LineChart;
