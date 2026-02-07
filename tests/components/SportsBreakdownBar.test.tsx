import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import SportsBreakdownBar from "../../src/components/SportsBreakdownBar";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

afterEach(() => {
  cleanup();
});

describe("SportsBreakdownBar", () => {
  const mockBreakdown = {
    running: { distance: 15000, time: 4000, count: 2 },
    cycling: { distance: 10000, time: 3200, count: 1 },
  };

  it("renders null when breakdown is empty", () => {
    const { container } = renderWithTheme(<SportsBreakdownBar breakdown={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    renderWithTheme(<SportsBreakdownBar breakdown={mockBreakdown} />);
    expect(screen.getByText("Sports Breakdown")).toBeInTheDocument();
  });

  it("renders distance and time labels", () => {
    renderWithTheme(<SportsBreakdownBar breakdown={mockBreakdown} />);
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("renders total distance", () => {
    renderWithTheme(<SportsBreakdownBar breakdown={mockBreakdown} />);
    expect(screen.getByText("25.00 km")).toBeInTheDocument();
  });

  it("renders total time", () => {
    renderWithTheme(<SportsBreakdownBar breakdown={mockBreakdown} />);
    expect(screen.getByText("2h")).toBeInTheDocument();
  });

  it("renders legend with sport names and counts", () => {
    renderWithTheme(<SportsBreakdownBar breakdown={mockBreakdown} />);
    expect(screen.getByText("running (2)")).toBeInTheDocument();
    expect(screen.getByText("cycling (1)")).toBeInTheDocument();
  });

  it("renders single sport breakdown", () => {
    const singleSport = {
      swimming: { distance: 2000, time: 1800, count: 1 },
    };
    renderWithTheme(<SportsBreakdownBar breakdown={singleSport} />);
    expect(screen.getByText("swimming (1)")).toBeInTheDocument();
    expect(screen.getAllByText("2.00 km").length).toBeGreaterThan(0);
  });

  it("renders all three sports", () => {
    const allSports = {
      running: { distance: 10000, time: 3600, count: 1 },
      cycling: { distance: 20000, time: 3600, count: 1 },
      swimming: { distance: 1500, time: 1800, count: 1 },
    };
    renderWithTheme(<SportsBreakdownBar breakdown={allSports} />);
    expect(screen.getByText("running (1)")).toBeInTheDocument();
    expect(screen.getByText("cycling (1)")).toBeInTheDocument();
    expect(screen.getByText("swimming (1)")).toBeInTheDocument();
  });

  it("handles zero distance sport", () => {
    const withZero = {
      running: { distance: 10000, time: 3600, count: 1 },
      cycling: { distance: 0, time: 0, count: 0 },
    };
    renderWithTheme(<SportsBreakdownBar breakdown={withZero} />);
    expect(screen.getByText("running (1)")).toBeInTheDocument();
    expect(screen.getByText("cycling (0)")).toBeInTheDocument();
  });
});
