import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chart as ChartJS, CategoryScale, BarElement, LinearScale, Tooltip, LineElement, PointElement } from "chart.js";

import ActivityPageView from "./ActivityPageView";
import { Activity } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip);

// Mock zone data for testing
const mockZoneData = {
  heartRate: [
    { zone: 1, time: 900, percentage: 22.5 },
    { zone: 2, time: 1200, percentage: 30.0 },
    { zone: 3, time: 1080, percentage: 27.0 },
    { zone: 4, time: 600, percentage: 15.0 },
    { zone: 5, time: 220, percentage: 5.5 },
  ],
  power: [
    { zone: 1, time: 1200, percentage: 25.0 },
    { zone: 2, time: 1800, percentage: 37.5 },
    { zone: 3, time: 900, percentage: 18.8 },
    { zone: 4, time: 600, percentage: 12.5 },
    { zone: 5, time: 300, percentage: 6.2 },
  ],
  pace: [
    { zone: 1, time: 1800, percentage: 40.0 },
    { zone: 2, time: 1200, percentage: 26.7 },
    { zone: 3, time: 900, percentage: 20.0 },
    { zone: 4, time: 420, percentage: 9.3 },
    { zone: 5, time: 180, percentage: 4.0 },
  ],
};

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
  performances: [{ distance: 10000, time: "PT45M0S", activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
  performance_power: [{ time: "PT45M0S", power: 0, activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
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
      altitude: 40,
    },
    {
      lat: 45.4815,
      lng: -123.0815,
      timestamp: "2022-01-01T20:30:00Z",
      distance: 50000,
      heart_rate: 130,
      speed: 12.0,
      power: 120,
      altitude: 45,
    },
    {
      lat: 45.5115,
      lng: -123.0915,
      timestamp: "2022-01-01T22:40:00Z",
      distance: 65000,
      heart_rate: 145,
      speed: 34.0,
      power: 220,
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

// Add mock zone data to the query client
const setupMockData = (client: QueryClient) => {
  client.setQueryData(["activityZones", "550e8400-e29b-41d4-a716-446655440000"], mockZoneData);
  client.setQueryData(["activityZones", "550e8400-e29b-41d4-a716-446655440001"], mockZoneData);
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
    msw: {
      handlers: [],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    data: {
      description: "Complete activity data object",
      control: false,
    },
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      setupMockData(queryClient);

      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
              <Story />
            </div>
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof ActivityPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunningActivity: Story = {
  args: {
    data: mockRunningActivity,
  },
};

export const CyclingActivity: Story = {
  args: {
    data: mockCyclingActivity,
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
  },
};
