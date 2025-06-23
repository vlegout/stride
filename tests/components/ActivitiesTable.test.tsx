import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ActivitiesTable from "../../src/components/ActivitiesTable";
import * as api from "../../src/api";
import * as store from "../../src/store";

// Mock the API module
vi.spyOn(api, "fetchActivities");
vi.spyOn(api, "createActivitiesQueryKey");

// Mock the store
vi.spyOn(store, "useActivitiesStore");

// Mock the ActivityLogo component
vi.mock("../../src/components/ActivityLogo", () => ({
  default: ({ sport, width }: { sport: string; width?: number }) => (
    <div data-testid="activity-logo" data-sport={sport} data-width={width}>
      {sport} logo
    </div>
  ),
}));

// Mock LoadingIndicator
vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading-indicator">{message}</div>,
}));

// Mock DataTable
vi.mock("../../src/components/ui", () => ({
  DataTable: ({
    columns,
    rows,
    onSort,
  }: {
    columns: { id: string; label: string; sortable?: boolean }[];
    rows: unknown[];
    onSort: (columnId: string) => void;
  }) => (
    <div data-testid="data-table">
      <div data-testid="column-count">{columns.length}</div>
      <div data-testid="row-count">{rows.length}</div>
      {columns.map((col) => (
        <button key={col.id} data-testid={`sort-${col.id}`} onClick={() => col.sortable && onSort(col.id)}>
          {col.label}
        </button>
      ))}
    </div>
  ),
}));

const mockActivities = [
  {
    id: "1",
    fit: "test1.fit",
    title: "Morning Run",
    description: "A morning run",
    sport: "running",
    city: "San Francisco",
    country: "USA",
    start_time: 1640995200,
    timestamp: 1640995200,
    total_timer_time: 1800,
    total_elapsed_time: 1800,
    total_distance: 5000,
    avg_speed: 3.5,
    avg_power: null,
    max_power: null,
    np_power: null,
    total_ascent: 100,
    total_calories: 350,
    total_training_effect: 2.5,
    training_stress_score: null,
    intensity_factor: null,
    avg_heart_rate: null,
    max_heart_rate: null,
    lat: null,
    lon: null,
    delta_lat: null,
    delta_lon: null,
    subdivision: null,
    race: false,
    device: "Garmin",
    status: "created",
    user_id: "user1",
    laps: [],
    tracepoints: [],
    performances: [],
  },
  {
    id: "2",
    fit: "test2.fit",
    title: "Evening Bike Ride",
    description: "An evening bike ride",
    sport: "cycling",
    city: "Los Angeles",
    country: "USA",
    start_time: 1641081600,
    timestamp: 1641081600,
    total_timer_time: 3600,
    total_elapsed_time: 3600,
    total_distance: 25000,
    avg_speed: 8.5,
    avg_power: 200,
    max_power: 350,
    np_power: 220,
    total_ascent: 500,
    total_calories: 800,
    total_training_effect: 3.2,
    training_stress_score: 85,
    intensity_factor: 0.75,
    avg_heart_rate: 150,
    max_heart_rate: 180,
    lat: null,
    lon: null,
    delta_lat: null,
    delta_lon: null,
    subdivision: null,
    race: true,
    device: "Wahoo",
    status: "created",
    user_id: "user1",
    laps: [],
    tracepoints: [],
    performances: [],
  },
];

const mockStore = {
  sport: "",
  distance: [0, 100] as [number, number],
  race: false,
  page: 1,
  order: "asc" as const,
  orderBy: "start_time",
  setPage: vi.fn(),
  setOrder: vi.fn(),
  setOrderBy: vi.fn(),
  setSport: vi.fn(),
  setDistance: vi.fn(),
  setRace: vi.fn(),
  resetFilters: vi.fn(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ActivitiesTable", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should show loading indicator when data is pending", () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockReturnValue(
      new Promise(() => {
        // Never resolves - intentionally empty for testing pending state
      }),
    );

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });

  it("should render data table with activities when data is loaded", async () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: mockActivities as any,
      pagination: {
        page: 1,
        per_page: 10,
        total: 2,
      },
    });

    vi.mocked(api.createActivitiesQueryKey).mockReturnValue([
      "activities",
      {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "asc",
        orderBy: "start_time",
      },
    ]);

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("data-table")).toBeInTheDocument();
    });

    expect(screen.getByTestId("column-count")).toHaveTextContent("12");
    expect(screen.getByTestId("row-count")).toHaveTextContent("2");
  });

  it("should render pagination component", async () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: mockActivities as any,
      pagination: {
        page: 1,
        per_page: 10,
        total: 25,
      },
    });

    vi.mocked(api.createActivitiesQueryKey).mockReturnValue([
      "activities",
      {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "asc",
        orderBy: "start_time",
      },
    ]);

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  it("should handle sorting when sortable column is clicked", async () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: mockActivities as any,
      pagination: {
        page: 1,
        per_page: 10,
        total: 2,
      },
    });

    vi.mocked(api.createActivitiesQueryKey).mockReturnValue([
      "activities",
      {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "asc",
        orderBy: "start_time",
      },
    ]);

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId("data-table")).toBeInTheDocument();
    });

    const sortButton = screen.getByTestId("sort-total_distance");
    fireEvent.click(sortButton);

    expect(mockStore.setOrderBy).toHaveBeenCalledWith("total_distance");
    expect(mockStore.setOrder).toHaveBeenCalledWith("desc");
  });

  it("should handle page changes", async () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: mockActivities as any,
      pagination: {
        page: 1,
        per_page: 10,
        total: 25,
      },
    });

    vi.mocked(api.createActivitiesQueryKey).mockReturnValue([
      "activities",
      {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "asc",
        orderBy: "start_time",
      },
    ]);

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    const pageButton = screen.getByLabelText("Go to page 2");
    fireEvent.click(pageButton);

    expect(mockStore.setPage).toHaveBeenCalledWith(2);
  });

  it("should show loading indicator on error", () => {
    vi.mocked(store.useActivitiesStore).mockReturnValue(mockStore);
    vi.mocked(api.fetchActivities).mockRejectedValue(new Error("API Error"));

    render(<ActivitiesTable />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });
});
