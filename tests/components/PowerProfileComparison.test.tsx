import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PowerProfileComparison from "../../src/components/PowerProfileComparison";
import * as api from "../../src/api";
import type { PowerProfileResponse } from "../../src/types";

vi.mock("../../src/api", () => ({
  fetchPowerProfile: vi.fn(),
}));

vi.mock("react-chartjs-2", () => ({
  Line: ({ data, options }: { data: unknown; options: unknown }) => (
    <div data-testid="chart-line" data-data={JSON.stringify(data)} data-options={JSON.stringify(options)} />
  ),
}));

const theme = createTheme();

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
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
};

const getSelects = () => {
  const selects = screen.getAllByRole("combobox");
  return { primarySelect: selects[0], compareSelect: selects[1] };
};

const getChartData = (chart: HTMLElement) => JSON.parse(chart.getAttribute("data-data") ?? "{}");
const getChartOptions = (chart: HTMLElement) => JSON.parse(chart.getAttribute("data-options") ?? "{}");

const mockPowerProfileResponse: PowerProfileResponse = {
  labels: ["5s", "30s", "1min", "5min", "10min", "20min"],
  overall: [800, 500, 400, 300, 280, 260],
  years: {
    "2025": [750, 480, 390, 290, 270, 250],
    "2024": [700, 460, 370, 280, 260, 240],
  },
  available_years: [2025, 2024],
};

describe("PowerProfileComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.fetchPowerProfile).mockImplementation(() => new Promise(() => undefined));

    renderWithProviders(<PowerProfileComparison />);

    expect(screen.getByText("Loading power profile...")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(api.fetchPowerProfile).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
    });
  });

  it("renders section title", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });
  });

  it("renders primary select with Overall selected by default", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { primarySelect } = getSelects();
    expect(primarySelect).toHaveTextContent("Overall");
  });

  it("renders compare select defaulting to None", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { compareSelect } = getSelects();
    // None is the empty value, rendered as empty or hidden placeholder
    expect(compareSelect).not.toHaveTextContent("Overall");
    expect(compareSelect).not.toHaveTextContent("2025");
  });

  it("renders chart with overall data", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-line")).toBeInTheDocument();
    });

    const chart = screen.getByTestId("chart-line");
    const chartData = getChartData(chart);
    expect(chartData.labels).toEqual(mockPowerProfileResponse.labels);
    expect(chartData.datasets).toHaveLength(1);
    expect(chartData.datasets[0].label).toBe("Overall");
    expect(chartData.datasets[0].data).toEqual([800, 500, 400, 300, 280, 260]);
  });

  it("renders chart without legend when no comparison selected", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-line")).toBeInTheDocument();
    });

    const chart = screen.getByTestId("chart-line");
    const options = getChartOptions(chart);
    expect(options.plugins.legend.display).toBe(false);
  });

  it("changes primary selection", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { primarySelect } = getSelects();
    fireEvent.mouseDown(primarySelect);

    const listbox = within(screen.getByRole("listbox"));
    fireEvent.click(listbox.getByText("2025"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets[0].label).toBe("2025");
      expect(chartData.datasets[0].data).toEqual([750, 480, 390, 290, 270, 250]);
    });
  });

  it("shows comparison dataset when compare selection is set", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { compareSelect } = getSelects();
    fireEvent.mouseDown(compareSelect);

    const listbox = within(screen.getByRole("listbox"));
    fireEvent.click(listbox.getByText("2025"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe("Overall");
      expect(chartData.datasets[1].label).toBe("2025");
    });
  });

  it("shows legend when comparison is active", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { compareSelect } = getSelects();
    fireEvent.mouseDown(compareSelect);

    const listbox = within(screen.getByRole("listbox"));
    fireEvent.click(listbox.getByText("2024"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const options = getChartOptions(chart);
      expect(options.plugins.legend.display).toBe(true);
    });
  });

  it("resets compare selection when primary is changed to same value", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    // Set compare to 2025
    const { compareSelect } = getSelects();
    fireEvent.mouseDown(compareSelect);
    const compareListbox = within(screen.getByRole("listbox"));
    fireEvent.click(compareListbox.getByText("2025"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets).toHaveLength(2);
    });

    // Change primary to 2025 (same as compare) - compare should reset
    const { primarySelect } = getSelects();
    fireEvent.mouseDown(primarySelect);
    const primaryListbox = within(screen.getByRole("listbox"));
    fireEvent.click(primaryListbox.getByText("2025"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].label).toBe("2025");
    });
  });

  it("excludes primary selection from compare options", async () => {
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(mockPowerProfileResponse);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    // Primary defaults to "Overall", so compare options should not include "Overall"
    const { compareSelect } = getSelects();
    fireEvent.mouseDown(compareSelect);

    const listbox = within(screen.getByRole("listbox"));
    expect(listbox.queryByText("Overall")).not.toBeInTheDocument();
    expect(listbox.getByText("None")).toBeInTheDocument();
    expect(listbox.getByText("2025")).toBeInTheDocument();
    expect(listbox.getByText("2024")).toBeInTheDocument();
  });

  it("rounds power values to integers in chart data", async () => {
    const responseWithDecimals: PowerProfileResponse = {
      labels: ["5s", "30s"],
      overall: [800.7, 499.3],
      years: {},
      available_years: [],
    };
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(responseWithDecimals);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets[0].data).toEqual([801, 499]);
    });
  });

  it("handles empty power data for a year", async () => {
    const responseWithEmptyYear: PowerProfileResponse = {
      labels: ["5s", "30s"],
      overall: [800, 500],
      years: { "2025": [] },
      available_years: [2025],
    };
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(responseWithEmptyYear);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      expect(screen.getByText("Power Profile")).toBeInTheDocument();
    });

    const { primarySelect } = getSelects();
    fireEvent.mouseDown(primarySelect);

    const listbox = within(screen.getByRole("listbox"));
    fireEvent.click(listbox.getByText("2025"));

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets).toHaveLength(0);
    });
  });

  it("handles no available years", async () => {
    const responseNoYears: PowerProfileResponse = {
      labels: ["5s", "30s"],
      overall: [800, 500],
      years: {},
      available_years: [],
    };
    vi.mocked(api.fetchPowerProfile).mockResolvedValue(responseNoYears);

    renderWithProviders(<PowerProfileComparison />);

    await waitFor(() => {
      const chart = screen.getByTestId("chart-line");
      const chartData = getChartData(chart);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].label).toBe("Overall");
    });
  });
});
