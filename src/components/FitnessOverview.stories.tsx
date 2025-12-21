import type { Meta, StoryObj } from "@storybook/react-vite";
import FitnessOverview from "./FitnessOverview";

const meta = {
  title: "Components/FitnessOverview",
  component: FitnessOverview,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FitnessOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentOverall: 85,
    maxOverall: 92,
    avgOverall: 78,
    currentRunning: 88,
    maxRunning: 95,
    avgRunning: 82,
    currentCycling: 75,
    maxCycling: 88,
    avgCycling: 70,
    currentSwimming: 65,
    maxSwimming: 80,
    avgSwimming: 60,
    currentWeeklyTss: 420,
    maxWeeklyTss: 650,
    avgWeeklyTss: 385,
  },
};

export const WithFTP: Story = {
  args: {
    currentOverall: 85,
    maxOverall: 92,
    avgOverall: 78,
    currentRunning: 88,
    maxRunning: 95,
    avgRunning: 82,
    currentCycling: 75,
    maxCycling: 88,
    avgCycling: 70,
    currentSwimming: 65,
    maxSwimming: 80,
    avgSwimming: 60,
    currentWeeklyTss: 420,
    maxWeeklyTss: 650,
    avgWeeklyTss: 385,
    currentFtp: 285,
    maxFtp: 305,
    avgFtp: 275,
  },
};

export const LowValues: Story = {
  args: {
    currentOverall: 35,
    maxOverall: 45,
    avgOverall: 40,
    currentRunning: 30,
    maxRunning: 40,
    avgRunning: 35,
    currentCycling: 25,
    maxCycling: 35,
    avgCycling: 30,
    currentSwimming: 20,
    maxSwimming: 30,
    avgSwimming: 25,
    currentWeeklyTss: 150,
    maxWeeklyTss: 300,
    avgWeeklyTss: 200,
    currentFtp: 180,
    maxFtp: 200,
    avgFtp: 185,
  },
};
