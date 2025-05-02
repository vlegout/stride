import { Box } from "@chakra-ui/react";
import { ChartOptions } from "chart.js";
import { DateTime } from "luxon";
import { Line } from "react-chartjs-2";

const LineChart = ({ labels, data }: { labels: string[]; data: number[] }) => {
  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    scales: {
      x: {
        ticks: {
          callback: function (this, value): string {
            return DateTime.fromSQL(this.getLabelForValue(value as number)).toFormat("HH:mm:ss");
          },
        },
      },
    },
  };

  const lineData = {
    labels: labels,
    datasets: [
      {
        data: data,
      },
    ],
  };

  return (
    <Box>
      <Line options={lineOptions} data={lineData} />
    </Box>
  );
};

export default LineChart;
