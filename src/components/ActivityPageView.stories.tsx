import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";
import ActivityPageView from "./ActivityPageView";
import { ProcessedChartData } from "../utils";
import { Activity } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

const mockRunningActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  fit: "running_activity.fit",
  title: "Morning Run in Central Park",
  description: "Beautiful morning run through Central Park",
  sport: "running" as const,
  device: "Garmin Forerunner 945",
  race: false,
  start_time: 1640995200,
  total_timer_time: 2700,
  total_elapsed_time: 2730,
  total_distance: 10000,
  total_ascent: 85,
  avg_speed: 3.7,
  avg_heart_rate: 155,
  max_heart_rate: 175,
  avg_power: 0,
  max_power: 0,
  np_power: 0,
  total_calories: 486,
  total_training_effect: 3.2,
  training_stress_score: 85,
  intensity_factor: 0.85,
  lat: 40.7829,
  lon: -73.9654,
  delta_lat: 0.005,
  delta_lon: 0.008,
  city: "New York",
  country: "United States",
  laps: [
    {
      index: 1,
      start_time: 1640995200,
      total_elapsed_time: 2700,
      total_timer_time: 2700,
      total_distance: 10000,
      max_heart_rate: 175,
      avg_heart_rate: 155,
      max_speed: 4.2,
    },
  ],
  tracepoints: [
    {
      lat: 40.7829,
      lng: -73.9654,
      timestamp: "2022-01-01T08:00:00Z",
      distance: 0,
      heart_rate: 140,
      speed: 0,
      power: 0,
      altitude: 20,
    },
    {
      lat: 40.7849,
      lng: -73.9634,
      timestamp: "2022-01-01T08:45:00Z",
      distance: 10000,
      heart_rate: 150,
      speed: 3.7,
      power: 0,
      altitude: 25,
    },
  ],
  performances: [{ distance: 10000, time: "PT45M0S" }],
  performance_power: [{ time: "PT45M0S", power: 0 }],
};

const mockCyclingActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  fit: "cycling_activity.fit",
  title: "Weekend Road Bike Ride",
  description: "Long endurance ride on scenic country roads",
  sport: "cycling" as const,
  device: "Garmin Edge 530",
  race: true,
  start_time: 1641054000,
  total_timer_time: 7200,
  total_elapsed_time: 7350,
  total_distance: 65000,
  total_ascent: 750,
  avg_speed: 9.0,
  avg_heart_rate: 145,
  max_heart_rate: 185,
  avg_power: 220,
  max_power: 580,
  np_power: 235,
  total_calories: 1850,
  total_training_effect: 4.2,
  training_stress_score: 180,
  intensity_factor: 0.92,
  lat: 45.4215,
  lon: -123.1815,
  delta_lat: 0.15,
  delta_lon: 0.2,
  city: "Portland",
  country: "United States",
  laps: [
    {
      index: 1,
      start_time: 1641054000,
      total_elapsed_time: 7200,
      total_timer_time: 7200,
      total_distance: 65000,
      max_heart_rate: 185,
      avg_heart_rate: 145,
      max_speed: 16.8,
    },
  ],
  tracepoints: [
    {
      lat: 45.4215,
      lng: -123.1815,
      timestamp: "2022-01-01T20:20:00Z",
      distance: 0,
      heart_rate: 120,
      speed: 0,
      power: 0,
      altitude: 50,
    },
    {
      lat: 45.5115,
      lng: -123.0915,
      timestamp: "2022-01-01T22:20:00Z",
      distance: 65000,
      heart_rate: 145,
      speed: 9.0,
      power: 220,
      altitude: 50,
    },
  ],
  performances: [{ distance: 65000, time: "PT2H0M0S" }],
  performance_power: [{ time: "PT2H0M0S", power: 220 }],
};

const runningChartData: ProcessedChartData = {
  labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  speedData: [0, 3.5, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 4.0, 3.9, 3.2],
  hrData: [140, 145, 150, 155, 160, 162, 165, 168, 170, 168, 150],
  altitudeData: [20, 22, 25, 28, 30, 32, 35, 38, 40, 35, 20],
  powerData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const cyclingChartData: ProcessedChartData = {
  labels: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
  speedData: [0, 8.5, 9.2, 9.8, 10.5, 11.2, 12.0, 13.5, 15.0, 14.0, 12.5, 11.0, 9.8, 7.5],
  hrData: [120, 135, 142, 148, 155, 162, 168, 175, 180, 165, 155, 148, 142, 125],
  altitudeData: [50, 80, 120, 180, 250, 350, 450, 550, 650, 550, 450, 350, 250, 50],
  powerData: [0, 180, 200, 220, 250, 280, 320, 380, 450, 350, 280, 240, 200, 120],
};

const meta = {
  title: "Components/ActivityPageView",
  component: ActivityPageView,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Complete activity detail view showing activity summary, lap chart, performances, and multiple data charts. For cycling activities, also shows power performances.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    data: {
      description: "Complete activity data object",
      control: false,
    },
    chartData: {
      description: "Processed chart data for line charts",
      control: false,
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ActivityPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningActivity: Story = {
  args: {
    data: mockRunningActivity,
    chartData: runningChartData,
  },
};

export const CyclingActivity: Story = {
  args: {
    data: mockCyclingActivity,
    chartData: cyclingChartData,
  },
};

export const RaceActivity: Story = {
  args: {
    data: {
      ...mockRunningActivity,
      race: true,
      title: "10K Race",
      description: "Personal best attempt at local 10K race",
    },
    chartData: runningChartData,
  },
};
