import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHomeActivities } from "../../src/hooks/useHomeActivities";
import { useAuthStore } from "../../src/store";
import * as api from "../../src/api";
import { createMockActivity, createMockActivitiesResponse, createMockUser } from "../mocks/apiMocks";

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
    useAuthStore.setState({ user: null });
  });

  it("should fetch activities with home page params", async () => {
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith({
      queryKey: [
        "activities",
        {
          sport: undefined,
          distance: [0, 100],
          fetchMap: true,
          limit: 5,
          race: false,
          page: 1,
          order: "desc",
          orderBy: "",
        },
      ],
    });
  });

  it("should return loading state initially", () => {
    vi.mocked(api.fetchActivities).mockImplementation(() => new Promise(() => undefined));

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

  it("should have next page when more activities exist", async () => {
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 10);
    mockResponse.pagination.per_page = 5;
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });

  it("should not have next page when all activities loaded", async () => {
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 3);
    mockResponse.pagination.per_page = 5;
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it("should fetch next page with incremented page param", async () => {
    const firstPage = createMockActivitiesResponse([createMockActivity()], 1, 10);
    firstPage.pagination.per_page = 5;
    const secondPage = createMockActivitiesResponse([createMockActivity({ id: "second-page-activity" })], 2, 10);
    secondPage.pagination.per_page = 5;

    vi.mocked(api.fetchActivities).mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    expect(api.fetchActivities).toHaveBeenLastCalledWith({
      queryKey: [
        "activities",
        {
          sport: undefined,
          distance: [0, 100],
          fetchMap: true,
          limit: 5,
          race: false,
          page: 2,
          order: "desc",
          orderBy: "",
        },
      ],
    });
  });

  it("should not filter by sport when all sports are enabled", async () => {
    useAuthStore.setState({ user: createMockUser() });
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["activities", expect.objectContaining({ sport: undefined })]),
      }),
    );
  });

  it("should filter by single enabled sport", async () => {
    useAuthStore.setState({
      user: { ...createMockUser(), running_enabled: true, cycling_enabled: false, swimming_enabled: false },
    });
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["activities", expect.objectContaining({ sport: "running" })]),
      }),
    );
  });

  it("should filter by multiple enabled sports", async () => {
    useAuthStore.setState({
      user: { ...createMockUser(), running_enabled: true, cycling_enabled: true, swimming_enabled: false },
    });
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["activities", expect.objectContaining({ sport: "running,cycling" })]),
      }),
    );
  });

  it("should not filter by sport when user is null", async () => {
    useAuthStore.setState({ user: null });
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["activities", expect.objectContaining({ sport: undefined })]),
      }),
    );
  });

  it("should not filter when no sports are enabled", async () => {
    useAuthStore.setState({
      user: { ...createMockUser(), running_enabled: false, cycling_enabled: false, swimming_enabled: false },
    });
    const mockResponse = createMockActivitiesResponse([createMockActivity()], 1, 1);
    vi.mocked(api.fetchActivities).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useHomeActivities(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(["activities", expect.objectContaining({ sport: undefined })]),
      }),
    );
  });
});
