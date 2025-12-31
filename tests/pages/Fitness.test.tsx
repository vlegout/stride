import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Fitness from "../../src/pages/Fitness";
import { createMockFitnessResponse } from "../mocks/apiMocks";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../src/api", () => ({
  fetchFitness: vi.fn(),
}));

vi.mock("../../src/utils/date", () => ({
  filterDataByDateRange: vi.fn((data) => data),
  filterWeeklyDataByDateRange: vi.fn((data) => data),
  getDateRangeLabel: vi.fn(() => "Year"),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock("../../src/components/FitnessOverview", () => ({
  default: ({ currentOverall }: { currentOverall: number }) => (
    <div data-testid="fitness-overview">Current Overall: {currentOverall}</div>
  ),
}));

vi.mock("../../src/components/FitnessScoreChart", () => ({
  default: ({ title }: { title: string }) => <div data-testid="fitness-score-chart">{title}</div>,
}));

vi.mock("../../src/components/WeeklyMetricsCharts", () => ({
  default: () => <div data-testid="weekly-metrics-charts">Weekly Metrics</div>,
}));

vi.mock("../../src/components/WeeklyZonesCharts", () => ({
  default: () => <div data-testid="weekly-zones-charts">Weekly Zones</div>,
}));

vi.mock("../../src/components/TSSChart", () => ({
  default: () => <div data-testid="tss-chart">TSS Chart</div>,
}));

vi.mock("../../src/components/FTPChart", () => ({
  default: () => <div data-testid="ftp-chart">FTP Chart</div>,
}));

vi.mock("../../src/components/DateSelector", () => ({
  default: ({ onChange }: { selectedRange: string; onChange: (range: string) => void }) => (
    <div data-testid="date-selector">
      <button onClick={() => onChange("1m")}>1 Month</button>
      <button onClick={() => onChange("3m")}>3 Months</button>
      <button onClick={() => onChange("6m")}>6 Months</button>
      <button onClick={() => onChange("1y")}>1 Year</button>
    </div>
  ),
}));

import { useQuery } from "@tanstack/react-query";

describe("Fitness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading indicator when loading", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("should show error message when error occurs", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never);

    render(<Fitness />);

    expect(screen.getByText("Failed to load fitness data")).toBeInTheDocument();
  });

  it("should show no data message when scores are missing", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { scores: undefined, weekly_tss: [] },
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByText("No fitness data available")).toBeInTheDocument();
  });

  it("should show no data message when weekly_tss is missing", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { scores: [], weekly_tss: undefined },
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByText("No fitness data available")).toBeInTheDocument();
  });

  it("should render fitness page with data", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByText("Fitness")).toBeInTheDocument();
    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
  });

  it("should render fitness overview", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("fitness-overview")).toBeInTheDocument();
    expect(screen.getByText("Current Overall: 75")).toBeInTheDocument();
  });

  it("should render fitness score chart", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("fitness-score-chart")).toBeInTheDocument();
  });

  it("should render weekly metrics charts", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("weekly-metrics-charts")).toBeInTheDocument();
  });

  it("should render TSS chart", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("tss-chart")).toBeInTheDocument();
  });

  it("should render weekly zones charts when data available", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("weekly-zones-charts")).toBeInTheDocument();
  });

  it("should render FTP chart when data available", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("ftp-chart")).toBeInTheDocument();
  });

  it("should not render weekly zones charts when data is empty", () => {
    const mockData = createMockFitnessResponse();
    mockData.weekly_zones = [];

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.queryByTestId("weekly-zones-charts")).not.toBeInTheDocument();
  });

  it("should not render FTP chart when data is undefined", () => {
    const mockData = createMockFitnessResponse();
    delete (mockData as { ftp?: unknown }).ftp;

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.queryByTestId("ftp-chart")).not.toBeInTheDocument();
  });

  it("should not render FTP chart when data is empty", () => {
    const mockData = createMockFitnessResponse();
    mockData.ftp = [];

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.queryByTestId("ftp-chart")).not.toBeInTheDocument();
  });

  it("should handle date range change", async () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    const oneMonthButton = screen.getByText("1 Month");
    await userEvent.click(oneMonthButton);

    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
  });

  it("should start with 1y as default date range", () => {
    const mockData = createMockFitnessResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("date-selector")).toBeInTheDocument();
  });

  it("should handle empty scores array", () => {
    const mockData = createMockFitnessResponse();
    mockData.scores = [];

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("fitness-overview")).toBeInTheDocument();
    expect(screen.getByText("Current Overall: 0")).toBeInTheDocument();
  });

  it("should handle missing optional weekly data", () => {
    const mockData = createMockFitnessResponse();
    delete (mockData as { weekly_swimming?: unknown }).weekly_swimming;

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<Fitness />);

    expect(screen.getByTestId("weekly-metrics-charts")).toBeInTheDocument();
  });
});
