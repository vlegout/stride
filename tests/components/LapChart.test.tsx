import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import LapChart from "../../src/components/LapChart";
import type { Lap } from "../../src/types";

vi.mock("react-konva", () => ({
  Stage: ({ children, width, height }: { children: React.ReactNode; width: number; height: number }) => (
    <div data-testid="konva-stage" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Rect: ({ name, fill }: { name: string; fill: string }) => (
    <div data-testid="konva-rect" data-name={name} data-fill={fill} />
  ),
  Text: ({ text, x, y }: { text: string; x: number; y: number }) => (
    <div data-testid="konva-text" data-text={text} data-x={x} data-y={y}>
      {text}
    </div>
  ),
  Line: () => <div data-testid="konva-line" />,
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

const createMockLap = (overrides: Partial<Lap> = {}, index = 0): Lap => ({
  index,
  start_time: index * 300,
  total_elapsed_time: 300,
  total_timer_time: 300,
  total_distance: 1000,
  max_heart_rate: 170,
  avg_heart_rate: 150,
  max_speed: 4.5,
  ...overrides,
});

const createMockLaps = (count: number, baseTime = 300): Lap[] =>
  Array.from({ length: count }, (_, i) =>
    createMockLap(
      {
        total_timer_time: baseTime + ((i % 3) * 10 - 10),
        total_distance: 1000,
      },
      i,
    ),
  );

describe("LapChart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("should render nothing for swimming sport", () => {
      const { container } = renderWithTheme(<LapChart laps={createMockLaps(5)} sport="swimming" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing for swimming laps with zero distance", () => {
      const laps = [
        createMockLap({ total_distance: 500 }, 0),
        createMockLap({ total_distance: 100 }, 1),
        createMockLap({ total_distance: 0 }, 2),
        createMockLap({ total_distance: 0 }, 3),
      ];
      const { container } = renderWithTheme(<LapChart laps={laps} sport="swimming" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing for single lap", () => {
      const { container } = renderWithTheme(<LapChart laps={createMockLaps(1)} sport="running" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing for empty laps", () => {
      const { container } = renderWithTheme(<LapChart laps={[]} sport="running" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when lap data has null values", () => {
      const laps = [createMockLap({ total_timer_time: null as unknown as number }, 0), createMockLap({}, 1)];
      const { container } = renderWithTheme(<LapChart laps={laps} sport="running" />);
      expect(container.firstChild).toBeNull();
    });

    it("should render chart for valid running data", () => {
      renderWithTheme(<LapChart laps={createMockLaps(5)} sport="running" />);
      expect(screen.getByTestId("konva-stage")).toBeInTheDocument();
    });

    it("should render chart for valid cycling data", () => {
      renderWithTheme(<LapChart laps={createMockLaps(5)} sport="cycling" />);
      expect(screen.getByTestId("konva-stage")).toBeInTheDocument();
    });

    it("should have correct aria-label for running", () => {
      renderWithTheme(<LapChart laps={createMockLaps(5)} sport="running" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Lap pace chart showing 5 laps");
    });

    it("should have correct aria-label for cycling", () => {
      renderWithTheme(<LapChart laps={createMockLaps(5)} sport="cycling" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Lap speed chart showing 5 laps");
    });
  });

  describe("x-axis label thinning", () => {
    it("should show all labels for 10 or fewer laps", () => {
      renderWithTheme(<LapChart laps={createMockLaps(10)} sport="running" />);
      const labels = screen.getAllByTestId("konva-text");
      const xAxisLabels = labels.filter((l) => {
        const text = l.getAttribute("data-text");
        return text && /^\d+$/.test(text);
      });
      expect(xAxisLabels.length).toBe(10);
    });

    it("should show fewer labels for 15 laps (every 2nd + first + last)", () => {
      renderWithTheme(<LapChart laps={createMockLaps(15)} sport="running" />);
      const labels = screen.getAllByTestId("konva-text");
      const xAxisLabels = labels.filter((l) => {
        const text = l.getAttribute("data-text");
        return text && /^\d+$/.test(text);
      });
      // First (1), every 2nd (2,4,6,8,10,12,14), last (15) = 1 + 7 + 1 = 9
      // But 14 overlaps with interval, so: 1, 2, 4, 6, 8, 10, 12, 14, 15 = 9
      expect(xAxisLabels.length).toBeLessThan(15);
    });

    it("should show even fewer labels for 25 laps (every 5th + first + last)", () => {
      renderWithTheme(<LapChart laps={createMockLaps(25)} sport="running" />);
      const labels = screen.getAllByTestId("konva-text");
      const xAxisLabels = labels.filter((l) => {
        const text = l.getAttribute("data-text");
        return text && /^\d+$/.test(text);
      });
      // First (1), every 5th (5,10,15,20,25), last (25) - 25 overlaps = 1 + 5 = 6
      expect(xAxisLabels.length).toBeLessThanOrEqual(7);
    });

    it("should show minimal labels for 40 laps (every 10th + first + last)", () => {
      renderWithTheme(<LapChart laps={createMockLaps(40)} sport="running" />);
      const labels = screen.getAllByTestId("konva-text");
      const xAxisLabels = labels.filter((l) => {
        const text = l.getAttribute("data-text");
        return text && /^\d+$/.test(text);
      });
      // First (1), every 10th (10,20,30,40), last (40) - 40 overlaps = 1 + 4 = 5
      expect(xAxisLabels.length).toBeLessThanOrEqual(6);
    });
  });

  describe("pace formatting", () => {
    it("should display pace in mm:ss format for running", () => {
      const laps = [
        createMockLap({ total_timer_time: 330, total_distance: 1000 }, 0),
        createMockLap({ total_timer_time: 300, total_distance: 1000 }, 1),
      ];
      renderWithTheme(<LapChart laps={laps} sport="running" />);
      const rects = screen.getAllByTestId("konva-rect");
      // Pace = time / (distance/1000) = 330 / 1 = 330 sec = 5:30
      expect(rects.some((r) => r.getAttribute("data-name") === "5:30")).toBe(true);
    });

    it("should display speed in km/h for cycling", () => {
      const laps = [
        createMockLap({ total_timer_time: 100, total_distance: 1000 }, 0),
        createMockLap({ total_timer_time: 100, total_distance: 1000 }, 1),
      ];
      renderWithTheme(<LapChart laps={laps} sport="cycling" />);
      const rects = screen.getAllByTestId("konva-rect");
      // Speed = (distance / time) * 3.6 = (1000 / 100) * 3.6 = 36 km/h
      expect(rects.some((r) => r.getAttribute("data-name") === "36.0")).toBe(true);
    });
  });

  describe("grid lines", () => {
    it("should render grid lines", () => {
      renderWithTheme(<LapChart laps={createMockLaps(5)} sport="running" />);
      const lines = screen.getAllByTestId("konva-line");
      expect(lines.length).toBeGreaterThan(0);
    });
  });
});
