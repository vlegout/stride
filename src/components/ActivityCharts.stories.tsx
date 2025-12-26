import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";
import ActivityCharts from "./ActivityCharts";
import { ProcessedChartData } from "../utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

const mockRunningChartData: ProcessedChartData = {
  labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  speedData: [0, 3.5, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.0, 3.9, 3.2],
  hrData: [140, 145, 150, 155, 160, 162, 165, 168, 170, 168, 150],
  altitudeData: [20, 22, 25, 28, 30, 32, 35, 38, 40, 35, 20],
  powerData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  temperatureData: [18, 19, 19, 20, 21, 22, 23, 24, 24, 23, 22],
};

const mockCyclingChartData: ProcessedChartData = {
  labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
  speedData: [0, 8.5, 9.2, 9.8, 10.5, 11.2, 12.0, 13.5, 15.0, 14.0, 12.5, 11.0, 9.8, 7.5],
  hrData: [120, 135, 142, 148, 155, 162, 168, 175, 180, 165, 155, 148, 142, 125],
  altitudeData: [50, 80, 120, 180, 250, 350, 450, 550, 650, 550, 450, 350, 250, 50],
  powerData: [0, 180, 200, 220, 250, 280, 320, 380, 450, 350, 280, 240, 200, 120],
  temperatureData: [15, 16, 17, 18, 19, 20, 21, 22, 23, 22, 21, 20, 19, 18],
};

const mockLimitedData: ProcessedChartData = {
  labels: [0, 2.5, 5],
  speedData: [0, 3.8, 3.5],
  hrData: [140, 155, 150],
  altitudeData: [0, 0, 0],
  powerData: [0, 0, 0],
  temperatureData: [0, 0, 0],
};

const meta = {
  title: "Components/ActivityCharts",
  component: ActivityCharts,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Displays multiple line charts for activity data including speed, heart rate, altitude, and power. Only shows charts for data that contains valid values.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    chartData: {
      description: "Processed chart data containing arrays for different metrics",
      control: false,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityCharts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningCharts: Story = {
  args: {
    chartData: mockRunningChartData,
  },
};

export const CyclingCharts: Story = {
  args: {
    chartData: mockCyclingChartData,
  },
};

export const LimitedData: Story = {
  args: {
    chartData: mockLimitedData,
  },
};

export const NoValidData: Story = {
  args: {
    chartData: {
      labels: [],
      speedData: [],
      hrData: [],
      altitudeData: [],
      powerData: [],
      temperatureData: [],
    },
  },
};
