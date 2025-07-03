import type { Meta, StoryObj } from "@storybook/react-vite";
import FitnessScoreChart from "./FitnessScoreChart";

const meta = {
  title: "Components/FitnessScoreChart",
  component: FitnessScoreChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FitnessScoreChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const generateMockScores = (days: number) => {
  const scores = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    const overall = Math.max(0, 75 + Math.sin(i / 30) * 15 + Math.cos(i / 20) * 5);
    const running = Math.max(0, overall * (0.8 + Math.sin(i / 40) * 0.2));
    const cycling = Math.max(0, overall * (0.6 + Math.cos(i / 35) * 0.2));

    scores.push({
      date: date.toISOString().split("T")[0],
      overall: Math.round(overall),
      running: Math.round(running),
      cycling: Math.round(cycling),
    });
  }

  return scores;
};

export const Default: Story = {
  args: {
    scores: generateMockScores(365),
  },
};

export const ShortPeriod: Story = {
  args: {
    scores: generateMockScores(90),
  },
};

export const HighVariability: Story = {
  args: {
    scores: generateMockScores(365).map((score, i) => ({
      ...score,
      overall: Math.max(0, score.overall + Math.sin(i / 25) * 15),
      running: Math.round(Math.max(0, score.running + Math.cos(i / 20) * 12.5)),
      cycling: Math.round(Math.max(0, score.cycling + Math.sin(i / 18) * 12.5)),
    })),
  },
};
