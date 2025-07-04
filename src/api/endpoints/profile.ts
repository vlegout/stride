import { apiClient } from "../client";
import type { Profile } from "../../types";

export const profileApi = {
  get: async (): Promise<Profile> => {
    const response = await apiClient.get<Profile>("/profile/");
    return response.data;
  },
};
