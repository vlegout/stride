import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import HomePageView from "./HomePageView";
import type { Activity } from "../types";

const mockActivities: Activity[] = [
  {
    id: "1",
    fit: "morning_run.fit",
    title: "Morning Run",
    description: "Quick 5k run around the neighborhood",
    sport: "running",
    device: "Garmin Forerunner 945",
    race: false,
    start_time: 1640995200,
    total_timer_time: 1800,
    total_elapsed_time: 1830,
    total_distance: 5000,
    total_ascent: 45,
    avg_speed: 2.8,
    avg_heart_rate: 150,
    max_heart_rate: 170,
    avg_cadence: null,
    max_cadence: null,
    avg_power: 0,
    max_power: 0,
    np_power: 0,
    total_calories: 320,
    total_training_effect: 2.8,
    training_stress_score: 65,
    intensity_factor: 0.75,
    avg_temperature: 18,
    max_temperature: 22,
    min_temperature: 15,
    lat: 40.7829,
    lon: -73.9654,
    delta_lat: 0.003,
    delta_lon: 0.005,
    city: "New York",
    country: "United States",
    laps: [
      {
        index: 1,
        start_time: 1640995200,
        total_elapsed_time: 1830,
        total_timer_time: 1800,
        total_distance: 5000,
        max_heart_rate: 170,
        avg_heart_rate: 150,
        max_speed: 3.2,
      },
    ],
    tracepoints: [
      {
        lat: 40.7829,
        lon: -73.9654,
        timestamp: "2022-01-01T08:00:00Z",
        distance: 0,
        heart_rate: 140,
        speed: 0,
        power: 0,
        cadence: null,
        temperature: null,
        altitude: 20,
      },
      {
        lat: 40.7849,
        lon: -73.9634,
        timestamp: "2022-01-01T08:30:30Z",
        distance: 5000,
        heart_rate: 150,
        speed: 2.8,
        power: 0,
        cadence: null,
        temperature: null,
        altitude: 25,
      },
    ],
    performances: [{ distance: 5000, time: "PT30M30S", activity_id: "1" }],
    performance_power: [{ time: "PT30M30S", power: 0, activity_id: "1" }],
  },
  {
    id: "2",
    fit: "weekend_ride.fit",
    title: "Weekend Bike Ride",
    description: "Long endurance ride through the countryside",
    sport: "cycling",
    device: "Garmin Edge 530",
    race: true,
    start_time: 1641081600,
    total_timer_time: 5400,
    total_elapsed_time: 5500,
    total_distance: 45000,
    total_ascent: 650,
    avg_speed: 8.3,
    avg_heart_rate: 140,
    max_heart_rate: 175,
    avg_cadence: null,
    max_cadence: null,
    avg_power: 180,
    max_power: 420,
    np_power: 195,
    total_calories: 1200,
    total_training_effect: 3.5,
    training_stress_score: 120,
    intensity_factor: 0.85,
    avg_temperature: 15,
    max_temperature: 18,
    min_temperature: 12,
    lat: 45.4215,
    lon: -123.1815,
    delta_lat: 0.08,
    delta_lon: 0.12,
    city: "Portland",
    country: "United States",
    laps: [
      {
        index: 1,
        start_time: 1641081600,
        total_elapsed_time: 5500,
        total_timer_time: 5400,
        total_distance: 45000,
        max_heart_rate: 175,
        avg_heart_rate: 140,
        max_speed: 12.5,
      },
    ],
    tracepoints: [
      {
        lat: 45.4215,
        lon: -123.1815,
        timestamp: "2022-01-02T08:00:00Z",
        distance: 0,
        heart_rate: 120,
        speed: 0,
        power: 0,
        cadence: null,
        temperature: null,
        altitude: 50,
      },
      {
        lat: 45.5115,
        lon: -123.0915,
        timestamp: "2022-01-02T09:31:40Z",
        distance: 45000,
        heart_rate: 140,
        speed: 8.3,
        cadence: null,
        power: 180,
        temperature: null,
        altitude: 200,
      },
    ],
    performances: [{ distance: 45000, time: "PT1H31M40S", activity_id: "2" }],
    performance_power: [{ time: "PT1H31M40S", power: 180, activity_id: "2" }],
  },
  {
    id: "3",
    fit: "interval_run.fit",
    title: "Track Intervals",
    description: "Speed work session at the local track",
    sport: "running",
    device: "Garmin Forerunner 945",
    race: false,
    start_time: 1641168000,
    total_timer_time: 2700,
    total_elapsed_time: 3600,
    total_distance: 8000,
    total_ascent: 15,
    avg_speed: 3.0,
    avg_heart_rate: 165,
    max_heart_rate: 185,
    avg_cadence: null,
    max_cadence: null,
    avg_power: 0,
    max_power: 0,
    np_power: 0,
    total_calories: 450,
    total_training_effect: 4.1,
    training_stress_score: 95,
    intensity_factor: 0.92,
    avg_temperature: 20,
    max_temperature: 24,
    min_temperature: 17,
    lat: 40.7484,
    lon: -73.9857,
    delta_lat: 0.001,
    delta_lon: 0.001,
    city: "New York",
    country: "United States",
    laps: [
      {
        index: 1,
        start_time: 1641168000,
        total_elapsed_time: 3600,
        total_timer_time: 2700,
        total_distance: 8000,
        max_heart_rate: 185,
        avg_heart_rate: 165,
        max_speed: 4.5,
      },
    ],
    tracepoints: [
      {
        lat: 40.7484,
        lon: -73.9857,
        timestamp: "2022-01-03T08:00:00Z",
        distance: 0,
        heart_rate: 150,
        speed: 0,
        power: 0,
        cadence: null,
        temperature: null,
        altitude: 15,
      },
      {
        lat: 40.7494,
        lon: -73.9847,
        timestamp: "2022-01-03T09:00:00Z",
        distance: 8000,
        heart_rate: 165,
        speed: 3.0,
        power: 0,
        cadence: null,
        temperature: null,
        altitude: 18,
      },
    ],
    performances: [{ distance: 8000, time: "PT1H0M0S", activity_id: "3" }],
    performance_power: [{ time: "PT1H0M0S", power: 0, activity_id: "3" }],
  },
];

const meta = {
  title: "Components/HomePageView",
  component: HomePageView,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Displays a list of recent activities with a title header. Can be configured to show regular activities or races.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    activities: {
      description: "Array of activities to display",
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
} satisfies Meta<typeof HomePageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecentActivities: Story = {
  args: {
    activities: mockActivities,
  },
};

export const SingleActivity: Story = {
  args: {
    activities: [mockActivities[0]],
  },
};

export const EmptyState: Story = {
  args: {
    activities: [],
  },
};
