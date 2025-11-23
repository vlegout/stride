import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActivityBox from "./ActivityBox";
import type { Activity } from "../types";

// Mock running activity data
const mockRunningActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  fit: "running_activity.fit",
  title: "Morning Run in Central Park",
  description: "Beautiful morning run through Central Park with perfect weather conditions",
  sport: "running",
  device: "Garmin Forerunner 945",
  race: false,
  start_time: 1640995200, // Jan 1, 2022 8:00:00 AM UTC
  total_timer_time: 2700, // 45 minutes
  total_elapsed_time: 2730, // 45.5 minutes
  total_distance: 10000, // 10km
  total_ascent: 85,
  avg_speed: 3.7, // m/s (about 13.3 km/h)
  avg_heart_rate: 155,
  max_heart_rate: 175,
  avg_power: 0,
  max_power: 0,
  np_power: 0,
  total_calories: 486,
  total_training_effect: 3.2,
  training_stress_score: 85,
  intensity_factor: 0.85,
  lat: 40.7829, // Central Park coordinates
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
    // Central Park loop - simplified GPS track
    {
      lat: 40.7829,
      lon: -73.9654,
      timestamp: "2022-01-01T08:00:00Z",
      distance: 0,
      heart_rate: 140,
      speed: 0,
      power: 0,
      altitude: 20,
    },
    {
      lat: 40.7849,
      lon: -73.9634,
      timestamp: "2022-01-01T08:02:00Z",
      distance: 300,
      heart_rate: 145,
      speed: 3.5,
      power: 0,
      altitude: 22,
    },
    {
      lat: 40.7869,
      lon: -73.9614,
      timestamp: "2022-01-01T08:04:00Z",
      distance: 600,
      heart_rate: 150,
      speed: 3.7,
      power: 0,
      altitude: 25,
    },
    {
      lat: 40.7889,
      lon: -73.9594,
      timestamp: "2022-01-01T08:06:00Z",
      distance: 900,
      heart_rate: 155,
      speed: 3.8,
      power: 0,
      altitude: 28,
    },
    {
      lat: 40.7909,
      lon: -73.9574,
      timestamp: "2022-01-01T08:08:00Z",
      distance: 1200,
      heart_rate: 160,
      speed: 3.9,
      power: 0,
      altitude: 30,
    },
    {
      lat: 40.7929,
      lon: -73.9554,
      timestamp: "2022-01-01T08:10:00Z",
      distance: 1500,
      heart_rate: 162,
      speed: 4.0,
      power: 0,
      altitude: 32,
    },
    {
      lat: 40.7939,
      lon: -73.9544,
      timestamp: "2022-01-01T08:12:00Z",
      distance: 1800,
      heart_rate: 165,
      speed: 4.1,
      power: 0,
      altitude: 35,
    },
    {
      lat: 40.7949,
      lon: -73.9534,
      timestamp: "2022-01-01T08:14:00Z",
      distance: 2100,
      heart_rate: 168,
      speed: 4.2,
      power: 0,
      altitude: 38,
    },
    {
      lat: 40.7959,
      lon: -73.9524,
      timestamp: "2022-01-01T08:16:00Z",
      distance: 2400,
      heart_rate: 170,
      speed: 4.0,
      power: 0,
      altitude: 40,
    },
    {
      lat: 40.7949,
      lon: -73.9504,
      timestamp: "2022-01-01T08:18:00Z",
      distance: 2700,
      heart_rate: 172,
      speed: 3.9,
      power: 0,
      altitude: 42,
    },
    {
      lat: 40.7939,
      lon: -73.9484,
      timestamp: "2022-01-01T08:20:00Z",
      distance: 3000,
      heart_rate: 175,
      speed: 3.8,
      power: 0,
      altitude: 45,
    },
    // Continue back to start
    {
      lat: 40.7919,
      lon: -73.9504,
      timestamp: "2022-01-01T08:25:00Z",
      distance: 4000,
      heart_rate: 168,
      speed: 3.7,
      power: 0,
      altitude: 40,
    },
    {
      lat: 40.7889,
      lon: -73.9534,
      timestamp: "2022-01-01T08:30:00Z",
      distance: 5000,
      heart_rate: 162,
      speed: 3.6,
      power: 0,
      altitude: 35,
    },
    {
      lat: 40.7859,
      lon: -73.9564,
      timestamp: "2022-01-01T08:35:00Z",
      distance: 6000,
      heart_rate: 158,
      speed: 3.5,
      power: 0,
      altitude: 30,
    },
    {
      lat: 40.7829,
      lon: -73.9594,
      timestamp: "2022-01-01T08:40:00Z",
      distance: 7000,
      heart_rate: 155,
      speed: 3.4,
      power: 0,
      altitude: 25,
    },
    {
      lat: 40.7829,
      lon: -73.9654,
      timestamp: "2022-01-01T08:45:00Z",
      distance: 10000,
      heart_rate: 150,
      speed: 3.2,
      power: 0,
      altitude: 20,
    },
  ],
  performances: [{ distance: 10000, time: "PT45M0S", activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
  performance_power: [{ time: "PT45M0S", power: 0, activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
};

// Mock cycling activity data
const mockCyclingActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  fit: "cycling_activity.fit",
  title: "Weekend Road Bike Ride",
  description: "Long endurance ride on scenic country roads",
  sport: "cycling",
  device: "Garmin Edge 530",
  race: true,
  start_time: 1641054000, // Jan 1, 2022 8:20:00 PM UTC
  total_timer_time: 7200, // 2 hours
  total_elapsed_time: 7350, // 2 hours 2.5 minutes
  total_distance: 65000, // 65km
  total_ascent: 750,
  avg_speed: 9.0, // m/s (about 32.4 km/h)
  avg_heart_rate: 145,
  max_heart_rate: 185,
  avg_power: 220,
  max_power: 580,
  np_power: 235,
  total_calories: 1850,
  total_training_effect: 4.2,
  training_stress_score: 180,
  intensity_factor: 0.92,
  lat: 45.4215, // Portland, OR area
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
    // Simplified cycling route
    {
      lat: 45.4215,
      lon: -123.1815,
      timestamp: "2022-01-01T20:20:00Z",
      distance: 0,
      heart_rate: 120,
      speed: 0,
      power: 0,
      altitude: 50,
    },
    {
      lat: 45.4315,
      lon: -123.1715,
      timestamp: "2022-01-01T20:25:00Z",
      distance: 2000,
      heart_rate: 135,
      speed: 8.5,
      power: 180,
      altitude: 80,
    },
    {
      lat: 45.4415,
      lon: -123.1615,
      timestamp: "2022-01-01T20:30:00Z",
      distance: 4000,
      heart_rate: 142,
      speed: 9.2,
      power: 200,
      altitude: 120,
    },
    {
      lat: 45.4515,
      lon: -123.1515,
      timestamp: "2022-01-01T20:35:00Z",
      distance: 6000,
      heart_rate: 148,
      speed: 9.8,
      power: 220,
      altitude: 180,
    },
    {
      lat: 45.4615,
      lon: -123.1415,
      timestamp: "2022-01-01T20:40:00Z",
      distance: 8000,
      heart_rate: 155,
      speed: 10.5,
      power: 250,
      altitude: 250,
    },
    {
      lat: 45.4715,
      lon: -123.1315,
      timestamp: "2022-01-01T20:50:00Z",
      distance: 12000,
      heart_rate: 162,
      speed: 11.2,
      power: 280,
      altitude: 350,
    },
    {
      lat: 45.4815,
      lon: -123.1215,
      timestamp: "2022-01-01T21:00:00Z",
      distance: 16000,
      heart_rate: 168,
      speed: 12.0,
      power: 320,
      altitude: 450,
    },
    {
      lat: 45.4915,
      lon: -123.1115,
      timestamp: "2022-01-01T21:10:00Z",
      distance: 20000,
      heart_rate: 175,
      speed: 13.5,
      power: 380,
      altitude: 550,
    },
    {
      lat: 45.5015,
      lon: -123.1015,
      timestamp: "2022-01-01T21:20:00Z",
      distance: 24000,
      heart_rate: 180,
      speed: 15.0,
      power: 450,
      altitude: 650,
    },
    {
      lat: 45.5115,
      lon: -123.0915,
      timestamp: "2022-01-01T21:30:00Z",
      distance: 28000,
      heart_rate: 185,
      speed: 16.5,
      power: 580,
      altitude: 750,
    },
    // Return journey
    {
      lat: 45.5015,
      lon: -123.1015,
      timestamp: "2022-01-01T21:40:00Z",
      distance: 32000,
      heart_rate: 165,
      speed: 14.0,
      power: 350,
      altitude: 650,
    },
    {
      lat: 45.4915,
      lon: -123.1115,
      timestamp: "2022-01-01T21:50:00Z",
      distance: 36000,
      heart_rate: 155,
      speed: 12.5,
      power: 280,
      altitude: 550,
    },
    {
      lat: 45.4815,
      lon: -123.1215,
      timestamp: "2022-01-01T22:00:00Z",
      distance: 40000,
      heart_rate: 148,
      speed: 11.0,
      power: 240,
      altitude: 450,
    },
    {
      lat: 45.4715,
      lon: -123.1315,
      timestamp: "2022-01-01T22:10:00Z",
      distance: 48000,
      heart_rate: 142,
      speed: 9.8,
      power: 200,
      altitude: 350,
    },
    {
      lat: 45.4615,
      lon: -123.1415,
      timestamp: "2022-01-01T22:15:00Z",
      distance: 52000,
      heart_rate: 138,
      speed: 9.2,
      power: 180,
      altitude: 250,
    },
    {
      lat: 45.4515,
      lon: -123.1515,
      timestamp: "2022-01-01T22:18:00Z",
      distance: 56000,
      heart_rate: 135,
      speed: 8.8,
      power: 160,
      altitude: 180,
    },
    {
      lat: 45.4415,
      lon: -123.1615,
      timestamp: "2022-01-01T22:19:00Z",
      distance: 60000,
      heart_rate: 132,
      speed: 8.5,
      power: 150,
      altitude: 120,
    },
    {
      lat: 45.4315,
      lon: -123.1715,
      timestamp: "2022-01-01T22:19:30Z",
      distance: 62500,
      heart_rate: 130,
      speed: 8.2,
      power: 140,
      altitude: 80,
    },
    {
      lat: 45.4215,
      lon: -123.1815,
      timestamp: "2022-01-01T22:20:00Z",
      distance: 65000,
      heart_rate: 125,
      speed: 7.5,
      power: 120,
      altitude: 50,
    },
  ],
  performances: [{ distance: 65000, time: "PT2H0M0S", activity_id: "550e8400-e29b-41d4-a716-446655440001" }],
  performance_power: [{ time: "PT2H0M0S", power: 220, activity_id: "550e8400-e29b-41d4-a716-446655440001" }],
};

// Create a QueryClient for Storybook
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const meta = {
  title: "Components/ActivityBox",
  component: ActivityBox,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Displays comprehensive activity information including title, stats, and an interactive map. Can be shown in both summary and detailed views.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    activity: {
      description: "The activity data to display",
      control: false,
    },
    isDetailed: {
      control: { type: "boolean" },
      description: "Whether to show the detailed view with expanded header",
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof ActivityBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningSummary: Story = {
  args: {
    activity: mockRunningActivity,
    isDetailed: false,
  },
};

export const RunningDetailed: Story = {
  args: {
    activity: mockRunningActivity,
    isDetailed: true,
  },
};

export const CyclingSummary: Story = {
  args: {
    activity: mockCyclingActivity,
    isDetailed: false,
  },
};

export const CyclingDetailed: Story = {
  args: {
    activity: mockCyclingActivity,
    isDetailed: true,
  },
};

export const RaceActivity: Story = {
  args: {
    activity: {
      ...mockCyclingActivity,
      title: "Weekend Criterium Race",
      race: true,
      total_distance: 45000,
      avg_speed: 12.5,
      max_heart_rate: 195,
    },
    isDetailed: false,
  },
};
