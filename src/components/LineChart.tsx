import { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";

const LineChart = ({ labels, data }: { labels: number[]; data: number[] }) => {
  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    animation: false,
    scales: {
      x: {
        type: "linear",
        max: Math.max(...labels),
      },
    },
    elements: {
      point: {
        radius: 0,
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
    <>
      <Line height={"100px"} options={lineOptions} data={lineData} />
    </>
  );
};

export default LineChart;
