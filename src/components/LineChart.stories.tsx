import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import LineChart from "./LineChart";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const theme = createTheme();

const meta = {
  title: "Components/LineChart",
  component: LineChart,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A responsive line chart component using Chart.js. Optimized for mobile viewing with configurable data points and labels.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ width: "600px", height: "200px" }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    labels: {
      description: "Array of numeric labels for the x-axis",
      control: { type: "object" },
    },
    data: {
      description: "Array of numeric data points for the y-axis",
      control: { type: "object" },
    },
    title: {
      description: "Optional chart title",
      control: { type: "text" },
    },
    xAxisLabel: {
      description: "Optional label for the x-axis",
      control: { type: "text" },
    },
    yAxisLabel: {
      description: "Optional label for the y-axis",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    data: [12, 19, 3, 5, 2, 3, 15, 8, 12, 7],
  },
};

export const WithLabels: Story = {
  args: {
    labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    data: [12, 19, 3, 5, 2, 3, 15, 8, 12, 7],
    title: "Sample Chart",
    xAxisLabel: "Time (minutes)",
    yAxisLabel: "Value",
  },
};

export const PerformanceData: Story = {
  args: {
    labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    data: [180, 175, 185, 190, 188, 192, 195, 200, 198, 205, 202],
    title: "Heart Rate Performance",
    xAxisLabel: "Distance (km)",
    yAxisLabel: "Heart Rate (bpm)",
  },
};

export const SinglePoint: Story = {
  args: {
    labels: [1],
    data: [100],
  },
};

export const LargeDataset: Story = {
  args: {
    labels: Array.from({ length: 50 }, (_, i) => i + 1),
    data: Array.from({ length: 50 }, (_, i) => 50 + ((i * 17 + 23) % 100)),
  },
};
