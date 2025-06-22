import { describe, it, expect, vi } from "vitest";
import ActivityLogo from "../../src/components/ActivityLogo";

// Mock the SVG imports
vi.mock("../../src/data/bike.svg?react", () => ({
  default: ({ style }: { style: React.CSSProperties }) => <div data-testid="bike-logo" style={style} />,
}));

vi.mock("../../src/data/running.svg?react", () => ({
  default: ({ style }: { style: React.CSSProperties }) => <div data-testid="run-logo" style={style} />,
}));

describe("ActivityLogo", () => {
  describe("sport prop handling", () => {
    it("should return bike component for cycling sport", () => {
      const result = ActivityLogo({ sport: "cycling" });
      expect(result).toBeTruthy();
      expect(result?.type).toBeDefined();
    });

    it("should return run component for running sport", () => {
      const result = ActivityLogo({ sport: "running" });
      expect(result).toBeTruthy();
      expect(result?.type).toBeDefined();
    });

    it("should return null for unknown sport", () => {
      const result = ActivityLogo({ sport: "swimming" });
      expect(result).toBeNull();
    });

    it("should return null for empty sport string", () => {
      const result = ActivityLogo({ sport: "" });
      expect(result).toBeNull();
    });
  });

  describe("width prop handling", () => {
    it("should use default width of 40px when width prop is not provided", () => {
      const result = ActivityLogo({ sport: "cycling" });
      expect(result?.props.style).toEqual({
        width: "40px",
        height: "40px",
      });
    });

    it("should use custom width when width prop is provided", () => {
      const result = ActivityLogo({ sport: "cycling", width: 60 });
      expect(result?.props.style).toEqual({
        width: "60px",
        height: "60px",
      });
    });

    it("should apply width to running logo as well", () => {
      const result = ActivityLogo({ sport: "running", width: 80 });
      expect(result?.props.style).toEqual({
        width: "80px",
        height: "80px",
      });
    });

    it("should handle zero width", () => {
      const result = ActivityLogo({ sport: "cycling", width: 0 });
      expect(result?.props.style).toEqual({
        width: "0px",
        height: "0px",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle case sensitivity", () => {
      expect(ActivityLogo({ sport: "Cycling" })).toBeNull();
      expect(ActivityLogo({ sport: "Running" })).toBeNull();
    });
  });
});
