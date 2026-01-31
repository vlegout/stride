import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useActivityZones } from "../../src/hooks/useActivityZones";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  fetchActivityZones: vi.fn(),
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

const createMockZonesData = () => ({
  heartRate: [
    { zone: 1, time: 300, percentage: 33.3 },
    { zone: 2, time: 600, percentage: 66.7 },
  ],
  power: [
    { zone: 1, time: 400, percentage: 40 },
    { zone: 2, time: 600, percentage: 60 },
  ],
});

describe("useActivityZones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch activity zones for given activityId", async () => {
    const mockZones = createMockZonesData();
    vi.mocked(api.fetchActivityZones).mockResolvedValue(mockZones);

    const { result } = renderHook(() => useActivityZones("activity-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivityZones).toHaveBeenCalledWith("activity-123");
    expect(result.current.data).toEqual(mockZones);
  });

  it("should return loading state initially", () => {
    vi.mocked(api.fetchActivityZones).mockImplementation(
      () => new Promise(() => undefined), // Never resolves
    );

    const { result } = renderHook(() => useActivityZones("activity-123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle fetch error", async () => {
    const error = new Error("Failed to fetch zones");
    vi.mocked(api.fetchActivityZones).mockRejectedValue(error);

    const { result } = renderHook(() => useActivityZones("activity-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it("should use activityZones key with activityId", async () => {
    const mockZones = createMockZonesData();
    vi.mocked(api.fetchActivityZones).mockResolvedValue(mockZones);

    const { result } = renderHook(() => useActivityZones("zone-test-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivityZones).toHaveBeenCalledWith("zone-test-id");
  });
});
