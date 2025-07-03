import type { Meta, StoryObj } from "@storybook/react-vite";
import TSSChart from "./TSSChart";

const meta = {
  title: "Components/TSSChart",
  component: TSSChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TSSChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const generateTSSData = (weeks: number) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - weeks * 7);

  for (let i = 0; i < weeks; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 7);

    const seasonalFactor = 0.7 + 0.6 * Math.sin((i / weeks) * 2 * Math.PI);
    const randomFactor = 0.6 + Math.abs(Math.sin(i / 8)) * 0.8;
    const baseTSS = 350;

    data.push({
      week_start: date.toISOString().split("T")[0],
      total_tss: Math.round(baseTSS * seasonalFactor * randomFactor),
    });
  }

  return data;
};

export const Default: Story = {
  args: {
    weeklyTss: generateTSSData(52),
  },
};

export const HighTrainingLoad: Story = {
  args: {
    weeklyTss: generateTSSData(52).map((week) => ({
      ...week,
      total_tss: Math.round(week.total_tss * 1.8),
    })),
  },
};

export const LowTrainingLoad: Story = {
  args: {
    weeklyTss: generateTSSData(52).map((week) => ({
      ...week,
      total_tss: Math.round(week.total_tss * 0.4),
    })),
  },
};

export const ShortPeriod: Story = {
  args: {
    weeklyTss: generateTSSData(16),
  },
};

export const HighVariability: Story = {
  args: {
    weeklyTss: generateTSSData(52).map((week, i) => ({
      ...week,
      total_tss: Math.max(0, week.total_tss + Math.sin(i / 6) * 200),
    })),
  },
};
