import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import LineChart from "./LapChart";
import { Lap } from "../types";

const theme = createTheme();

const createSampleLaps = (numLaps: number, baseTimeSeconds = 330): Lap[] => {
  return Array.from({ length: numLaps }, (_, index) => {
    const lapTime = baseTimeSeconds + ((index % 3) * 10 - 10);
    const distance = 750 + (index % 4) * 100;
    return {
      index: index + 1,
      start_time: index * lapTime,
      total_elapsed_time: lapTime,
      total_timer_time: lapTime,
      total_distance: distance,
      max_heart_rate: 160 + (index % 3) * 5,
      avg_heart_rate: 140 + (index % 4) * 5,
      max_speed: 0,
    };
  });
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
    sport: {
      description: "Sport type - determines whether to show pace (running) or speed (cycling)",
      control: { type: "select" },
      options: ["running", "cycling"],
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
    sport: "running",
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
    laps: createSampleLaps(1, 315),
    sport: "running",
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
    laps: createSampleLaps(15, 285),
    sport: "running",
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
    laps: createSampleLaps(8, 210),
    sport: "running",
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
    laps: createSampleLaps(6, 435),
    sport: "running",
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
        total_elapsed_time: 270,
        total_timer_time: 270,
        total_distance: 1000,
        max_heart_rate: 165,
        avg_heart_rate: 145,
        max_speed: 0,
      },
      {
        index: 2,
        start_time: 270,
        total_elapsed_time: 330,
        total_timer_time: 330,
        total_distance: 1000,
        max_heart_rate: 175,
        avg_heart_rate: 155,
        max_speed: 0,
      },
      {
        index: 3,
        start_time: 600,
        total_elapsed_time: 255,
        total_timer_time: 255,
        total_distance: 1000,
        max_heart_rate: 170,
        avg_heart_rate: 150,
        max_speed: 0,
      },
      {
        index: 4,
        start_time: 855,
        total_elapsed_time: 420,
        total_timer_time: 420,
        total_distance: 1000,
        max_heart_rate: 180,
        avg_heart_rate: 165,
        max_speed: 0,
      },
      {
        index: 5,
        start_time: 1275,
        total_elapsed_time: 360,
        total_timer_time: 360,
        total_distance: 1000,
        max_heart_rate: 160,
        avg_heart_rate: 140,
        max_speed: 0,
      },
    ],
    sport: "running",
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
    sport: "running",
  },
  parameters: {
    docs: {
      description: {
        story: "Chart with no lap data - should render nothing.",
      },
    },
  },
};

export const Cycling: Story = {
  args: {
    laps: createSampleLaps(5),
    sport: "cycling",
  },
  parameters: {
    docs: {
      description: {
        story: "Cycling lap chart showing speed calculated from distance and time.",
      },
    },
  },
};

export const CyclingFast: Story = {
  args: {
    laps: createSampleLaps(8, 210),
    sport: "cycling",
  },
  parameters: {
    docs: {
      description: {
        story: "Fast cycling laps showing higher calculated speeds from shorter lap times.",
      },
    },
  },
};
