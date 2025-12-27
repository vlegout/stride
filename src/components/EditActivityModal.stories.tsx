import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import EditActivityModal from "./EditActivityModal";
import type { Activity } from "../types";

// Mock activity data
const mockActivity: Activity = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  fit: "running_activity.fit",
  title: "Morning Run in Central Park",
  description: "Beautiful morning run through Central Park with perfect weather conditions",
  sport: "running",
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
  avg_cadence: null,
  max_cadence: null,
  avg_power: 0,
  max_power: 0,
  np_power: 0,
  total_calories: 486,
  total_training_effect: 3.2,
  training_stress_score: 85,
  intensity_factor: 0.85,
  avg_temperature: 18,
  max_temperature: 22,
  min_temperature: 15,
  pool_length: null,
  num_lengths: null,
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
      timestamp: "2022-01-01T08:02:00Z",
      distance: 300,
      heart_rate: 145,
      speed: 3.5,
      power: 0,
      cadence: null,
      temperature: null,
      altitude: 22,
    },
  ],
  performances: [{ distance: 10000, time: "PT45M0S", activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
  performance_power: [{ time: "PT45M0S", power: 0, activity_id: "550e8400-e29b-41d4-a716-446655440000" }],
};

const mockRaceActivity: Activity = {
  ...mockActivity,
  id: "550e8400-e29b-41d4-a716-446655440001",
  title: "Weekend 10K Race",
  race: true,
  total_distance: 10000,
  avg_speed: 4.2,
  total_timer_time: 2380, // ~39:40 for 10K
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
  title: "Components/EditActivityModal",
  component: EditActivityModal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Modal dialog for editing activity details including title and race flag. Uses TanStack Query for API integration and provides form validation.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: { type: "boolean" },
      description: "Whether the modal is open",
    },
    activity: {
      description: "The activity data to edit",
      control: false,
    },
    onClose: {
      description: "Callback fired when the modal should be closed",
      action: "closed",
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <QueryClientProvider client={createQueryClient()}>
          <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Story />
          </div>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof EditActivityModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    activity: mockActivity,
    onClose: () => console.log("Modal closed"),
  },
};

export const RaceActivity: Story = {
  args: {
    open: true,
    activity: mockRaceActivity,
    onClose: () => console.log("Modal closed"),
  },
};

export const LongTitle: Story = {
  args: {
    open: true,
    activity: {
      ...mockActivity,
      title: "Very Long Activity Title That Might Wrap to Multiple Lines in the Form Field",
    },
    onClose: () => console.log("Modal closed"),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    activity: mockActivity,
    onClose: () => console.log("Modal closed"),
  },
  parameters: {
    docs: {
      description: {
        story: "Modal in closed state - you won't see anything as the modal is hidden.",
      },
    },
  },
};

// Interactive story that shows the modal opening and closing
export const Interactive: Story = {
  args: {
    open: false,
    activity: mockActivity,
    onClose: () => console.log("Modal closed"),
  },
  render: (args) => {
    const [open, setOpen] = React.useState(false);

    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Open Edit Modal
        </button>
        <EditActivityModal {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example where you can open and close the modal by clicking the button.",
      },
    },
  },
};
