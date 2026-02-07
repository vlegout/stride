import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import * as api from "../src/api";
import { useAuthStore } from "../src/store";
import {
  createMockActivity,
  createMockActivitiesResponse,
  createMockProfile,
  createMockUser,
  createMockWeeksResponse,
  createMockFitnessResponse,
  createMockBestPerformanceResponse,
  createMockGoogleAuthResponse,
  createMockActivityZonesResponse,
} from "./mocks/apiMocks";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Mock the auth store
vi.mock("../src/store", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// Mock import.meta.env before importing api module
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_URL: "",
  },
  writable: true,
});

describe("API", () => {
  const mockToken = "mock-jwt-token";
  const mockTokenExpiry = Date.now() + 3600 * 1000; // 1 hour from now

  const createDefaultQueryParams = (
    overrides?: Partial<{
      sport: "running" | "cycling" | "swimming" | undefined;
      distance: number[];
      fetchMap: boolean;
      limit: number;
      race: boolean;
      page: number;
      order: "asc" | "desc";
      orderBy: string;
    }>,
  ) => ({
    sport: undefined as "running" | "cycling" | "swimming" | undefined,
    distance: [0, 100],
    fetchMap: false,
    limit: 20,
    race: false,
    page: 1,
    order: "desc" as const,
    orderBy: "",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid auth token
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: createMockUser(),
      token: mockToken,
      tokenExpiry: mockTokenExpiry,
      logout: vi.fn(),
      setUser: vi.fn(),
      setToken: vi.fn(),
      setAuth: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("createActivitiesQueryKey", () => {
    it("should create query key with params", () => {
      const params = createDefaultQueryParams({ sport: "cycling" });
      const result = api.createActivitiesQueryKey(params);
      expect(result).toEqual(["activities", params]);
    });
  });

  describe("apiCall", () => {
    it("should make GET request with auth token", async () => {
      const mockData = { id: "1", name: "Test" };
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await api.apiCall("/test");

      expect(mockedAxios.get).toHaveBeenCalledWith("/test", {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result).toEqual(mockData);
    });

    it("should throw error when no valid token", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      await expect(api.apiCall("/test")).rejects.toThrow("No valid authentication token available");
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it("should throw error when token is expired", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: createMockUser(),
        token: mockToken,
        tokenExpiry: Date.now() - 1000, // Expired
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      await expect(api.apiCall("/test")).rejects.toThrow("No valid authentication token available");
    });

    it("should propagate axios errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      await expect(api.apiCall("/test")).rejects.toThrow("Network error");
    });
  });

  describe("fetchActivities", () => {
    it("should fetch activities with no params", async () => {
      const mockResponse = createMockActivitiesResponse([], 1, 0);
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await api.fetchActivities({
        queryKey: ["activities", createDefaultQueryParams()],
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/activities/?page=1&limit=20&order=desc",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should build query string with all params", async () => {
      const mockResponse = createMockActivitiesResponse([], 2, 0);
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await api.fetchActivities({
        queryKey: [
          "activities",
          {
            sport: "running" as const,
            distance: [5, 50] as [number, number],
            race: true,
            fetchMap: true,
            limit: 10,
            page: 2,
            order: "asc" as const,
            orderBy: "distance",
          },
        ],
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("map=true"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("race=true"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("sport=running"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("page=2"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("limit=10"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("min_distance=5"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("max_distance=50"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("order=asc"), expect.any(Object));
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("order_by=distance"), expect.any(Object));
    });

    it("should skip default distance values (0 and 100)", async () => {
      const mockResponse = createMockActivitiesResponse([], 1, 0);
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      await api.fetchActivities({
        queryKey: ["activities", createDefaultQueryParams({ distance: [0, 100] })],
      });

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).not.toContain("min_distance");
      expect(calledUrl).not.toContain("max_distance");
    });

    it("should throw validation error for invalid response", async () => {
      const invalidResponse = { invalid: "data" };
      mockedAxios.get.mockResolvedValue({ data: invalidResponse });

      await expect(
        api.fetchActivities({
          queryKey: ["activities", createDefaultQueryParams()],
        }),
      ).rejects.toThrow("Invalid API response");
    });
  });

  describe("fetchLastActivities", () => {
    it("should fetch last activities", async () => {
      const mockActivities = [createMockActivity()];
      mockedAxios.get.mockResolvedValue({ data: mockActivities });

      const result = await api.fetchLastActivities();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/activities/",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockActivities);
    });
  });

  describe("fetchActivity", () => {
    it("should fetch single activity by id", async () => {
      const mockActivity = createMockActivity();
      mockedAxios.get.mockResolvedValue({ data: mockActivity });

      const result = await api.fetchActivity("activity-123");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/activities/activity-123/",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockActivity);
    });
  });

  describe("fetchActivityZones", () => {
    it("should fetch and transform activity zones", async () => {
      const mockZonesResponse = createMockActivityZonesResponse();
      mockedAxios.get.mockResolvedValue({ data: mockZonesResponse });

      const result = await api.fetchActivityZones("activity-123");

      expect(result.heartRate).toBeDefined();
      expect(result.heartRate).toHaveLength(2);
      expect(result.heartRate?.[0]).toEqual({ zone: 1, time: 300, percentage: (300 / 900) * 100 });
      expect(result.heartRate?.[1]).toEqual({ zone: 2, time: 600, percentage: (600 / 900) * 100 });
      expect(result.power).toBeDefined();
      expect(result.power).toHaveLength(1);
      expect(result.power?.[0]).toEqual({ zone: 1, time: 400, percentage: 100 });
    });

    it("should handle empty zones", async () => {
      const mockZonesResponse = {
        heart_rate: [],
        power: [],
        pace: [],
      };
      mockedAxios.get.mockResolvedValue({ data: mockZonesResponse });

      const result = await api.fetchActivityZones("activity-123");

      expect(result).toEqual({});
    });

    it("should handle partial zones data", async () => {
      const mockZonesResponse = {
        heart_rate: [
          {
            id: "zone-1",
            activity_id: "activity-123",
            zone_id: "zone-1",
            time_in_zone: 1000,
            zone: {
              id: "zone-1",
              user_id: "user-1",
              index: 1,
              type: "heart_rate",
              max_value: 140,
            },
          },
        ],
        power: [],
      };
      mockedAxios.get.mockResolvedValue({ data: mockZonesResponse });

      const result = await api.fetchActivityZones("activity-123");

      expect(result).toEqual({
        heartRate: [{ zone: 1, time: 1000, percentage: 100 }],
      });
      expect(result.power).toBeUndefined();
      expect(result.pace).toBeUndefined();
    });

    it("should handle zero total time gracefully", async () => {
      const mockZonesResponse = {
        heart_rate: [
          {
            id: "zone-1",
            activity_id: "activity-123",
            zone_id: "zone-1",
            time_in_zone: 0,
            zone: {
              id: "zone-1",
              user_id: "user-1",
              index: 1,
              type: "heart_rate",
              max_value: 140,
            },
          },
          {
            id: "zone-2",
            activity_id: "activity-123",
            zone_id: "zone-2",
            time_in_zone: 0,
            zone: {
              id: "zone-2",
              user_id: "user-1",
              index: 2,
              type: "heart_rate",
              max_value: 160,
            },
          },
        ],
      };
      mockedAxios.get.mockResolvedValue({ data: mockZonesResponse });

      const result = await api.fetchActivityZones("activity-123");

      expect(result.heartRate).toEqual([
        { zone: 1, time: 0, percentage: 0 },
        { zone: 2, time: 0, percentage: 0 },
      ]);
    });

    it("should handle pace zones data", async () => {
      const mockZonesResponse = {
        pace: [
          {
            id: "zone-1",
            activity_id: "activity-123",
            zone_id: "zone-1",
            time_in_zone: 600,
            zone: {
              id: "zone-1",
              user_id: "user-1",
              index: 1,
              type: "pace",
              max_value: 5.5,
            },
          },
          {
            id: "zone-2",
            activity_id: "activity-123",
            zone_id: "zone-2",
            time_in_zone: 400,
            zone: {
              id: "zone-2",
              user_id: "user-1",
              index: 2,
              type: "pace",
              max_value: 4.5,
            },
          },
        ],
      };
      mockedAxios.get.mockResolvedValue({ data: mockZonesResponse });

      const result = await api.fetchActivityZones("activity-123");

      expect(result.pace).toBeDefined();
      expect(result.pace).toHaveLength(2);
      expect(result.pace?.[0]).toEqual({ zone: 1, time: 600, percentage: 60 });
      expect(result.pace?.[1]).toEqual({ zone: 2, time: 400, percentage: 40 });
    });
  });

  describe("fetchProfile", () => {
    it("should fetch user profile", async () => {
      const mockProfile = createMockProfile();
      mockedAxios.get.mockResolvedValue({ data: mockProfile });

      const result = await api.fetchProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/profile/",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe("fetchWeeks", () => {
    it("should fetch weekly data with default pagination", async () => {
      const mockWeeks = createMockWeeksResponse();
      mockedAxios.get.mockResolvedValue({ data: mockWeeks });

      const result = await api.fetchWeeks();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/weeks/?offset=0&limit=5",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockWeeks);
    });

    it("should fetch weekly data with custom pagination", async () => {
      const mockWeeks = createMockWeeksResponse();
      mockedAxios.get.mockResolvedValue({ data: mockWeeks });

      const result = await api.fetchWeeks(5, 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/weeks/?offset=5&limit=10",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockWeeks);
    });
  });

  describe("fetchFitness", () => {
    it("should fetch fitness data", async () => {
      const mockFitness = createMockFitnessResponse();
      mockedAxios.get.mockResolvedValue({ data: mockFitness });

      const result = await api.fetchFitness();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/fitness/",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockFitness);
    });
  });

  describe("fetchBestPerformances", () => {
    it("should fetch best performances with sport only", async () => {
      const mockPerformances = createMockBestPerformanceResponse();
      mockedAxios.get.mockResolvedValue({ data: mockPerformances });

      await api.fetchBestPerformances("running");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/best/?sport=running",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });

    it("should fetch best performances with all params", async () => {
      const mockPerformances = createMockBestPerformanceResponse();
      mockedAxios.get.mockResolvedValue({ data: mockPerformances });

      await api.fetchBestPerformances("cycling", "10", "3600", 2024);

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain("sport=cycling");
      expect(calledUrl).toContain("distance=10");
      expect(calledUrl).toContain("time=3600");
      expect(calledUrl).toContain("year=2024");
    });

    it("should fetch best performances with optional params", async () => {
      const mockPerformances = createMockBestPerformanceResponse();
      mockedAxios.get.mockResolvedValue({ data: mockPerformances });

      await api.fetchBestPerformances("running", "5", undefined, 2023);

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain("sport=running");
      expect(calledUrl).toContain("distance=5");
      expect(calledUrl).toContain("year=2023");
      expect(calledUrl).not.toContain("time=");
    });
  });

  describe("uploadActivity", () => {
    it("should upload activity with file and metadata", async () => {
      const mockFile = new File(["fit data"], "activity.fit", { type: "application/octet-stream" });
      const mockActivity = createMockActivity({ title: "New Activity", sport: "cycling" });
      mockedAxios.post.mockResolvedValue({ data: mockActivity });

      const result = await api.uploadActivity(mockFile, "New Activity", true);

      expect(mockedAxios.post).toHaveBeenCalledWith("/activities/", expect.any(FormData), {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const formData = mockedAxios.post.mock.calls[0][1] as FormData;
      expect(formData.get("fit_file")).toBe(mockFile);
      expect(formData.get("title")).toBe("New Activity");
      expect(formData.get("race")).toBe("true");

      expect(result).toEqual(mockActivity);
    });

    it("should throw error when no valid token for upload", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      const mockFile = new File(["fit data"], "activity.fit", { type: "application/octet-stream" });

      await expect(api.uploadActivity(mockFile, "Test", false)).rejects.toThrow(
        "No valid authentication token available",
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe("updateActivity", () => {
    it("should update activity", async () => {
      const mockActivity = createMockActivity({ title: "Updated Title" });
      mockedAxios.patch.mockResolvedValue({ data: mockActivity });

      const updates = { title: "Updated Title", race: true };
      const result = await api.updateActivity("activity-123", updates);

      expect(mockedAxios.patch).toHaveBeenCalledWith("/activities/activity-123/", updates, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockActivity);
    });

    it("should throw error when no valid token for update", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      await expect(api.updateActivity("activity-123", { title: "New Title" })).rejects.toThrow(
        "No valid authentication token available",
      );
      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });
  });

  describe("deleteActivity", () => {
    it("should delete activity", async () => {
      mockedAxios.delete.mockResolvedValue({ data: null });

      await api.deleteActivity("activity-123");

      expect(mockedAxios.delete).toHaveBeenCalledWith("/activities/activity-123/", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it("should throw error when no valid token for delete", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      await expect(api.deleteActivity("activity-123")).rejects.toThrow("No valid authentication token available");
      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });
  });

  describe("fetchCurrentUser", () => {
    it("should fetch current user", async () => {
      const mockUser = createMockUser();
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await api.fetchCurrentUser();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/users/me/",
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("updateUser", () => {
    it("should update user", async () => {
      const mockUser = createMockUser();
      mockedAxios.patch.mockResolvedValue({ data: mockUser });

      const updates = { map: "mapbox" as const };
      const result = await api.updateUser(updates);

      expect(mockedAxios.patch).toHaveBeenCalledWith("/users/me/", updates, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw error when no valid token for user update", async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      await expect(api.updateUser({ map: "mapbox" })).rejects.toThrow("No valid authentication token available");
      expect(mockedAxios.patch).not.toHaveBeenCalled();
    });
  });

  describe("authenticateWithGoogle", () => {
    it("should authenticate with Google", async () => {
      const mockUserData = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        google_id: "google-123",
      };
      const mockResponse = createMockGoogleAuthResponse();
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await api.authenticateWithGoogle(mockUserData);

      expect(mockedAxios.post).toHaveBeenCalledWith("/auth/google/", mockUserData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should not require auth token for Google auth", async () => {
      // Set no auth token
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        token: null,
        tokenExpiry: null,
        logout: vi.fn(),
        setUser: vi.fn(),
        setToken: vi.fn(),
        setAuth: vi.fn(),
      });

      const mockUserData = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        google_id: "google-123",
      };
      const mockResponse = createMockGoogleAuthResponse();
      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await api.authenticateWithGoogle(mockUserData);

      expect(result).toEqual(mockResponse);
      // Should not include Authorization header
      expect(mockedAxios.post).toHaveBeenCalledWith("/auth/google/", mockUserData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });
});
