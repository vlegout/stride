import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../../src/pages/Home";
import { createMockActivity } from "../mocks/apiMocks";

vi.mock("../../src/hooks", () => ({
  useHomeActivities: vi.fn(),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

vi.mock("../../src/components/HomePageView", () => ({
  default: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="home-page-view">
      <div>Activities count: {activities.length}</div>
    </div>
  ),
}));

import { useHomeActivities } from "../../src/hooks";

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading indicator when pending", () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<Home />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });

  it("should show loading indicator when fetching", () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isFetching: true,
    } as never);

    render(<Home />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
  });

  it("should show loading indicator when error", () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      data: undefined,
      error: new Error("Failed to load"),
      isPending: false,
      isFetching: false,
    } as never);

    render(<Home />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render HomePageView with activities when loaded", () => {
    const mockActivities = [createMockActivity(), createMockActivity({ id: "activity-2", title: "Evening Run" })];

    vi.mocked(useHomeActivities).mockReturnValue({
      data: { activities: mockActivities },
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Home />);

    expect(screen.getByTestId("home-page-view")).toBeInTheDocument();
    expect(screen.getByText("Activities count: 2")).toBeInTheDocument();
  });

  it("should render HomePageView with empty activities array", () => {
    vi.mocked(useHomeActivities).mockReturnValue({
      data: { activities: [] },
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<Home />);

    expect(screen.getByTestId("home-page-view")).toBeInTheDocument();
    expect(screen.getByText("Activities count: 0")).toBeInTheDocument();
  });
});
