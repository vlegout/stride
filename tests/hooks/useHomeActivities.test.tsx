import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHomeActivities } from "../../src/hooks/useHomeActivities";
import * as api from "../../src/api";
import { createMockActivitiesResponse } from "../mocks/apiMocks";

vi.mock("../../src/api", () => ({
  fetchActivities: vi.fn(),
  createActivitiesQueryKey: vi.fn((params) => ["activities", params]),
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

describe("useHomeActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch activities with home page params", async () => {
    const mockResponse = createMockActivitiesResponse();
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockResponse);
  });

  it("should use specific query params for home page", async () => {
    const mockResponse = createMockActivitiesResponse();
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.createActivitiesQueryKey).toHaveBeenCalledWith({
        sport: undefined,
        distance: [0, 100],
        fetchMap: true,
        limit: 5,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      });
    });
  });

  it("should return loading state initially", () => {
    vi.mocked(api.fetchActivities).mockImplementation(
      () => new Promise(() => undefined), // Never resolves
    );

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle fetch error", async () => {
    const error = new Error("Failed to fetch activities");
    vi.mocked(api.fetchActivities).mockRejectedValue(error);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
