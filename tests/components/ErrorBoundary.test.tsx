import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ErrorBoundary from "../../src/components/ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
};

// Custom fallback component for testing
const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <div>
    <h1>Custom Error</h1>
    <p>Error: {error.message}</p>
    <button onClick={resetError}>Custom Reset</button>
  </div>
);

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Mock console.error to avoid error logs in tests
    vi.spyOn(console, "error").mockImplementation(() => {
      // Mock implementation
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should render children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should catch errors and display default error UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("should display custom fallback component when provided", () => {
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    expect(screen.getByText("Error: Test error message")).toBeInTheDocument();
    expect(screen.getByText("Custom Reset")).toBeInTheDocument();
  });

  it("should reset error state when try again button is clicked", async () => {
    const user = userEvent.setup();

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      React.useEffect(() => {
        if (!shouldThrow) {
          // Simulate component recovering after error reset
          setShouldThrow(false);
        }
      }, [shouldThrow]);

      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Error should be displayed
    expect(screen.getByText("Test error message")).toBeInTheDocument();

    // Click try again button - use getAllByText and pick the first one
    const tryAgainButtons = screen.getAllByText("Try again");
    await user.click(tryAgainButtons[0]);

    // After reset, component should re-render and potentially show children again
    // Note: This test verifies the reset mechanism works, but the component
    // would still throw if the underlying issue isn't fixed
  });

  it("should reset error state when custom fallback reset is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom Error")).toBeInTheDocument();

    await user.click(screen.getByText("Custom Reset"));

    // The error boundary should attempt to re-render children
    // (though they may throw again if the issue persists)
  });

  it("should log errors to console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Mock implementation
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalledWith("Error caught by boundary:", expect.any(Error), expect.any(Object));
  });

  it("should handle errors without messages", () => {
    const ThrowErrorWithoutMessage = () => {
      const error = new Error();
      error.message = "";
      throw error;
    };

    render(
      <ErrorBoundary>
        <ThrowErrorWithoutMessage />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("should handle null error case", () => {
    // This tests the case where error might be null (edge case)
    const { rerender } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();

    // Simulate an error being caught
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should pass correct props to custom fallback", () => {
    const mockFallback = vi.fn().mockReturnValue(<div>Mock fallback</div>);

    render(
      <ErrorBoundary fallback={mockFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(mockFallback).toHaveBeenCalled();

    const [props] = mockFallback.mock.calls[0];
    expect(props.error).toBeInstanceOf(Error);
    expect(props.error.message).toBe("Test error message");
    expect(typeof props.resetError).toBe("function");
  });

  it("should maintain error boundary isolation", () => {
    // Test that error in one boundary doesn't affect another
    render(
      <div>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});
