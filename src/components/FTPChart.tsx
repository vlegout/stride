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
  type TooltipItem,
} from "chart.js";
import type { FtpData } from "../types";
import { colors } from "../colors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface FTPChartProps {
  ftp: FtpData[];
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
        borderColor: colors.chart.power,
        backgroundColor: colors.chart.powerLight,
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
          title: (context: TooltipItem<"line">[]) => context[0].label || "",
          label: (context: TooltipItem<"line">) => `FTP: ${context.parsed.y}W`,
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
