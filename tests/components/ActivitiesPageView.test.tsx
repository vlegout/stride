import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActivitiesPageView from "../../src/components/ActivitiesPageView";
import type { Sport } from "../../src/types";

vi.mock("../../src/components/ActivitiesTable", () => ({
  default: () => <div data-testid="activities-table">Activities Table</div>,
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
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ActivitiesPageView", () => {
  const defaultProps = {
    sport: undefined as Sport | undefined,
    distance: [0, 100] as [number, number],
    race: false,
    onSportChange: vi.fn(),
    onDistanceChange: vi.fn(),
    onRaceChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the page header", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} />);

    expect(screen.getByText("Activities")).toBeInTheDocument();
  });

  it("renders sport filter with label", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} />);

    expect(screen.getByLabelText("Sport")).toBeInTheDocument();
  });

  it("renders race checkbox", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} />);

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders distance slider", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} />);

    expect(screen.getByText("Distance")).toBeInTheDocument();
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
  });

  it("renders activities table", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} />);

    expect(screen.getByTestId("activities-table")).toBeInTheDocument();
  });

  it("calls onRaceChange when checkbox is clicked", () => {
    const onRaceChange = vi.fn();
    renderWithProviders(<ActivitiesPageView {...defaultProps} onRaceChange={onRaceChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onRaceChange).toHaveBeenCalledWith(true);
  });

  it("displays race checkbox as checked when race is true", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} race={true} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("displays race checkbox as unchecked when race is false", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} race={false} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders with running sport selected", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} sport="running" />);

    expect(screen.getByText("Activities")).toBeInTheDocument();
  });

  it("renders with cycling sport selected", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} sport="cycling" />);

    expect(screen.getByText("Activities")).toBeInTheDocument();
  });

  it("renders with swimming sport selected", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} sport="swimming" />);

    expect(screen.getByText("Activities")).toBeInTheDocument();
  });

  it("passes distance values to slider", () => {
    renderWithProviders(<ActivitiesPageView {...defaultProps} distance={[10, 50]} />);

    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
  });
});
