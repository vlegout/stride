import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/index";

/**
 * Hook to set up navigation callback for the API client.
 * This enables proper SPA navigation on authentication failures.
 */
export const useApiNavigation = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.setNavigationCallback(navigate);

    // Cleanup function to remove the callback when component unmounts
    return () => {
      apiClient.setNavigationCallback(() => {
        // Fallback behavior if no component is providing navigation
        window.location.href = "/login";
      });
    };
  }, [navigate]);
};
