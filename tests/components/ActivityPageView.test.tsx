import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActivityPageView from "../../src/components/ActivityPageView";
import type { Activity } from "../../src/types";

vi.mock("../../src/hooks", () => ({
  useActivityZones: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));

vi.mock("../../src/components/ActivityBox", () => ({
  default: ({ activity }: { activity: Activity }) => <div data-testid="activity-box">{activity.title}</div>,
}));

vi.mock("../../src/components/ActivityNotifications", () => ({
  default: ({ notifications }: { notifications: unknown[] }) => (
    <div data-testid="activity-notifications">{notifications.length} notifications</div>
  ),
}));

vi.mock("../../src/components/LapChart", () => ({
  default: ({ laps }: { laps: unknown[] }) => <div data-testid="lap-chart">{laps.length} laps</div>,
}));

vi.mock("../../src/components/Performances", () => ({
  default: ({ performances }: { performances: unknown[] }) => (
    <div data-testid="performances">{performances.length} performances</div>
  ),
}));

vi.mock("../../src/components/PowerPerformances", () => ({
  default: ({ performances }: { performances: unknown[] }) => (
    <div data-testid="power-performances">{performances.length} power performances</div>
  ),
}));

vi.mock("../../src/components/ActivityCharts", () => ({
  default: () => <div data-testid="activity-charts">Charts</div>,
}));

vi.mock("../../src/components/ActivityZones", () => ({
  default: ({ title }: { title: string }) => <div data-testid="activity-zones">{title}</div>,
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const createMockActivity = (overrides: Partial<Activity> = {}): Activity =>
  ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    fit: "test.fit",
    title: "Morning Run",
    description: "",
    sport: "running",
    device: "Garmin",
    race: false,
    start_time: 1700000000,
    total_timer_time: 3600,
    total_elapsed_time: 3700,
    total_distance: 10000,
    total_ascent: 100,
    avg_speed: 10,
    avg_heart_rate: 150,
    max_heart_rate: 180,
    avg_cadence: 170,
    max_cadence: 190,
    avg_power: null,
    max_power: null,
    np_power: null,
    total_calories: null,
    total_training_effect: null,
    training_stress_score: null,
    intensity_factor: null,
    avg_temperature: null,
    max_temperature: null,
    min_temperature: null,
    pool_length: null,
    num_lengths: null,
    lat: 48.8566,
    lon: 2.3522,
    delta_lat: 0.01,
    delta_lon: 0.01,
    city: "Paris",
    country: "France",
    laps: [],
    performances: [],
    performance_power: [],
    notifications: [],
    ...overrides,
  }) as Activity;

describe("ActivityPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // Note: The component expects data to be provided, so we test with valid data only

  it("renders activity box with title", () => {
    const activity = createMockActivity({ title: "Evening Jog" });
    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("activity-box")).toHaveTextContent("Evening Jog");
  });

  it("renders lap chart", () => {
    const activity = createMockActivity({
      laps: [
        {
          index: 0,
          start_time: 0,
          total_elapsed_time: 300,
          total_timer_time: 300,
          total_distance: 1000,
          max_heart_rate: 175,
          avg_heart_rate: 160,
          max_speed: null,
        },
        {
          index: 1,
          start_time: 300,
          total_elapsed_time: 310,
          total_timer_time: 310,
          total_distance: 1000,
          max_heart_rate: 178,
          avg_heart_rate: 165,
          max_speed: null,
        },
      ],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("lap-chart")).toHaveTextContent("2 laps");
  });

  it("renders performances section", () => {
    const activity = createMockActivity({
      performances: [
        { distance: 1000, time: "PT5M", activity_id: "123e4567-e89b-12d3-a456-426614174000" },
        { distance: 5000, time: "PT25M", activity_id: "123e4567-e89b-12d3-a456-426614174000" },
      ],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("performances")).toHaveTextContent("2 performances");
  });

  it("renders notifications when present", () => {
    const activity = createMockActivity({
      notifications: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          activity_id: "123e4567-e89b-12d3-a456-426614174000",
          type: "best_effort_all_time" as const,
          distance: 5000,
          duration: null,
          power: null,
          achievement_year: null,
          rank: null,
          message: "New personal best!",
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("activity-notifications")).toHaveTextContent("1 notifications");
  });

  it("does not render notifications when empty", () => {
    const activity = createMockActivity({ notifications: [] });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.queryByTestId("activity-notifications")).not.toBeInTheDocument();
  });

  it("renders power performances for cycling", () => {
    const activity = createMockActivity({
      sport: "cycling",
      performance_power: [
        { time: "PT5M", power: 250, activity_id: "123e4567-e89b-12d3-a456-426614174000" },
        { time: "PT20M", power: 220, activity_id: "123e4567-e89b-12d3-a456-426614174000" },
      ],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("power-performances")).toHaveTextContent("2 power performances");
  });

  it("does not render power performances for running", () => {
    const activity = createMockActivity({
      sport: "running",
      performance_power: [{ time: "PT5M", power: 250, activity_id: "123e4567-e89b-12d3-a456-426614174000" }],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.queryByTestId("power-performances")).not.toBeInTheDocument();
  });

  it("renders activity charts when tracepoints are present", () => {
    const activity = createMockActivity({
      tracepoints: [
        {
          lat: 48.8566,
          lon: 2.3522,
          timestamp: "2024-01-01T00:00:00Z",
          distance: 0,
          heart_rate: 150,
          speed: 12,
          cadence: null,
          power: null,
          altitude: 100,
          temperature: null,
        },
      ],
    });

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.getByTestId("activity-charts")).toBeInTheDocument();
  });

  it("does not render charts when tracepoints are not provided", () => {
    const activity = createMockActivity({});

    renderWithProviders(<ActivityPageView data={activity} />);

    expect(screen.queryByTestId("activity-charts")).not.toBeInTheDocument();
  });
});
