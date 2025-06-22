import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import LineChart from "./LapChart";
import { Lap } from "../types";

const theme = createTheme();

const createSampleLaps = (numLaps: number, baseMinutes = 5, baseSeconds = 30): Lap[] => {
  return Array.from({ length: numLaps }, (_, index) => ({
    index: index + 1,
    start_time: index * 300000, // 5 minutes apart in milliseconds
    total_elapsed_time: (index + 1) * 300000,
    total_distance: 1000, // 1km per lap
    max_heart_rate: 160 + Math.floor(Math.random() * 20),
    avg_heart_rate: 140 + Math.floor(Math.random() * 20),
    max_speed: 4.5 + Math.random() * 0.5,
    minutes: baseMinutes + Math.floor(Math.random() * 2) - 1, // Vary by ±1 minute
    seconds: baseSeconds + Math.floor(Math.random() * 60) - 30, // Vary by ±30 seconds
  }));
};

const meta = {
  title: "Components/LapChart",
  component: LineChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A responsive bar chart component that displays lap pace data for running activities. Shows lap times as bars with interactive tooltips and responsive design for mobile devices.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    laps: {
      description: "Array of lap data to display in the chart",
      control: { type: "object" },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: "20px", maxWidth: "600px" }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    laps: createSampleLaps(5),
  },
  parameters: {
    docs: {
      description: {
        story: "Default lap chart with 5 laps showing typical running pace variation.",
      },
    },
  },
};

export const SingleLap: Story = {
  args: {
    laps: createSampleLaps(1, 5, 15),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart with a single lap - minimal viable data.",
      },
    },
  },
};

export const ManyLaps: Story = {
  args: {
    laps: createSampleLaps(15, 4, 45),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart with many laps (15) showing how the component handles larger datasets.",
      },
    },
  },
};

export const FastPace: Story = {
  args: {
    laps: createSampleLaps(8, 3, 30), // ~3:30 pace
  },
  parameters: {
    docs: {
      description: {
        story: "Chart showing fast running pace around 3:30 per lap.",
      },
    },
  },
};

export const SlowPace: Story = {
  args: {
    laps: createSampleLaps(6, 7, 15), // ~7:15 pace
  },
  parameters: {
    docs: {
      description: {
        story: "Chart showing slower running pace around 7:15 per lap.",
      },
    },
  },
};

export const VariedPaces: Story = {
  args: {
    laps: [
      {
        index: 1,
        start_time: 0,
        total_elapsed_time: 270000,
        total_distance: 1000,
        max_heart_rate: 165,
        avg_heart_rate: 145,
        max_speed: 4.2,
        minutes: 4,
        seconds: 30,
      },
      {
        index: 2,
        start_time: 270000,
        total_elapsed_time: 600000,
        total_distance: 1000,
        max_heart_rate: 175,
        avg_heart_rate: 155,
        max_speed: 4.8,
        minutes: 5,
        seconds: 30,
      },
      {
        index: 3,
        start_time: 600000,
        total_elapsed_time: 870000,
        total_distance: 1000,
        max_heart_rate: 170,
        avg_heart_rate: 150,
        max_speed: 4.5,
        minutes: 4,
        seconds: 15,
      },
      {
        index: 4,
        start_time: 870000,
        total_elapsed_time: 1290000,
        total_distance: 1000,
        max_heart_rate: 180,
        avg_heart_rate: 165,
        max_speed: 3.8,
        minutes: 7,
        seconds: 0,
      },
      {
        index: 5,
        start_time: 1290000,
        total_elapsed_time: 1650000,
        total_distance: 1000,
        max_heart_rate: 160,
        avg_heart_rate: 140,
        max_speed: 4.6,
        minutes: 6,
        seconds: 0,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Chart showing highly varied lap paces to demonstrate the component's ability to handle significant pace variations - from fast 4:15 to slow 7:00 paces.",
      },
    },
  },
};

export const EmptyData: Story = {
  args: {
    laps: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Chart with no lap data - should render nothing.",
      },
    },
  },
};
