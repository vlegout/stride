import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityPage from "../../src/pages/Activity";
import { createMockActivity } from "../mocks/apiMocks";

vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
}));

vi.mock("../../src/hooks", () => ({
  useActivityData: vi.fn(),
}));

vi.mock("../../src/components/LoadingIndicator", () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading">{message}</div>,
}));

vi.mock("../../src/components/ActivityPageView", () => ({
  default: () => (
    <div data-testid="activity-page-view">
      <div>Activity data loaded</div>
    </div>
  ),
}));

import { useParams } from "react-router-dom";
import { useActivityData } from "../../src/hooks";

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: "activity-123" });
  });

  it("should show loading indicator when pending", () => {
    vi.mocked(useActivityData).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<ActivityPage />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading activity...")).toBeInTheDocument();
  });

  it("should show loading indicator when fetching", () => {
    vi.mocked(useActivityData).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isFetching: true,
    } as never);

    render(<ActivityPage />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Loading activity...")).toBeInTheDocument();
  });

  it("should show loading indicator when error", () => {
    vi.mocked(useActivityData).mockReturnValue({
      data: undefined,
      error: new Error("Failed to load activity"),
      isPending: false,
      isFetching: false,
    } as never);

    render(<ActivityPage />);

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should render ActivityPageView with activity data", () => {
    const mockActivity = createMockActivity();

    vi.mocked(useActivityData).mockReturnValue({
      data: { activity: mockActivity, zones: {} },
      error: null,
      isPending: false,
      isFetching: false,
    } as never);

    render(<ActivityPage />);

    expect(screen.getByTestId("activity-page-view")).toBeInTheDocument();
    expect(screen.getByText("Activity data loaded")).toBeInTheDocument();
  });

  it("should call useActivityData with id from params", () => {
    const mockUseActivityData = vi.mocked(useActivityData);
    mockUseActivityData.mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<ActivityPage />);

    expect(mockUseActivityData).toHaveBeenCalledWith("activity-123");
  });

  it("should handle missing id in params", () => {
    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useActivityData).mockReturnValue({
      data: undefined,
      error: null,
      isPending: true,
      isFetching: false,
    } as never);

    render(<ActivityPage />);

    expect(useActivityData).toHaveBeenCalledWith(undefined);
  });
});
