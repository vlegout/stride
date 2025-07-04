import { apiClient } from "../client";
import type { FitnessResponse, WeeksResponse } from "../../types";

export const fitnessApi = {
  get: async (): Promise<FitnessResponse> => {
    const response = await apiClient.get<FitnessResponse>("/fitness/");
    return response.data;
  },

  getWeeks: async (): Promise<WeeksResponse> => {
    const response = await apiClient.get<WeeksResponse>("/weeks/");
    return response.data;
  },
};
