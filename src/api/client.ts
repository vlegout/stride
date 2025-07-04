import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "../store";
import { isTokenValid } from "../utils";
import type { ApiError } from "./types";

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export class ApiClient {
  private instance: AxiosInstance;
  private navigateCallback?: (path: string) => void;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  setNavigationCallback(navigate: (path: string) => void): void {
    this.navigateCallback = navigate;
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(this.transformError(error)),
    );

    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const transformedError = this.transformError(error);

        if (transformedError.status === 401) {
          const authStore = useAuthStore.getState();
          authStore.logout();
          if (this.navigateCallback) {
            this.navigateCallback("/login");
          } else {
            // Fallback to window.location if navigate callback is not set
            window.location.href = "/login";
          }
        }

        return Promise.reject(transformedError);
      },
    );
  }

  private getAuthToken(): string | null {
    const authStore = useAuthStore.getState();

    if (isTokenValid(authStore.token, authStore.tokenExpiry)) {
      return authStore.token;
    }

    return null;
  }

  private transformError(error: unknown): ApiError {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          data?: Record<string, unknown>;
          status?: number;
          statusText?: string;
        };
      };
      const errorData = axiosError.response?.data;
      const result: ApiError = {
        message:
          typeof errorData?.detail === "string"
            ? errorData.detail
            : typeof errorData?.message === "string"
              ? errorData.message
              : axiosError.response?.statusText || "An error occurred",
      };

      if (axiosError.response?.status !== undefined) {
        result.status = axiosError.response.status;
      }

      if (typeof errorData?.code === "string") {
        result.code = errorData.code;
      }

      if (errorData !== undefined) {
        result.details = errorData;
      }

      return result;
    } else if (error && typeof error === "object" && "request" in error) {
      return {
        message: "Network error - please check your connection",
        code: "NETWORK_ERROR",
      };
    } else if (error instanceof Error) {
      return {
        message: error.message || "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      };
    } else {
      return {
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<T>(url, config);
    return this.transformResponse(response);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, data, config);
    return this.transformResponse(response);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<T>(url, data, config);
    return this.transformResponse(response);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<T>(url, config);
    return this.transformResponse(response);
  }

  private transformResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || "");
