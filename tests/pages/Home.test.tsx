import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Home from "../../src/pages/Home";
import * as api from "../../src/api";
import type { ActivitiesResponse } from "../../src/types";
import { createMockActivity } from "../mocks/apiMocks";

vi.mock("../../src/api", () => ({
  fetchActivities: vi.fn(),
  createActivitiesQueryKey: vi.fn((params) => ["activities", params]),
}));

vi.mock("../../src/components/ActivityBox", () => ({
  default: ({ activity }: { activity: { title: string } }) => <div data-testid="activity-box">{activity.title}</div>,
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

const mockFirstPage: ActivitiesResponse = {
  activities: [
    createMockActivity({ id: "activity-1", title: "Morning Run" }),
    createMockActivity({ id: "activity-2", title: "Afternoon Ride" }),
  ],
  pagination: { page: 1, per_page: 5, total: 7 },
};

const mockFirstPageNoMore: ActivitiesResponse = {
  activities: [createMockActivity({ id: "activity-1", title: "Morning Run" })],
  pagination: { page: 1, per_page: 5, total: 1 },
};

const mockSecondPage: ActivitiesResponse = {
  activities: [createMockActivity({ id: "activity-3", title: "Evening Swim" })],
  pagination: { page: 2, per_page: 5, total: 7 },
};

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state initially", () => {
    vi.mocked(api.fetchActivities).mockImplementation(() => new Promise(() => undefined));

    renderWithProviders(<Home />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(api.fetchActivities).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading activities/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("renders page header", async () => {
    vi.mocked(api.fetchActivities).mockResolvedValue(mockFirstPageNoMore);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Recent Activities")).toBeInTheDocument();
    });
  });

  it("renders activity titles", async () => {
    vi.mocked(api.fetchActivities).mockResolvedValue(mockFirstPage);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Afternoon Ride")).toBeInTheDocument();
    });
  });

  it("does not show load more button when no more activities", async () => {
    vi.mocked(api.fetchActivities).mockResolvedValue(mockFirstPageNoMore);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Recent Activities")).toBeInTheDocument();
    });

    expect(screen.queryByText("Load More Activities")).not.toBeInTheDocument();
  });

  it("shows load more button when more activities exist", async () => {
    vi.mocked(api.fetchActivities).mockResolvedValue(mockFirstPage);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Load More Activities")).toBeInTheDocument();
    });
  });

  it("loads more activities when load more button is clicked", async () => {
    vi.mocked(api.fetchActivities).mockResolvedValueOnce(mockFirstPage).mockResolvedValueOnce(mockSecondPage);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Load More Activities")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Load More Activities"));

    await waitFor(() => {
      expect(screen.getByText("Evening Swim")).toBeInTheDocument();
    });

    expect(api.fetchActivities).toHaveBeenCalledTimes(2);
  });

  it("shows loading indicator when loading more", async () => {
    let resolveSecondCall: (value: ActivitiesResponse) => void = () => undefined;
    const secondCallPromise = new Promise<ActivitiesResponse>((resolve) => {
      resolveSecondCall = resolve;
    });

    vi.mocked(api.fetchActivities).mockResolvedValueOnce(mockFirstPage).mockReturnValueOnce(secondCallPromise);

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Load More Activities")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Load More Activities"));

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    resolveSecondCall(mockSecondPage);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});
