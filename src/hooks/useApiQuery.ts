import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useErrorHandler } from "./useErrorHandler";
import type { ApiError } from "../api/types";

export interface ApiQueryResult<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  refetch: () => void;
}

export const useApiQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {},
): ApiQueryResult<T> => {
  const { transformError } = useErrorHandler({ logError: true });

  const { data, error, isLoading, isError, refetch } = useQuery({
    ...options,
    queryKey,
    queryFn,
  });

  const transformedError = error ? transformError(error) : null;

  const isEmpty =
    data != null &&
    (Array.isArray(data)
      ? data.length === 0
      : typeof data === "object" && data !== null
        ? Object.keys(data).length === 0
        : false);

  return {
    data,
    error: transformedError,
    isLoading,
    isError,
    isEmpty,
    refetch,
  };
};
