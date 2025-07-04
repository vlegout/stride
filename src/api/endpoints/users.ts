import { apiClient } from "../client";
import type { User } from "../../types";

export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/users/me/");
    return response.data;
  },
};
