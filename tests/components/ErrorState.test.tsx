import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorState from "../../src/components/ErrorState";
import type { ApiError } from "../../src/api/types";

describe("ErrorState", () => {
  afterEach(() => {
    cleanup();
  });

  const basicError: ApiError = {
    message: "Something went wrong",
  };

  const detailedError: ApiError = {
    message: "Validation failed",
    status: 400,
    code: "VALIDATION_ERROR",
    details: { field: "email", reason: "invalid format" },
  };

  it("should display error message", () => {
    const { container } = render(<ErrorState error={basicError} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Find the specific error title in this test's container
    const errorTitles = container.querySelectorAll("h6");
    const errorTitle = Array.from(errorTitles).find((title) => title.textContent === "Error");
    expect(errorTitle).toBeInTheDocument();
  });

  it("should display 'Not Found' title for 404 errors", () => {
    const notFoundError: ApiError = {
      message: "Resource not found",
      status: 404,
    };

    render(<ErrorState error={notFoundError} />);

    expect(screen.getByText("Not Found")).toBeInTheDocument();
    expect(screen.getByText("Resource not found")).toBeInTheDocument();
  });

  it("should display 'Error' title for non-404 errors", () => {
    const serverError: ApiError = {
      message: "Internal server error",
      status: 500,
    };

    const { container } = render(<ErrorState error={serverError} />);

    expect(screen.getByText("Internal server error")).toBeInTheDocument();

    // Find the specific error title in this test's container
    const errorTitles = container.querySelectorAll("h6");
    const errorTitle = Array.from(errorTitles).find((title) => title.textContent === "Error");
    expect(errorTitle).toBeInTheDocument();
  });

  it("should show retry button when onRetry is provided", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState error={basicError} onRetry={onRetry} />);

    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not show retry button when onRetry is not provided", () => {
    render(<ErrorState error={basicError} />);

    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });

  it("should show error details when showDetails is true", () => {
    render(<ErrorState error={detailedError} showDetails={true} />);

    expect(screen.getByText("Validation failed")).toBeInTheDocument();

    // Should show stringified details
    const detailsText = screen.getByText(
      (content) => content.includes('"field": "email"') && content.includes('"reason": "invalid format"'),
    );
    expect(detailsText).toBeInTheDocument();
  });

  it("should not show error details when showDetails is false", () => {
    render(<ErrorState error={detailedError} showDetails={false} />);

    expect(screen.getByText("Validation failed")).toBeInTheDocument();
    expect(screen.queryByText(/field.*email/)).not.toBeInTheDocument();
  });

  it("should not show details section when details is undefined", () => {
    render(<ErrorState error={basicError} showDetails={true} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText(/\{/)).not.toBeInTheDocument(); // No JSON details
  });

  it("should handle string details correctly", () => {
    const errorWithStringDetails: ApiError = {
      message: "Test error",
      details: "Additional error information",
    };

    render(<ErrorState error={errorWithStringDetails} showDetails={true} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Additional error information")).toBeInTheDocument();
  });

  it("should handle non-object details correctly", () => {
    const errorWithPrimitiveDetails: ApiError = {
      message: "Test error",
      details: 12345,
    };

    render(<ErrorState error={errorWithPrimitiveDetails} showDetails={true} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("should render in centered layout by default", () => {
    const { container } = render(<ErrorState error={basicError} />);

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
    const { container } = render(<ErrorState error={basicError} centered={false} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      display: "flex",
      "flex-direction": "column",
      gap: "16px", // 2 * 8px (MUI theme spacing)
    });
    expect(wrapper).not.toHaveStyle({
      "align-items": "center",
      "justify-content": "center",
      "min-height": "200px",
    });
  });

  it("should handle complex error details objects", () => {
    const complexError: ApiError = {
      message: "Complex error",
      details: {
        errors: [
          { field: "name", message: "Required" },
          { field: "email", message: "Invalid format" },
        ],
        timestamp: "2024-01-01T10:00:00Z",
        requestId: "req-123",
      },
    };

    render(<ErrorState error={complexError} showDetails={true} />);

    expect(screen.getByText("Complex error")).toBeInTheDocument();

    // Should contain parts of the complex details
    const detailsElement = screen.getByText((content) => content.includes("errors") && content.includes("timestamp"));
    expect(detailsElement).toBeInTheDocument();
  });

  it("should handle null details object", () => {
    const errorWithNullDetails: ApiError = {
      message: "Test error",
      details: null,
    };

    render(<ErrorState error={errorWithNullDetails} showDetails={true} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("should display all props correctly together", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState error={detailedError} onRetry={onRetry} showDetails={true} centered={false} />);

    // Check error display
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Validation failed")).toBeInTheDocument();

    // Check details
    expect(screen.getByText((content) => content.includes("field"))).toBeInTheDocument();

    // Check retry button
    const retryButton = screen.getByText("Try again");
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
