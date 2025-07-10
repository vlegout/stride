import type { Meta, StoryObj } from "@storybook/react-vite";
import PerformanceFilters from "./PerformanceFilters";

const meta = {
  title: "Components/PerformanceFilters",
  component: PerformanceFilters,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Filter controls for selecting sport, distance/duration, and year for performance data.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    sport: {
      control: "select",
      options: ["running", "cycling"],
      description: "The selected sport type",
    },
    selectedDistance: {
      control: "text",
      description: "Selected distance for cycling (in minutes)",
    },
    selectedTime: {
      control: "text",
      description: "Selected time for running (in km)",
    },
    selectedYear: {
      control: "text",
      description: "Selected year filter",
    },
  },
  args: {
    onSportChange: () => console.log("Sport changed"),
    onDistanceChange: () => console.log("Distance changed"),
    onTimeChange: () => console.log("Time changed"),
    onYearChange: () => console.log("Year changed"),
  },
} satisfies Meta<typeof PerformanceFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningMarathon: Story = {
  args: {
    sport: "running",
    selectedDistance: "",
    selectedTime: "42.195",
    selectedYear: "all",
  },
};

export const Running5K: Story = {
  args: {
    sport: "running",
    selectedDistance: "",
    selectedTime: "5",
    selectedYear: "all",
  },
};

export const CyclingOneHour: Story = {
  args: {
    sport: "cycling",
    selectedDistance: "60",
    selectedTime: "",
    selectedYear: "all",
  },
};

export const CyclingFiveMinutes: Story = {
  args: {
    sport: "cycling",
    selectedDistance: "5",
    selectedTime: "",
    selectedYear: "all",
  },
};

export const WithYearFilter: Story = {
  args: {
    sport: "running",
    selectedDistance: "",
    selectedTime: "10",
    selectedYear: "2023",
  },
};

export const CurrentYear: Story = {
  args: {
    sport: "cycling",
    selectedDistance: "20",
    selectedTime: "",
    selectedYear: new Date().getFullYear().toString(),
  },
};
