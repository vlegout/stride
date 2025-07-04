import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useErrorHandler } from "../../src/hooks/useErrorHandler";
import type { ApiError } from "../../src/api/types";

// Mock console methods
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Mock implementation
});
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {
  // Mock implementation
});

describe("useErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleError", () => {
    it("should handle ApiError objects correctly", () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError: ApiError = {
        message: "Test API error",
        status: 400,
        code: "TEST_ERROR",
        details: { key: "value" },
      };

      let handledError: ApiError | undefined;
      act(() => {
        handledError = result.current.handleError(apiError);
      });

      expect(handledError).toEqual(apiError);
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", apiError);
      expect(mockConsoleWarn).toHaveBeenCalledWith("Toast notification not implemented yet:", "Test API error");
    });

    it("should convert Error objects to ApiError with stack trace", () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error("Test error");
      error.name = "TestError";

      let handledError: ApiError | undefined;
      act(() => {
        handledError = result.current.handleError(error);
      });

      expect(handledError?.message).toBe("Test error");
      expect(handledError?.details).toEqual({
        name: "TestError",
        stack: error.stack,
        originalError: error,
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", handledError);
    });

    it("should call onError callback when provided", () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onError }));
      const apiError: ApiError = { message: "Test error" };

      act(() => {
        result.current.handleError(apiError);
      });

      expect(onError).toHaveBeenCalledWith(apiError);
    });

    it("should respect logError option", () => {
      const { result } = renderHook(() => useErrorHandler({ logError: false }));
      const apiError: ApiError = { message: "Test error" };

      act(() => {
        result.current.handleError(apiError);
      });

      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it("should respect showToast option", () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));
      const apiError: ApiError = { message: "Test error" };

      act(() => {
        result.current.handleError(apiError);
      });

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe("transformError", () => {
    it("should handle null/undefined errors", () => {
      const { result } = renderHook(() => useErrorHandler());

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(null);
      });

      expect(transformedError).toEqual({ message: "An unknown error occurred" });

      act(() => {
        transformedError = result.current.transformError(undefined);
      });

      expect(transformedError).toEqual({ message: "An unknown error occurred" });
    });

    it("should handle string errors", () => {
      const { result } = renderHook(() => useErrorHandler());

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError("String error message");
      });

      expect(transformedError).toEqual({ message: "String error message" });
    });

    it("should handle Error instances with stack trace", () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error("Test error");
      error.name = "TypeError";

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(error);
      });

      expect(transformedError?.message).toBe("Test error");
      expect(transformedError?.details).toEqual({
        name: "TypeError",
        stack: error.stack,
        originalError: error,
      });
    });

    it("should handle object errors with message property", () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = {
        message: "Object error message",
        status: 500,
        code: "SERVER_ERROR",
        details: { extra: "info" },
      };

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(errorObj);
      });

      expect(transformedError).toEqual({
        message: "Object error message",
        status: 500,
        code: "SERVER_ERROR",
        details: { extra: "info" },
      });
    });

    it("should handle object errors with detail property", () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = {
        detail: "Detail error message",
        status: 400,
      };

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(errorObj);
      });

      expect(transformedError).toEqual({
        message: "Detail error message",
        status: 400,
      });
    });

    it("should handle object errors without message or detail", () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = {
        status: 400,
        code: "BAD_REQUEST",
      };

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(errorObj);
      });

      expect(transformedError).toEqual({
        message: "An error occurred",
        status: 400,
        code: "BAD_REQUEST",
      });
    });

    it("should handle object errors with invalid types", () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = {
        message: 123, // Invalid type
        status: "not a number", // Invalid type
        code: true, // Invalid type
        details: "some details",
      };

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(errorObj);
      });

      expect(transformedError).toEqual({
        message: "An error occurred",
        details: "some details",
      });
    });

    it("should handle completely unknown error types", () => {
      const { result } = renderHook(() => useErrorHandler());

      let transformedError: ApiError | undefined;
      act(() => {
        transformedError = result.current.transformError(123);
      });

      expect(transformedError).toEqual({ message: "An unknown error occurred" });
    });
  });

  describe("options", () => {
    it("should use default options when none provided", () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError: ApiError = { message: "Test error" };

      act(() => {
        result.current.handleError(apiError);
      });

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it("should merge provided options with defaults", () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onError, logError: false }));
      const apiError: ApiError = { message: "Test error" };

      act(() => {
        result.current.handleError(apiError);
      });

      expect(mockConsoleError).not.toHaveBeenCalled(); // logError: false
      expect(mockConsoleWarn).toHaveBeenCalled(); // showToast: true (default)
      expect(onError).toHaveBeenCalled(); // custom onError
    });
  });
});
