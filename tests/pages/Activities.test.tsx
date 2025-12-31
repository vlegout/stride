import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivitiesPage from "../../src/pages/Activities";

vi.mock("../../src/store", () => ({
  useActivitiesStore: vi.fn(),
}));

vi.mock("../../src/components/ActivitiesPageView", () => ({
  default: ({
    sport,
    distance,
    race,
    onSportChange,
    onDistanceChange,
    onRaceChange,
  }: {
    sport: string;
    distance: [number, number];
    race: boolean;
    onSportChange: (sport: string) => void;
    onDistanceChange: (distance: [number, number]) => void;
    onRaceChange: (race: boolean) => void;
  }) => (
    <div data-testid="activities-page-view">
      <div>Sport: {sport || "all"}</div>
      <div>
        Distance: {distance[0]}-{distance[1]}
      </div>
      <div>Race: {race ? "yes" : "no"}</div>
      <button onClick={() => onSportChange("running")}>Change Sport</button>
      <button onClick={() => onDistanceChange([5, 50])}>Change Distance</button>
      <button onClick={() => onRaceChange(true)}>Change Race</button>
    </div>
  ),
}));

import { useActivitiesStore } from "../../src/store";

describe("ActivitiesPage", () => {
  const mockSetSport = vi.fn();
  const mockSetDistance = vi.fn();
  const mockSetRace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActivitiesStore).mockReturnValue({
      sport: undefined,
      distance: [0, 100] as [number, number],
      race: false,
      setSport: mockSetSport,
      setDistance: mockSetDistance,
      setRace: mockSetRace,
    });
  });

  it("should render ActivitiesPageView with default values", () => {
    render(<ActivitiesPage />);

    expect(screen.getByTestId("activities-page-view")).toBeInTheDocument();
    expect(screen.getByText("Sport: all")).toBeInTheDocument();
    expect(screen.getByText("Distance: 0-100")).toBeInTheDocument();
    expect(screen.getByText("Race: no")).toBeInTheDocument();
  });

  it("should render ActivitiesPageView with running sport", () => {
    vi.mocked(useActivitiesStore).mockReturnValue({
      sport: "running",
      distance: [0, 100] as [number, number],
      race: false,
      setSport: mockSetSport,
      setDistance: mockSetDistance,
      setRace: mockSetRace,
    });

    render(<ActivitiesPage />);

    expect(screen.getByText("Sport: running")).toBeInTheDocument();
  });

  it("should render ActivitiesPageView with race filter", () => {
    vi.mocked(useActivitiesStore).mockReturnValue({
      sport: undefined,
      distance: [0, 100] as [number, number],
      race: true,
      setSport: mockSetSport,
      setDistance: mockSetDistance,
      setRace: mockSetRace,
    });

    render(<ActivitiesPage />);

    expect(screen.getByText("Race: yes")).toBeInTheDocument();
  });

  it("should render ActivitiesPageView with custom distance", () => {
    vi.mocked(useActivitiesStore).mockReturnValue({
      sport: undefined,
      distance: [10, 50] as [number, number],
      race: false,
      setSport: mockSetSport,
      setDistance: mockSetDistance,
      setRace: mockSetRace,
    });

    render(<ActivitiesPage />);

    expect(screen.getByText("Distance: 10-50")).toBeInTheDocument();
  });

  it("should pass store setters to ActivitiesPageView", () => {
    render(<ActivitiesPage />);

    const changeSportButton = screen.getByText("Change Sport");
    const changeDistanceButton = screen.getByText("Change Distance");
    const changeRaceButton = screen.getByText("Change Race");

    changeSportButton.click();
    expect(mockSetSport).toHaveBeenCalledWith("running");

    changeDistanceButton.click();
    expect(mockSetDistance).toHaveBeenCalledWith([5, 50]);

    changeRaceButton.click();
    expect(mockSetRace).toHaveBeenCalledWith(true);
  });
});
