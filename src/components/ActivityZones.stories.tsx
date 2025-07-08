import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import ActivityZones from "./ActivityZones";

// Mock zone data for heart rate zones
const mockHeartRateZones = [
  { zone: 1, time: 1200, percentage: 15.8 }, // 20 minutes
  { zone: 2, time: 1800, percentage: 23.7 }, // 30 minutes
  { zone: 3, time: 2400, percentage: 31.6 }, // 40 minutes
  { zone: 4, time: 1500, percentage: 19.7 }, // 25 minutes
  { zone: 5, time: 700, percentage: 9.2 }, // 11.7 minutes
];

// Mock zone data for power zones (cycling)
const mockPowerZones = [
  { zone: 1, time: 900, percentage: 22.5 }, // 15 minutes
  { zone: 2, time: 1200, percentage: 30.0 }, // 20 minutes
  { zone: 3, time: 1080, percentage: 27.0 }, // 18 minutes
  { zone: 4, time: 600, percentage: 15.0 }, // 10 minutes
  { zone: 5, time: 220, percentage: 5.5 }, // 3.7 minutes
];

// Mock zone data for pace zones (running)
const mockPaceZones = [
  { zone: 1, time: 1800, percentage: 40.0 }, // 30 minutes
  { zone: 2, time: 1200, percentage: 26.7 }, // 20 minutes
  { zone: 3, time: 900, percentage: 20.0 }, // 15 minutes
  { zone: 4, time: 420, percentage: 9.3 }, // 7 minutes
  { zone: 5, time: 180, percentage: 4.0 }, // 3 minutes
];

// Mock sparse zone data (only some zones have data)
const mockSparseZones = [
  { zone: 1, time: 600, percentage: 33.3 }, // 10 minutes
  { zone: 2, time: 1200, percentage: 66.7 }, // 20 minutes
];

// Mock single zone data
const mockSingleZone = [
  { zone: 2, time: 2700, percentage: 100.0 }, // 45 minutes all in zone 2
];

const theme = createTheme();

const meta = {
  title: "Components/ActivityZones",
  component: ActivityZones,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays activity zone data as an interactive horizontal bar chart. Shows time spent in each training zone with color-coded bars and hover tooltips. Supports heart rate, power, and pace zones with responsive design for mobile and desktop.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    zones: {
      description: "Array of zone data with zone number, time in seconds, and percentage",
      control: false,
    },
    title: {
      description: "Title to display above the zones chart",
      control: { type: "text" },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "400px" }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ActivityZones>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeartRateZones: Story = {
  args: {
    zones: mockHeartRateZones,
    title: "Heart Rate Zones",
  },
};

export const PowerZones: Story = {
  args: {
    zones: mockPowerZones,
    title: "Power Zones",
  },
};

export const PaceZones: Story = {
  args: {
    zones: mockPaceZones,
    title: "Pace Zones",
  },
};

export const SparseZones: Story = {
  args: {
    zones: mockSparseZones,
    title: "Heart Rate Zones (Sparse Data)",
  },
};

export const SingleZone: Story = {
  args: {
    zones: mockSingleZone,
    title: "Power Zones (Single Zone)",
  },
};

export const EmptyZones: Story = {
  args: {
    zones: [],
    title: "Heart Rate Zones (No Data)",
  },
};
