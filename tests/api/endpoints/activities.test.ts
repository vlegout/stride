import { describe, it, expect, vi, beforeEach } from "vitest";
import { activitiesApi } from "../../../src/api/endpoints/activities";
import type { ActivitiesQueryParams, ActivitiesResponse, Activity } from "../../../src/types";

// Mock the API client
vi.mock("../../../src/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Get references to the mocked functions
const { apiClient } = await import("../../../src/api/client");
const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe("activitiesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    const mockActivitiesResponse: ActivitiesResponse = {
      activities: [
        {
          id: "activity-1",
          title: "Morning Run",
          sport: "running",
          start_time: 1640995200,
          total_distance: 5000,
          avg_speed: 12.5,
        } as Activity,
      ],
      pagination: {
        page: 1,
        per_page: 10,
        total: 1,
      },
    };

    beforeEach(() => {
      mockGet.mockResolvedValue({
        data: mockActivitiesResponse,
        status: 200,
        statusText: "OK",
      });
    });

    it("should build URL with default parameters only", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      const result = await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?page=1&limit=10&order=desc");
      expect(result).toEqual(mockActivitiesResponse);
    });

    it("should build URL with sport parameter", async () => {
      const params: ActivitiesQueryParams = {
        sport: "running",
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?sport=running&page=1&limit=10&order=desc");
    });

    it("should build URL with map parameter", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100],
        fetchMap: true,
        limit: 10,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?map=true&page=1&limit=10&order=desc");
    });

    it("should build URL with race parameter", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: true,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?race=true&page=1&limit=10&order=desc");
    });

    it("should build URL with page and limit parameters", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 20,
        race: false,
        page: 2,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?page=2&limit=20&order=desc");
    });

    it("should build URL with distance parameters", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [5, 50],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?page=1&limit=10&min_distance=5&max_distance=50&order=desc");
    });

    it("should ignore default distance values", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100], // Default values should be ignored
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "desc",
        orderBy: "",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?page=1&limit=10&order=desc");
    });

    it("should build URL with order parameters", async () => {
      const params: ActivitiesQueryParams = {
        sport: undefined,
        distance: [0, 100],
        fetchMap: false,
        limit: 10,
        race: false,
        page: 1,
        order: "asc",
        orderBy: "start_time",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith("/activities/?page=1&limit=10&order=asc&order_by=start_time");
    });

    it("should build URL with all parameters", async () => {
      const params: ActivitiesQueryParams = {
        sport: "cycling",
        distance: [10, 80],
        fetchMap: true,
        limit: 15,
        race: true,
        page: 3,
        order: "asc",
        orderBy: "total_distance",
      };

      await activitiesApi.getAll(params);

      expect(mockGet).toHaveBeenCalledWith(
        "/activities/?map=true&race=true&sport=cycling&page=3&limit=15&min_distance=10&max_distance=80&order=asc&order_by=total_distance",
      );
    });
  });

  describe("getById", () => {
    const mockActivity: Activity = {
      id: "activity-123",
      title: "Test Activity",
      sport: "running",
      start_time: 1640995200,
      total_distance: 5000,
      avg_speed: 12.5,
    } as Activity;

    beforeEach(() => {
      mockGet.mockResolvedValue({
        data: mockActivity,
        status: 200,
        statusText: "OK",
      });
    });

    it("should fetch activity by ID", async () => {
      const result = await activitiesApi.getById("activity-123");

      expect(mockGet).toHaveBeenCalledWith("/activities/activity-123/");
      expect(result).toEqual(mockActivity);
    });

    it("should handle different activity IDs", async () => {
      await activitiesApi.getById("different-id");

      expect(mockGet).toHaveBeenCalledWith("/activities/different-id/");
    });
  });

  describe("getLast", () => {
    const mockActivitiesResponse: ActivitiesResponse = {
      activities: [{ id: "1", title: "Activity 1" } as Activity, { id: "2", title: "Activity 2" } as Activity],
      pagination: {
        page: 1,
        per_page: 10,
        total: 2,
      },
    };

    beforeEach(() => {
      mockGet.mockResolvedValue({
        data: mockActivitiesResponse,
        status: 200,
        statusText: "OK",
      });
    });

    it("should fetch last activities and return only activities array", async () => {
      const result = await activitiesApi.getLast();

      expect(mockGet).toHaveBeenCalledWith("/activities/");
      expect(result).toEqual(mockActivitiesResponse.activities);
    });
  });

  describe("upload", () => {
    const mockActivity: Activity = {
      id: "new-activity",
      title: "Uploaded Activity",
      sport: "running",
    } as Activity;

    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: mockActivity,
        status: 201,
        statusText: "Created",
      });
    });

    it("should upload activity with correct FormData", async () => {
      const file = new File(["fit data"], "activity.fit", { type: "application/octet-stream" });
      const title = "Morning Run";
      const race = true;

      const result = await activitiesApi.upload(file, title, race);

      expect(mockPost).toHaveBeenCalledWith("/activities/", expect.any(FormData));
      expect(result).toEqual(mockActivity);

      // Verify FormData contents
      const [, formData] = mockPost.mock.calls[0];
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("fit_file")).toBe(file);
      expect((formData as FormData).get("title")).toBe(title);
      expect((formData as FormData).get("race")).toBe("true");
    });

    it("should handle false race parameter", async () => {
      const file = new File(["fit data"], "activity.fit");
      const title = "Easy Run";
      const race = false;

      await activitiesApi.upload(file, title, race);

      const [, formData] = mockPost.mock.calls[0];
      expect((formData as FormData).get("race")).toBe("false");
    });

    it("should handle empty title", async () => {
      const file = new File(["fit data"], "activity.fit");
      const title = "";
      const race = false;

      await activitiesApi.upload(file, title, race);

      const [, formData] = mockPost.mock.calls[0];
      expect((formData as FormData).get("title")).toBe("");
    });

    it("should handle different file types", async () => {
      const file = new File(["gpx data"], "activity.gpx", { type: "application/gpx+xml" });
      const title = "Bike Ride";
      const race = false;

      await activitiesApi.upload(file, title, race);

      const [, formData] = mockPost.mock.calls[0];
      expect((formData as FormData).get("fit_file")).toBe(file);
      expect(file.name).toBe("activity.gpx");
      expect(file.type).toBe("application/gpx+xml");
    });
  });
});
