import { createTheme, ThemeProvider } from "@mui/material/styles";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ActivityBox from "../../src/components/ActivityBox";
import type { Activity } from "../../src/types";

vi.mock("../../src/store", () => ({
  useAuthStore: vi.fn(() => ({ user: { map: "leaflet" } })),
}));

vi.mock("../../src/components/Map", () => ({
  default: ({ points }: { points: unknown[] }) => <div data-testid="map-leaflet">{points.length} points</div>,
}));

vi.mock("../../src/components/MapOL", () => ({
  default: ({ points }: { points: unknown[] }) => <div data-testid="map-ol">{points.length} points</div>,
}));

vi.mock("../../src/components/MapMapbox", () => ({
  default: ({ points }: { points: unknown[] }) => <div data-testid="map-mapbox">{points.length} points</div>,
}));

vi.mock("../../src/components/EditActivityModal", () => ({
  default: () => <div data-testid="edit-modal" />,
}));

vi.mock("../../src/components/ActivityLogo", () => ({
  default: () => <div data-testid="activity-logo" />,
}));

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );

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
    timestamp: 1700000000,
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
    subdivision: null,
    country: "France",
    user_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    laps: [],
    performances: [],
    performance_power: [],
    notifications: [],
    tracepoints: [],
    status: "created",
    ...overrides,
  }) as Activity;

describe("ActivityBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders activity title", () => {
    const activity = createMockActivity({ title: "Treadmill 5k" });
    renderWithProviders(<ActivityBox activity={activity} />);
    expect(screen.getByText("Treadmill 5k")).toBeInTheDocument();
  });

  it("does not render map when tracepoints are empty", () => {
    const activity = createMockActivity({ tracepoints: [] });
    renderWithProviders(<ActivityBox activity={activity} />);
    expect(screen.queryByTestId("map-leaflet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-ol")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-mapbox")).not.toBeInTheDocument();
  });

  it("does not render map when tracepoints has only 1 point", () => {
    const activity = createMockActivity({
      tracepoints: [
        {
          lat: 48.85,
          lon: 2.35,
          timestamp: "2024-01-01T00:00:00Z",
          distance: 0,
          heart_rate: 150,
          speed: 10,
          cadence: null,
          power: null,
          altitude: 100,
          temperature: null,
        },
      ],
    });
    renderWithProviders(<ActivityBox activity={activity} />);
    expect(screen.queryByTestId("map-leaflet")).not.toBeInTheDocument();
  });

  it("renders map when tracepoints has 2 or more points", () => {
    const activity = createMockActivity({
      tracepoints: [
        {
          lat: 48.85,
          lon: 2.35,
          timestamp: "2024-01-01T00:00:00Z",
          distance: 0,
          heart_rate: 150,
          speed: 10,
          cadence: null,
          power: null,
          altitude: 100,
          temperature: null,
        },
        {
          lat: 48.86,
          lon: 2.36,
          timestamp: "2024-01-01T00:01:00Z",
          distance: 100,
          heart_rate: 155,
          speed: 11,
          cadence: null,
          power: null,
          altitude: 101,
          temperature: null,
        },
      ],
    });
    renderWithProviders(<ActivityBox activity={activity} />);
    expect(screen.getByTestId("map-leaflet")).toBeInTheDocument();
  });
});
