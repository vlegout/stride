import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import StatsCard from "../../../src/components/ui/StatsCard";

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

afterEach(() => {
  cleanup();
});

describe("StatsCard", () => {
  it("should render title and value", () => {
    renderWithTheme(<StatsCard title="Distance" value="10.5 km" />);
    expect(screen.getByText("Distance")).toBeInTheDocument();
    expect(screen.getByText("10.5 km")).toBeInTheDocument();
  });

  it("should render numeric values", () => {
    renderWithTheme(<StatsCard title="Activities" value={42} />);
    expect(screen.getByText("Activities")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should display dash for null value", () => {
    renderWithTheme(<StatsCard title="Heart Rate" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should display dash for zero value", () => {
    renderWithTheme(<StatsCard title="Power" value={0} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
