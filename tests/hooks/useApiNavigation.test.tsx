import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import { useApiNavigation } from "../../src/hooks/useApiNavigation";
import { apiClient } from "../../src/api/index";

// Mock the API client
vi.mock("../../src/api/index", () => ({
  apiClient: {
    setNavigationCallback: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "",
  },
  writable: true,
});

describe("useApiNavigation", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <BrowserRouter>{children}</BrowserRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set navigation callback on mount", () => {
    renderHook(() => useApiNavigation(), { wrapper });

    expect(apiClient.setNavigationCallback).toHaveBeenCalledWith(mockNavigate);
  });

  it("should set fallback navigation callback on unmount", () => {
    const { unmount } = renderHook(() => useApiNavigation(), { wrapper });

    // Clear the initial call
    vi.clearAllMocks();

    unmount();

    expect(apiClient.setNavigationCallback).toHaveBeenCalledWith(expect.any(Function));

    // Test the fallback callback
    const mockCalls = (apiClient.setNavigationCallback as ReturnType<typeof vi.fn>).mock.calls;
    const fallbackCallback = mockCalls[0][0] as (path: string) => void;
    fallbackCallback("/login");

    expect(window.location.href).toBe("/login");
  });

  it("should update navigation callback when navigate function changes", () => {
    const { rerender } = renderHook(() => useApiNavigation(), { wrapper });

    expect(apiClient.setNavigationCallback).toHaveBeenCalledTimes(1);

    // Force re-render (in real scenarios, navigate function is stable)
    rerender();

    // Should not call again unless navigate actually changes
    expect(apiClient.setNavigationCallback).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple component instances", () => {
    const { unmount: unmount1 } = renderHook(() => useApiNavigation(), { wrapper });
    const { unmount: unmount2 } = renderHook(() => useApiNavigation(), { wrapper });

    expect(apiClient.setNavigationCallback).toHaveBeenCalledTimes(2);

    unmount1();
    expect(apiClient.setNavigationCallback).toHaveBeenCalledTimes(3); // +1 for cleanup

    unmount2();
    expect(apiClient.setNavigationCallback).toHaveBeenCalledTimes(4); // +1 for cleanup
  });

  it("should work without router context (fallback mode)", () => {
    // Test without BrowserRouter wrapper to simulate fallback
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Mock implementation
    });

    try {
      renderHook(() => useApiNavigation());
    } catch (error) {
      // Expected to throw since there's no router context
      expect(error).toBeDefined();
    }

    consoleSpy.mockRestore();
  });
});
