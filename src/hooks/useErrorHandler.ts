import { useCallback } from "react";
import type { ApiError } from "../api/types";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: ApiError) => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { showToast = true, logError = true, onError } = options;

  const handleError = useCallback(
    (error: ApiError | Error) => {
      const apiError: ApiError =
        error instanceof Error
          ? {
              message: error.message,
              details: {
                name: error.name,
                stack: error.stack,
                originalError: error,
              },
            }
          : error;

      if (logError) {
        console.error("API Error:", apiError);
      }

      if (onError) {
        onError(apiError);
      }

      if (showToast) {
        console.warn("Toast notification not implemented yet:", apiError.message);
      }

      return apiError;
    },
    [showToast, logError, onError],
  );

  const transformError = useCallback((error: unknown): ApiError => {
    if (!error) {
      return { message: "An unknown error occurred" };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        details: {
          name: error.name,
          stack: error.stack,
          originalError: error,
        },
      };
    }

    if (typeof error === "object" && error !== null) {
      const errorObj = error as Record<string, unknown>;
      const result: ApiError = {
        message:
          typeof errorObj.message === "string"
            ? errorObj.message
            : typeof errorObj.detail === "string"
              ? errorObj.detail
              : "An error occurred",
      };

      if (typeof errorObj.status === "number") {
        result.status = errorObj.status;
      }

      if (typeof errorObj.code === "string") {
        result.code = errorObj.code;
      }

      if (errorObj.details !== undefined) {
        result.details = errorObj.details;
      }

      return result;
    }

    return { message: "An unknown error occurred" };
  }, []);

  return { handleError, transformError };
};
