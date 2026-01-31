import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useActivityData } from "../../src/hooks/useActivityData";
import * as api from "../../src/api";
import { createMockActivity } from "../mocks/apiMocks";

vi.mock("../../src/api", () => ({
  fetchActivity: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useActivityData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch activity data for given activityId", async () => {
    const mockActivity = createMockActivity();
    vi.mocked(api.fetchActivity).mockResolvedValue(mockActivity);

    const { result } = renderHook(() => useActivityData("activity-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivity).toHaveBeenCalledWith("activity-123");
    expect(result.current.data).toEqual(mockActivity);
  });

  it("should return loading state initially", () => {
    vi.mocked(api.fetchActivity).mockImplementation(
      () => new Promise(() => undefined), // Never resolves
    );

    const { result } = renderHook(() => useActivityData("activity-123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle fetch error", async () => {
    const error = new Error("Failed to fetch activity");
    vi.mocked(api.fetchActivity).mockRejectedValue(error);

    const { result } = renderHook(() => useActivityData("activity-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it("should use activityId in query key", async () => {
    const mockActivity1 = createMockActivity({ id: "1" });
    const mockActivity2 = createMockActivity({ id: "2" });

    vi.mocked(api.fetchActivity).mockResolvedValueOnce(mockActivity1).mockResolvedValueOnce(mockActivity2);

    const wrapper = createWrapper();

    const { result: result1 } = renderHook(() => useActivityData("1"), { wrapper });
    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    const { result: result2 } = renderHook(() => useActivityData("2"), { wrapper });
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    expect(api.fetchActivity).toHaveBeenCalledWith("1");
    expect(api.fetchActivity).toHaveBeenCalledWith("2");
  });
});
