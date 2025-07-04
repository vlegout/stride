import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useApiQuery } from "../../src/hooks/useApiQuery";
import type { ApiError } from "../../src/api/types";

// Mock useErrorHandler
const mockTransformError = vi.fn();
vi.mock("../../src/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({
    transformError: mockTransformError,
  }),
}));

describe("useApiQuery", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  it("should return loading state initially", () => {
    const queryFn = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        }),
    );

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isEmpty).toBe(false);
  });

  it("should return successful data", async () => {
    const mockData = { id: 1, name: "Test" };
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEmpty).toBe(false);
  });

  it("should handle errors correctly", async () => {
    const mockError = new Error("Test error");
    const transformedError: ApiError = { message: "Transformed error" };
    mockTransformError.mockReturnValue(transformedError);

    const queryFn = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(transformedError);
    expect(mockTransformError).toHaveBeenCalledWith(mockError);
  });

  it("should detect empty arrays correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue([]);

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it("should detect empty objects correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({});
    expect(result.current.isEmpty).toBe(true);
  });

  it("should handle non-empty arrays correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue([1, 2, 3]);

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([1, 2, 3]);
    expect(result.current.isEmpty).toBe(false);
  });

  it("should handle non-empty objects correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue({ key: "value" });

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ key: "value" });
    expect(result.current.isEmpty).toBe(false);
  });

  it("should handle primitive types correctly (not empty)", async () => {
    const testCases = ["string", 123, true, false, 0];

    for (const testData of testCases) {
      const queryFn = vi.fn().mockResolvedValue(testData);

      const { result } = renderHook(() => useApiQuery([`test-${testData}`], queryFn), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(testData);
      expect(result.current.isEmpty).toBe(false);
    }
  });

  it("should handle null/undefined data correctly", async () => {
    const queryFn = vi.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isEmpty).toBe(false); // null data should not be considered empty
  });

  it("should pass through React Query options", async () => {
    const queryFn = vi.fn().mockResolvedValue("test");

    const { result } = renderHook(() => useApiQuery(["test"], queryFn, { enabled: false }), { wrapper });

    // Should not be loading because enabled: false
    expect(result.current.isLoading).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it("should provide refetch function", async () => {
    const queryFn = vi.fn().mockResolvedValue("test");

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");

    // Test refetch
    queryFn.mockClear();
    result.current.refetch();

    expect(queryFn).toHaveBeenCalled();
  });

  it("should handle no error case", async () => {
    const queryFn = vi.fn().mockResolvedValue("test");

    const { result } = renderHook(() => useApiQuery(["test"], queryFn), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(mockTransformError).not.toHaveBeenCalled();
  });
});
