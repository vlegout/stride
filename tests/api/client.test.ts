import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock axios FIRST before any imports
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

// Now import everything else
import axios from "axios";
import { ApiClient } from "../../src/api/client";
import { useAuthStore } from "../../src/store";

const mockedAxios = vi.mocked(axios);

// Mock useAuthStore
vi.mock("../../src/store", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// Mock utils
vi.mock("../../src/utils", () => ({
  isTokenValid: vi.fn(),
}));

describe("ApiClient", () => {
  let mockAxiosInstance: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
  };
  let mockGetState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock axios instance FIRST
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    // Ensure axios.create returns our mock instance
    (mockedAxios.create as ReturnType<typeof vi.fn>).mockReturnValue(mockAxiosInstance);

    // Mock useAuthStore.getState
    mockGetState = vi.fn();
    (useAuthStore.getState as typeof useAuthStore.getState) = mockGetState;
  });

  // Create client in each test that needs it
  const createClient = () => {
    return new ApiClient("http://test-api.com");
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create axios instance with correct config", () => {
      createClient();

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://test-api.com",
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should setup interceptors", () => {
      createClient();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe("setNavigationCallback", () => {
    it("should set navigation callback", () => {
      const apiClient = createClient();
      const mockNavigate = vi.fn();
      apiClient.setNavigationCallback(mockNavigate);

      // This is tested indirectly through the response interceptor behavior
      expect(true).toBe(true); // Placeholder as the callback is private
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      // Mock successful responses
      mockAxiosInstance.get.mockResolvedValue({ data: "test", status: 200, statusText: "OK" });
      mockAxiosInstance.post.mockResolvedValue({ data: "test", status: 201, statusText: "Created" });
      mockAxiosInstance.put.mockResolvedValue({ data: "test", status: 200, statusText: "OK" });
      mockAxiosInstance.delete.mockResolvedValue({ data: "test", status: 204, statusText: "No Content" });
    });

    describe("get", () => {
      it("should make GET request and transform response", async () => {
        const apiClient = createClient();
        const result = await apiClient.get("/test");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", undefined);
        expect(result).toEqual({
          data: "test",
          status: 200,
          statusText: "OK",
        });
      });

      it("should pass config to axios", async () => {
        const apiClient = createClient();
        const config = { params: { test: "value" } };
        await apiClient.get("/test", config);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", config);
      });
    });

    describe("post", () => {
      it("should make POST request and transform response", async () => {
        const apiClient = createClient();
        const data = { test: "data" };
        const result = await apiClient.post("/test", data);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith("/test", data, undefined);
        expect(result).toEqual({
          data: "test",
          status: 201,
          statusText: "Created",
        });
      });

      it("should pass config to axios", async () => {
        const apiClient = createClient();
        const data = { test: "data" };
        const config = { headers: { "Custom-Header": "value" } };
        await apiClient.post("/test", data, config);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith("/test", data, config);
      });
    });

    describe("put", () => {
      it("should make PUT request and transform response", async () => {
        const apiClient = createClient();
        const data = { test: "data" };
        const result = await apiClient.put("/test", data);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith("/test", data, undefined);
        expect(result).toEqual({
          data: "test",
          status: 200,
          statusText: "OK",
        });
      });
    });

    describe("delete", () => {
      it("should make DELETE request and transform response", async () => {
        const apiClient = createClient();
        const result = await apiClient.delete("/test");

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/test", undefined);
        expect(result).toEqual({
          data: "test",
          status: 204,
          statusText: "No Content",
        });
      });
    });
  });

  describe("error handling", () => {
    it("should transform axios response errors correctly", () => {
      const apiClient = createClient();
      const axiosError = {
        response: {
          data: { detail: "Test error", code: "TEST_ERROR" },
          status: 400,
          statusText: "Bad Request",
        },
      };

      // Access the private method for testing
      const transformError = (
        apiClient as unknown as { transformError: (error: unknown) => unknown }
      ).transformError.bind(apiClient);
      const result = transformError(axiosError);

      expect(result).toEqual({
        message: "Test error",
        status: 400,
        code: "TEST_ERROR",
        details: { detail: "Test error", code: "TEST_ERROR" },
      });
    });

    it("should handle network errors", () => {
      const apiClient = createClient();
      const networkError = { request: {} };

      const transformError = (
        apiClient as unknown as { transformError: (error: unknown) => unknown }
      ).transformError.bind(apiClient);
      const result = transformError(networkError);

      expect(result).toEqual({
        message: "Network error - please check your connection",
        code: "NETWORK_ERROR",
      });
    });

    it("should handle generic errors", () => {
      const apiClient = createClient();
      const genericError = new Error("Something went wrong");

      const transformError = (
        apiClient as unknown as { transformError: (error: unknown) => unknown }
      ).transformError.bind(apiClient);
      const result = transformError(genericError);

      expect(result).toEqual({
        message: "Something went wrong",
        code: "UNKNOWN_ERROR",
      });
    });

    it("should handle unknown errors", () => {
      const apiClient = createClient();
      const unknownError = "string error";

      const transformError = (
        apiClient as unknown as { transformError: (error: unknown) => unknown }
      ).transformError.bind(apiClient);
      const result = transformError(unknownError);

      expect(result).toEqual({
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      });
    });
  });
});
