import { apiClient } from "../client";
import type { GoogleAuthResponse, UserCreate } from "../../types";

export const authApi = {
  googleAuth: async (userData: UserCreate): Promise<GoogleAuthResponse> => {
    const response = await apiClient.post<GoogleAuthResponse>("/auth/google/", userData);
    return response.data;
  },
};
