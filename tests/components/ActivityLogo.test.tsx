import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ActivityLogo from "../../src/components/ActivityLogo";

vi.mock("../../src/data/bike.svg?react", () => ({
  default: ({ style }: { style: React.CSSProperties }) => <div data-testid="bike-logo" style={style} />,
}));

vi.mock("../../src/data/running.svg?react", () => ({
  default: ({ style }: { style: React.CSSProperties }) => <div data-testid="run-logo" style={style} />,
}));

describe("ActivityLogo", () => {
  afterEach(() => {
    cleanup();
  });
  describe("sport prop handling", () => {
    it("should render bike component for cycling sport", () => {
      render(<ActivityLogo sport="cycling" />);
      expect(screen.getByTestId("bike-logo")).toBeInTheDocument();
    });

    it("should render run component for running sport", () => {
      render(<ActivityLogo sport="running" />);
      expect(screen.getByTestId("run-logo")).toBeInTheDocument();
    });

    it("should not render anything for unknown sport", () => {
      const { container } = render(<ActivityLogo sport="swimming" />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render anything for empty sport string", () => {
      const { container } = render(<ActivityLogo sport="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("width prop handling", () => {
    it("should use default width of 40px when width prop is not provided", () => {
      render(<ActivityLogo sport="cycling" />);
      const logo = screen.getByTestId("bike-logo");
      expect(logo).toHaveStyle({ width: "40px", height: "40px" });
    });

    it("should use custom width when width prop is provided", () => {
      render(<ActivityLogo sport="cycling" width={60} />);
      const logo = screen.getByTestId("bike-logo");
      expect(logo).toHaveStyle({ width: "60px", height: "60px" });
    });

    it("should apply width to running logo as well", () => {
      render(<ActivityLogo sport="running" width={80} />);
      const logo = screen.getByTestId("run-logo");
      expect(logo).toHaveStyle({ width: "80px", height: "80px" });
    });

    it("should handle zero width", () => {
      render(<ActivityLogo sport="cycling" width={0} />);
      const logo = screen.getByTestId("bike-logo");
      expect(logo).toHaveStyle({ width: "0px", height: "0px" });
    });
  });
});
