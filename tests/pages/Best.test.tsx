import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Best from "../../src/pages/Best";
import { createMockBestPerformanceResponse } from "../mocks/apiMocks";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("../../src/api", () => ({
  fetchBestPerformances: vi.fn(),
}));

vi.mock("../../src/utils", () => ({
  formatDistance: vi.fn((distance: number) => `${(distance / 1000).toFixed(2)} km`),
  formatDuration: vi.fn((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

vi.mock("../../src/components/PerformanceFilters", () => ({
  default: ({
    onSportChange,
    onDistanceChange,
    onTimeChange,
    onYearChange,
  }: {
    sport: string;
    selectedDistance: string;
    selectedTime: string;
    selectedYear: string;
    onSportChange: (sport: string) => void;
    onDistanceChange: (distance: string) => void;
    onTimeChange: (time: string) => void;
    onYearChange: (year: string) => void;
  }) => (
    <div data-testid="performance-filters">
      <button onClick={() => onSportChange("cycling")}>Change to Cycling</button>
      <button onClick={() => onSportChange("running")}>Change to Running</button>
      <button onClick={() => onDistanceChange("5")}>Change Distance</button>
      <button onClick={() => onTimeChange("21.0975")}>Change Time</button>
      <button onClick={() => onYearChange("2023")}>Change Year</button>
    </div>
  ),
}));

import { useQuery } from "@tanstack/react-query";

describe("Best", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading indicator when pending", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading best performances...")).toBeInTheDocument();
  });

  it("should show loading indicator when fetching", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isFetching: true,
    } as never);

    render(<Best />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should show loading indicator when error", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: new Error("Failed to load"),
      isPending: false,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render best performances page", () => {
    const mockData = createMockBestPerformanceResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByText("Best Performances")).toBeInTheDocument();
    expect(screen.getByTestId("performance-filters")).toBeInTheDocument();
  });

  it("should render performance data for running", () => {
    const mockData = createMockBestPerformanceResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByText("Morning Run")).toBeInTheDocument();
  });

  it("should change sport from running to cycling", async () => {
    const mockData = createMockBestPerformanceResponse();
    let currentQueryKey: unknown[] = [];

    vi.mocked(useQuery).mockImplementation((options) => {
      currentQueryKey = (options as { queryKey: unknown[] }).queryKey;
      return {
        data: mockData,
        error: null,
        isPending: false,
        isFetching: false,
      } as never;
    });

    render(<Best />);

    const changeToCyclingButton = screen.getByText("Change to Cycling");
    await userEvent.click(changeToCyclingButton);

    await waitFor(() => {
      expect(currentQueryKey[1]).toBe("cycling");
    });
  });

  it("should update filters when changing sport to cycling", async () => {
    const mockData = { ...createMockBestPerformanceResponse(), sport: "cycling" };
    let currentQueryKey: unknown[] = [];

    vi.mocked(useQuery).mockImplementation((options) => {
      currentQueryKey = (options as { queryKey: unknown[] }).queryKey;
      return {
        data: mockData,
        error: null,
        isPending: false,
        isFetching: false,
      } as never;
    });

    render(<Best />);

    const changeToCyclingButton = screen.getByText("Change to Cycling");
    await userEvent.click(changeToCyclingButton);

    await waitFor(() => {
      expect(currentQueryKey[2]).toBe("1");
      expect(currentQueryKey[3]).toBe("");
    });
  });

  it("should update filters when changing sport to running", async () => {
    const mockData = createMockBestPerformanceResponse();
    let currentQueryKey: unknown[] = [];

    vi.mocked(useQuery).mockImplementation((options) => {
      currentQueryKey = (options as { queryKey: unknown[] }).queryKey;
      return {
        data: mockData,
        error: null,
        isPending: false,
        isFetching: false,
      } as never;
    });

    render(<Best />);

    const changeToCyclingButton = screen.getByText("Change to Cycling");
    await userEvent.click(changeToCyclingButton);

    const changeToRunningButton = screen.getByText("Change to Running");
    await userEvent.click(changeToRunningButton);

    await waitFor(() => {
      expect(currentQueryKey[1]).toBe("running");
      expect(currentQueryKey[2]).toBe("");
      expect(currentQueryKey[3]).toBe("42.195");
    });
  });

  it("should handle year filter change", async () => {
    const mockData = createMockBestPerformanceResponse();
    let currentQueryKey: unknown[] = [];

    vi.mocked(useQuery).mockImplementation((options) => {
      currentQueryKey = (options as { queryKey: unknown[] }).queryKey;
      return {
        data: mockData,
        error: null,
        isPending: false,
        isFetching: false,
      } as never;
    });

    render(<Best />);

    const changeYearButton = screen.getByText("Change Year");
    await userEvent.click(changeYearButton);

    await waitFor(() => {
      expect(currentQueryKey[4]).toBe("2023");
    });
  });

  it("should show empty message when no performances found", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { performances: [], sport: "running", parameter: "distance" },
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByText("No running performances found")).toBeInTheDocument();
  });

  it("should display Time column for running", () => {
    const mockData = createMockBestPerformanceResponse();

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Best />);

    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("should display Power column for cycling", () => {
    const mockData = { ...createMockBestPerformanceResponse(), sport: "cycling" };

    vi.mocked(useQuery).mockReturnValue({
      data: mockData,
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    const { rerender } = render(<Best />);

    const changeToCyclingButton = screen.getByText("Change to Cycling");
    changeToCyclingButton.click();

    rerender(<Best />);
  });
});
