import type { Meta, StoryObj } from "@storybook/react-vite";
import FTPChart from "./FTPChart";

const meta = {
  title: "Components/FTPChart",
  component: FTPChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FTPChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const generateFTPData = (dataPoints: number, baseFTP: number) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - dataPoints * 30);

  let currentFTP = baseFTP;

  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 30);

    const trend = Math.sin((i / dataPoints) * Math.PI) * 0.1;
    const noise = Math.sin(i / 7) * 0.025;
    currentFTP = Math.round(currentFTP * (1 + trend + noise));

    data.push({
      date: date.toISOString().split("T")[0],
      ftp: currentFTP,
    });
  }

  return data;
};

export const Default: Story = {
  args: {
    ftp: generateFTPData(12, 280),
  },
};

export const ProgressiveImprovement: Story = {
  args: {
    ftp: [
      { date: "2024-01-01", ftp: 250 },
      { date: "2024-02-01", ftp: 255 },
      { date: "2024-03-01", ftp: 268 },
      { date: "2024-04-01", ftp: 275 },
      { date: "2024-05-01", ftp: 282 },
      { date: "2024-06-01", ftp: 290 },
      { date: "2024-07-01", ftp: 295 },
      { date: "2024-08-01", ftp: 305 },
      { date: "2024-09-01", ftp: 308 },
      { date: "2024-10-01", ftp: 315 },
      { date: "2024-11-01", ftp: 320 },
      { date: "2024-12-01", ftp: 325 },
    ],
  },
};

export const HighFTP: Story = {
  args: {
    ftp: generateFTPData(12, 400),
  },
};

export const LowFTP: Story = {
  args: {
    ftp: generateFTPData(12, 180),
  },
};

export const SingleDataPoint: Story = {
  args: {
    ftp: [{ date: "2024-06-01", ftp: 280 }],
  },
};

export const FewDataPoints: Story = {
  args: {
    ftp: [
      { date: "2024-01-01", ftp: 250 },
      { date: "2024-06-01", ftp: 280 },
      { date: "2024-12-01", ftp: 290 },
    ],
  },
};
