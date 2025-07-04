import { type } from "arktype";

export interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponseBase {
  data: unknown;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export const PaginationParams = type({
  page: "number",
  limit: "number",
}).partial();
export type PaginationParams = typeof PaginationParams.infer;

export const QueryParams = type({
  order: "'asc'|'desc'",
  orderBy: "string",
})
  .and(PaginationParams)
  .partial();
export type QueryParams = typeof QueryParams.infer;

export interface UploadConfig {
  onUploadProgress?: (progressEvent: unknown) => void;
}
