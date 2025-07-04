export { apiClient } from "./client";
export type { ApiResponse } from "./client";
export type { ApiError, RequestConfig, QueryParams, PaginationParams, UploadConfig } from "./types";

export { activitiesApi } from "./endpoints/activities";
export { authApi } from "./endpoints/auth";
export { usersApi } from "./endpoints/users";
export { profileApi } from "./endpoints/profile";
export { fitnessApi } from "./endpoints/fitness";

import type { ActivitiesQueryParams } from "../types";

export function createActivitiesQueryKey(params: ActivitiesQueryParams): [string, ActivitiesQueryParams] {
  return ["activities", params];
}
