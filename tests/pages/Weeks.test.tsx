import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import WeeksPage from "../../src/pages/Weeks";
import * as api from "../../src/api";
import type { WeeksResponse } from "../../src/types";

vi.mock("../../src/api", () => ({
  fetchWeeks: vi.fn(),
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

const mockWeeksResponse: WeeksResponse = {
  weeks: [
    {
      week_start: "2024-01-01",
      week_number: 1,
      year: 2024,
      total_activities: 3,
      total_distance: 25000,
      total_time: 7200,
      total_tss: 150,
      sports_breakdown: {
        running: { distance: 15000, time: 4000, count: 2 },
        cycling: { distance: 10000, time: 3200, count: 1 },
      },
      activities: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          title: "Morning Run",
          sport: "running",
          start_time: 1704103200,
          total_distance: 10000,
          total_timer_time: 3000,
          avg_speed: 3.33,
          avg_heart_rate: 150,
          avg_power: null,
          race: false,
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          title: "Race Day 5K",
          sport: "running",
          start_time: 1704189600,
          total_distance: 5000,
          total_timer_time: 1000,
          avg_speed: 5.0,
          avg_heart_rate: 175,
          avg_power: null,
          race: true,
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          title: "Easy Ride",
          sport: "cycling",
          start_time: 1704276000,
          total_distance: 10000,
          total_timer_time: 3200,
          avg_speed: 8.0,
          avg_heart_rate: 130,
          avg_power: 200,
          race: false,
        },
      ],
    },
  ],
  has_more: false,
  next_offset: 5,
};

const mockWeeksResponseWithMore: WeeksResponse = {
  ...mockWeeksResponse,
  has_more: true,
  next_offset: 5,
};

const mockSecondPageResponse: WeeksResponse = {
  weeks: [
    {
      week_start: "2023-12-25",
      week_number: 52,
      year: 2023,
      total_activities: 1,
      total_distance: 5000,
      total_time: 1800,
      total_tss: 50,
      sports_breakdown: {
        running: { distance: 5000, time: 1800, count: 1 },
      },
      activities: [
        {
          id: "550e8400-e29b-41d4-a716-446655440004",
          title: "Holiday Run",
          sport: "running",
          start_time: 1703498400,
          total_distance: 5000,
          total_timer_time: 1800,
          avg_speed: 2.78,
          avg_heart_rate: 140,
          avg_power: null,
          race: false,
        },
      ],
    },
  ],
  has_more: false,
  next_offset: 10,
};

const emptyWeeksResponse: WeeksResponse = {
  weeks: [],
  has_more: false,
  next_offset: 0,
};

describe("WeeksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.fetchWeeks).mockImplementation(() => new Promise(() => undefined));

    renderWithProviders(<WeeksPage />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(api.fetchWeeks).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading weeks/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("renders empty state when no weeks available", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(emptyWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("No weeks data available")).toBeInTheDocument();
    });
  });

  it("renders weekly summary header", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Summary")).toBeInTheDocument();
    });
  });

  it("renders week card with correct title", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Week 1, 2024")).toBeInTheDocument();
    });
  });

  it("renders stats cards with correct values", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getAllByText("25.00 km").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2h").length).toBeGreaterThan(0);
      expect(screen.getByText("TSS")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
    });
  });

  it("renders sports breakdown section", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Sports Breakdown")).toBeInTheDocument();
    });
  });

  it("renders sports breakdown with legend", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText(/running \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/cycling \(1\)/)).toBeInTheDocument();
    });
  });

  it("renders activities section with activity titles", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Race Day 5K")).toBeInTheDocument();
    });
  });

  it("renders activity links", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Race Day 5K")).toBeInTheDocument();
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });
  });

  it("renders race chip for race activities", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Race")).toBeInTheDocument();
    });
  });

  it("does not show load more button when has_more is false", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Summary")).toBeInTheDocument();
    });

    expect(screen.queryByText("Load More Weeks")).not.toBeInTheDocument();
  });

  it("shows load more button when has_more is true", async () => {
    vi.mocked(api.fetchWeeks).mockResolvedValue(mockWeeksResponseWithMore);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Load More Weeks")).toBeInTheDocument();
    });
  });

  it("loads more weeks when load more button is clicked", async () => {
    vi.mocked(api.fetchWeeks)
      .mockResolvedValueOnce(mockWeeksResponseWithMore)
      .mockResolvedValueOnce(mockSecondPageResponse);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Load More Weeks")).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText("Load More Weeks");
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Week 52, 2023")).toBeInTheDocument();
    });

    expect(api.fetchWeeks).toHaveBeenCalledTimes(2);
    expect(api.fetchWeeks).toHaveBeenLastCalledWith(5, 5);
  });

  it("shows loading indicator when loading more", async () => {
    let resolveSecondCall: (value: WeeksResponse) => void = () => undefined;
    const secondCallPromise = new Promise<WeeksResponse>((resolve) => {
      resolveSecondCall = resolve;
    });

    vi.mocked(api.fetchWeeks).mockResolvedValueOnce(mockWeeksResponseWithMore).mockReturnValueOnce(secondCallPromise);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Load More Weeks")).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText("Load More Weeks");
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    resolveSecondCall(mockSecondPageResponse);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("renders week with no sports breakdown when empty", async () => {
    const responseNoBreakdown: WeeksResponse = {
      weeks: [
        {
          ...mockWeeksResponse.weeks[0],
          sports_breakdown: {},
        },
      ],
      has_more: false,
      next_offset: 5,
    };

    vi.mocked(api.fetchWeeks).mockResolvedValue(responseNoBreakdown);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Week 1, 2024")).toBeInTheDocument();
    });

    expect(screen.queryByText("Sports Breakdown")).not.toBeInTheDocument();
  });

  it("renders week with no activities", async () => {
    const responseNoActivities: WeeksResponse = {
      weeks: [
        {
          ...mockWeeksResponse.weeks[0],
          activities: [],
        },
      ],
      has_more: false,
      next_offset: 5,
    };

    vi.mocked(api.fetchWeeks).mockResolvedValue(responseNoActivities);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("Week 1, 2024")).toBeInTheDocument();
    });
  });

  it("renders activity with null TSS as 0", async () => {
    const responseNullTss: WeeksResponse = {
      weeks: [
        {
          ...mockWeeksResponse.weeks[0],
          total_tss: null as unknown as number,
        },
      ],
      has_more: false,
      next_offset: 5,
    };

    vi.mocked(api.fetchWeeks).mockResolvedValue(responseNullTss);

    renderWithProviders(<WeeksPage />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
