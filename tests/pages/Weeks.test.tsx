import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import WeeksPage from "../../src/pages/Weeks";
import { createMockWeeksResponse } from "../mocks/apiMocks";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("../../src/api", () => ({
  fetchWeeks: vi.fn(),
}));

vi.mock("../../src/utils", () => ({
  formatDate: vi.fn((date: Date) => date.toLocaleDateString()),
  formatDuration: vi.fn((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }),
  formatDistance: vi.fn((distance: number) => `${(distance / 1000).toFixed(2)} km`),
  formatSpeed: vi.fn((speed: number) => `${speed.toFixed(2)} km/h`),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

vi.mock("../../src/components/ActivityLogo", () => ({
  default: ({ sport }: { sport: string }) => <div data-testid={`sport-logo-${sport}`}>{sport}</div>,
}));

import { useQuery } from "@tanstack/react-query";

describe("WeeksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading indicator when loading", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading weekly summary...")).toBeInTheDocument();
  });

  it("should show error message when error occurs", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Failed to load weeks data")).toBeInTheDocument();
  });

  it("should show info message when no data available", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("No weeks data available")).toBeInTheDocument();
  });

  it("should show info message when weeks array is undefined", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { weeks: undefined },
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("No weeks data available")).toBeInTheDocument();
  });

  it("should render weekly summary page", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Weekly Summary")).toBeInTheDocument();
  });

  it("should render week information", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Week 1, 2024")).toBeInTheDocument();
  });

  it("should render week statistics", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getAllByText("Activities").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Distance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Time").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TSS").length).toBeGreaterThan(0);
  });

  it("should render sports breakdown", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Sports Breakdown")).toBeInTheDocument();
  });

  it("should render running sport in breakdown", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText(/running:/i)).toBeInTheDocument();
  });

  it("should render activities table", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getAllByText("Activities").length).toBeGreaterThan(0);
    expect(screen.getByText("Morning Run")).toBeInTheDocument();
  });

  it("should render activity with link", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    const link = screen.getByRole("link", { name: "Morning Run" });
    expect(link).toHaveAttribute("href", "/activities/886313e1-3b8a-5372-9b90-0c9aee199e5d");
  });

  it("should not render race chip for non-race activities", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.queryByText("Race")).not.toBeInTheDocument();
  });

  it("should render race chip for race activities", () => {
    const mockData = createMockWeeksResponse();
    mockData.weeks[0].activities[0].race = true;

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Race")).toBeInTheDocument();
  });

  it("should render activity sport logo", () => {
    const mockData = createMockWeeksResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getAllByTestId("sport-logo-running").length).toBeGreaterThan(0);
  });

  it("should render multiple weeks", () => {
    const mockData = createMockWeeksResponse();
    mockData.weeks.push({
      week_start: "2024-01-08",
      week_number: 2,
      year: 2024,
      activities: [],
      total_activities: 0,
      total_distance: 0,
      total_time: 0,
      total_tss: 0,
      sports_breakdown: {
        running: { distance: 0, time: 0, count: 0 },
        cycling: { distance: 0, time: 0, count: 0 },
        swimming: { distance: 0, time: 0, count: 0 },
      },
    });

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.getByText("Week 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("Week 2, 2024")).toBeInTheDocument();
  });

  it("should handle week with no sports breakdown", () => {
    const mockData = createMockWeeksResponse();
    mockData.weeks[0].sports_breakdown = {};

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.queryByText("Sports Breakdown")).not.toBeInTheDocument();
  });

  it("should handle week with no activities", () => {
    const mockData = createMockWeeksResponse();
    mockData.weeks[0].activities = [];

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as never);

    render(<WeeksPage />);

    expect(screen.queryByText("Morning Run")).not.toBeInTheDocument();
  });
});
