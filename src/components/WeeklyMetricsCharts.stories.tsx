import type { Meta, StoryObj } from "@storybook/react-vite";
import WeeklyMetricsCharts from "./WeeklyMetricsCharts";

const meta = {
  title: "Components/WeeklyMetricsCharts",
  component: WeeklyMetricsCharts,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WeeklyMetricsCharts>;

export default meta;
type Story = StoryObj<typeof meta>;

const generateWeeklyData = (weeks: number, baseDistance: number, baseTime: number) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - weeks * 7);

  for (let i = 0; i < weeks; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 7);

    const seasonalFactor = 0.8 + 0.4 * Math.sin((i / weeks) * 2 * Math.PI);
    const randomFactor = 0.7 + Math.random() * 0.6;

    data.push({
      week_start: date.toISOString().split("T")[0],
      distance: Math.round(baseDistance * seasonalFactor * randomFactor),
      time: Math.round(baseTime * seasonalFactor * randomFactor * 10) / 10,
    });
  }

  return data;
};

export const Default: Story = {
  args: {
    weeklyRunning: generateWeeklyData(52, 35, 4.5),
    weeklyCycling: generateWeeklyData(52, 120, 6.2),
  },
};

export const LowActivity: Story = {
  args: {
    weeklyRunning: generateWeeklyData(52, 15, 2.0),
    weeklyCycling: generateWeeklyData(52, 50, 2.5),
  },
};

export const HighActivity: Story = {
  args: {
    weeklyRunning: generateWeeklyData(52, 65, 8.0),
    weeklyCycling: generateWeeklyData(52, 250, 12.5),
  },
};

export const ShortPeriod: Story = {
  args: {
    weeklyRunning: generateWeeklyData(12, 35, 4.5),
    weeklyCycling: generateWeeklyData(12, 120, 6.2),
  },
};
