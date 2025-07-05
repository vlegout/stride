import { Box, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
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
  TooltipItem,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface FTPData {
  date: string;
  ftp: number;
}

interface FTPChartProps {
  ftp: FTPData[];
}

const FTPChart = ({ ftp }: FTPChartProps) => {
  const ftpLabels = ftp.map((ftpData) => ftpData.date);
  const ftpValues = ftp.map((ftpData) => ftpData.ftp);

  const ftpChartData = {
    labels: ftpLabels,
    datasets: [
      {
        label: "FTP (W)",
        data: ftpValues,
        borderColor: "rgb(255, 206, 84)",
        backgroundColor: "rgba(255, 206, 84, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const ftpChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Functional Threshold Power (FTP) Over Time",
      },
      tooltip: {
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            return context[0].label || "";
          },
          label: function (context: TooltipItem<"line">) {
            return `FTP: ${context.parsed.y}W`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Power (W)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Functional Threshold Power
        </Typography>
      </Box>

      <Box sx={{ height: 400, width: "100%" }}>
        <Line data={ftpChartData} options={ftpChartOptions} />
      </Box>
    </Box>
  );
};

export default FTPChart;
