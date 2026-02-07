import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Fitness from "../../src/pages/Fitness";
import * as api from "../../src/api";
import type { FitnessResponse } from "../../src/types";

vi.mock("../../src/api", () => ({
  fetchFitness: vi.fn(),
}));

vi.mock("../../src/components/FitnessScoreChart", () => ({
  default: ({ title }: { title: string }) => <div data-testid="fitness-score-chart">{title}</div>,
}));

vi.mock("../../src/components/WeeklyMetricsCharts", () => ({
  default: () => <div data-testid="weekly-metrics-charts">Weekly Metrics Charts</div>,
}));

vi.mock("../../src/components/WeeklyZonesCharts", () => ({
  default: () => <div data-testid="weekly-zones-charts">Weekly Zones Charts</div>,
}));

vi.mock("../../src/components/TSSChart", () => ({
  default: () => <div data-testid="tss-chart">TSS Chart</div>,
}));

vi.mock("../../src/components/FTPChart", () => ({
  default: () => <div data-testid="ftp-chart">FTP Chart</div>,
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
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

const mockFitnessResponse: FitnessResponse = {
  scores: [
    { date: "2026-01-01", overall: 50, running: 45, cycling: 55, swimming: 30 },
    { date: "2026-01-08", overall: 55, running: 50, cycling: 60, swimming: 32 },
    { date: "2026-01-15", overall: 60, running: 55, cycling: 65, swimming: 35 },
  ],
  weekly_tss: [
    { week_start: "2026-01-01", total_tss: 150 },
    { week_start: "2026-01-08", total_tss: 180 },
    { week_start: "2026-01-15", total_tss: 200 },
  ],
  weekly_running: [
    { week_start: "2026-01-01", distance: 30000, time: 10800 },
    { week_start: "2026-01-08", distance: 35000, time: 12600 },
    { week_start: "2026-01-15", distance: 40000, time: 14400 },
  ],
  weekly_cycling: [
    { week_start: "2026-01-01", distance: 100000, time: 14400 },
    { week_start: "2026-01-08", distance: 120000, time: 17280 },
    { week_start: "2026-01-15", distance: 150000, time: 21600 },
  ],
  weekly_swimming: [
    { week_start: "2026-01-01", distance: 2000, time: 3600 },
    { week_start: "2026-01-08", distance: 2500, time: 4500 },
    { week_start: "2026-01-15", distance: 3000, time: 5400 },
  ],
  weekly_zones: [
    {
      week_start: "2026-01-01",
      heart_rate_zones: [
        { zone_index: 1, total_time: 1800, running_time: 1200, cycling_time: 600, max_value: 130 },
        { zone_index: 2, total_time: 2400, running_time: 1600, cycling_time: 800, max_value: 150 },
      ],
      pace_zones: [],
      power_zones: [],
    },
  ],
  ftp: [
    { date: "2026-01-01", ftp: 250 },
    { date: "2026-01-15", ftp: 255 },
  ],
};

describe("Fitness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.fetchFitness).mockImplementation(() => new Promise(() => undefined));

    renderWithProviders(<Fitness />);

    expect(screen.getByText("Loading fitness data...")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(api.fetchFitness).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
    });
  });

  it("renders empty state when fitness data is null", async () => {
    const nullDataResponse = {
      scores: null,
      weekly_tss: null,
      weekly_running: [],
      weekly_cycling: [],
      weekly_swimming: [],
      weekly_zones: [],
      ftp: [],
    } as unknown as FitnessResponse;
    vi.mocked(api.fetchFitness).mockResolvedValue(nullDataResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("No fitness data available")).toBeInTheDocument();
    });
  });

  it("renders page header with title", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("Fitness")).toBeInTheDocument();
    });
  });

  it("renders date selector", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("1 year")).toBeInTheDocument();
    });
  });

  it("renders fitness overview with current scores", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("Fitness Overview")).toBeInTheDocument();
      expect(screen.getByText("Overall Fitness")).toBeInTheDocument();
    });
  });

  it("renders fitness score chart", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("fitness-score-chart")).toBeInTheDocument();
    });
  });

  it("renders weekly metrics charts", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("weekly-metrics-charts")).toBeInTheDocument();
    });
  });

  it("renders TSS chart", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("tss-chart")).toBeInTheDocument();
    });
  });

  it("renders weekly zones charts when zones data available", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("weekly-zones-charts")).toBeInTheDocument();
    });
  });

  it("does not render weekly zones charts when no zones data", async () => {
    const responseNoZones: FitnessResponse = {
      ...mockFitnessResponse,
      weekly_zones: [],
    };
    vi.mocked(api.fetchFitness).mockResolvedValue(responseNoZones);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("Fitness")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("weekly-zones-charts")).not.toBeInTheDocument();
  });

  it("renders FTP chart when FTP data available", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("ftp-chart")).toBeInTheDocument();
    });
  });

  it("does not render FTP chart when no FTP data", async () => {
    const responseNoFtp: FitnessResponse = {
      ...mockFitnessResponse,
      ftp: [],
    };
    vi.mocked(api.fetchFitness).mockResolvedValue(responseNoFtp);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("Fitness")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("ftp-chart")).not.toBeInTheDocument();
  });

  it("changes date range when selector is clicked", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("1 year")).toBeInTheDocument();
    });

    const twoYearsButton = screen.getByText("2 years");
    fireEvent.click(twoYearsButton);

    await waitFor(() => {
      expect(screen.getByTestId("fitness-score-chart")).toHaveTextContent("Past 2 Years");
    });
  });

  it("displays chart title with correct date range label", async () => {
    vi.mocked(api.fetchFitness).mockResolvedValue(mockFitnessResponse);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByTestId("fitness-score-chart")).toHaveTextContent("Past 1 Year");
    });
  });

  it("handles null weekly swimming data gracefully", async () => {
    const responseNullSwimming: FitnessResponse = {
      ...mockFitnessResponse,
      weekly_swimming: [],
    };
    vi.mocked(api.fetchFitness).mockResolvedValue(responseNullSwimming);

    renderWithProviders(<Fitness />);

    await waitFor(() => {
      expect(screen.getByText("Fitness")).toBeInTheDocument();
      expect(screen.getByTestId("weekly-metrics-charts")).toBeInTheDocument();
    });
  });
});
