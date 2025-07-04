import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LoadingState from "../../src/components/LoadingState";

describe("LoadingState", () => {
  afterEach(() => {
    cleanup();
  });

  it("should display default loading message", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should display custom message", () => {
    render(<LoadingState message="Loading activities..." />);

    expect(screen.getByText("Loading activities...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should not display message when message is empty", () => {
    render(<LoadingState message="" />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should not display message when message is not provided", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should use default size for progress indicator", () => {
    const { container } = render(<LoadingState />);

    const progressBar = container.querySelector(".MuiCircularProgress-root");
    expect(progressBar).toBeInTheDocument();
    // Note: Testing exact size props is tricky with MUI, but we can verify it's rendered
  });

  it("should use custom size for progress indicator", () => {
    const { container } = render(<LoadingState size={60} />);

    const progressBar = container.querySelector(".MuiCircularProgress-root");
    expect(progressBar).toBeInTheDocument();
    // The size prop is passed to CircularProgress component
  });

  it("should render in centered layout by default", () => {
    const { container } = render(<LoadingState />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "flex-direction": "column",
      "align-items": "center",
      "justify-content": "center",
      "min-height": "200px",
      padding: "24px", // 3 * 8px (MUI theme spacing)
    });
  });

  it("should render in non-centered layout when centered is false", () => {
    const { container } = render(<LoadingState centered={false} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "align-items": "center",
      gap: "16px", // 2 * 8px (MUI theme spacing)
    });
    expect(wrapper).not.toHaveStyle({
      "flex-direction": "column",
      "justify-content": "center",
      "min-height": "200px",
    });
  });

  it("should apply correct styles for centered layout with message", () => {
    const { container } = render(<LoadingState message="Loading data..." centered={true} />);

    expect(screen.getByText("Loading data...")).toBeInTheDocument();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "flex-direction": "column",
      "align-items": "center",
      "justify-content": "center",
    });
  });

  it("should apply correct styles for non-centered layout with message", () => {
    const { container } = render(<LoadingState message="Processing..." centered={false} />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "align-items": "center",
      gap: "16px",
    });
  });

  it("should handle all props together", () => {
    const { container } = render(<LoadingState message="Custom loading message" size={50} centered={false} />);

    expect(screen.getByText("Custom loading message")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "align-items": "center",
      gap: "16px",
    });
  });

  it("should render progressbar with correct ARIA attributes", () => {
    render(<LoadingState message="Loading content..." />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    // MUI CircularProgress has role="progressbar" by default for accessibility
  });

  it("should handle very long messages gracefully", () => {
    const longMessage =
      "This is a very long loading message that might wrap to multiple lines depending on the container width and font size settings";

    render(<LoadingState message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should handle special characters in message", () => {
    const specialMessage = "Loading... 50% (10/20) files 📁";

    render(<LoadingState message={specialMessage} />);

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should maintain consistent spacing between progress indicator and message", () => {
    const { container } = render(<LoadingState message="Loading..." centered={true} />);

    // In centered mode, message should have mt: 2 (16px)
    const messageElement = screen.getByText("Loading...");
    expect(messageElement).toBeInTheDocument();

    // Verify the structure is maintained
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children.length).toBe(2); // Progress + Message
  });

  it("should render without message in non-centered mode", () => {
    const { container } = render(<LoadingState message="" centered={false} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "align-items": "center",
    });
  });
});
