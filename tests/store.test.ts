import { describe, it, expect, beforeEach, vi } from "vitest";
import { useActivitiesStore, useAuthStore } from "../src/store";
import type { User, Token } from "../src/types";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      const { [key]: _removed, ...rest } = store;
      void _removed;
      store = rest;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
});

describe("useActivitiesStore", () => {
  beforeEach(() => {
    useActivitiesStore.setState({
      sport: undefined,
      distance: [0, 100],
      race: false,
      page: 1,
      order: "desc",
      orderBy: "",
    });
  });

  describe("initial state", () => {
    it("has undefined sport by default", () => {
      expect(useActivitiesStore.getState().sport).toBeUndefined();
    });

    it("has default distance range of [0, 100]", () => {
      expect(useActivitiesStore.getState().distance).toEqual([0, 100]);
    });

    it("has race set to false by default", () => {
      expect(useActivitiesStore.getState().race).toBe(false);
    });

    it("has page set to 1 by default", () => {
      expect(useActivitiesStore.getState().page).toBe(1);
    });

    it("has order set to desc by default", () => {
      expect(useActivitiesStore.getState().order).toBe("desc");
    });

    it("has orderBy set to empty string by default", () => {
      expect(useActivitiesStore.getState().orderBy).toBe("");
    });
  });

  describe("setSport", () => {
    it("updates sport to running", () => {
      useActivitiesStore.getState().setSport("running");
      expect(useActivitiesStore.getState().sport).toBe("running");
    });

    it("updates sport to cycling", () => {
      useActivitiesStore.getState().setSport("cycling");
      expect(useActivitiesStore.getState().sport).toBe("cycling");
    });

    it("updates sport to swimming", () => {
      useActivitiesStore.getState().setSport("swimming");
      expect(useActivitiesStore.getState().sport).toBe("swimming");
    });

    it("updates sport to undefined", () => {
      useActivitiesStore.getState().setSport("running");
      useActivitiesStore.getState().setSport(undefined);
      expect(useActivitiesStore.getState().sport).toBeUndefined();
    });

    it("resets page to 1 when sport changes", () => {
      useActivitiesStore.getState().setPage(5);
      useActivitiesStore.getState().setSport("running");
      expect(useActivitiesStore.getState().page).toBe(1);
    });
  });

  describe("setDistance", () => {
    it("updates distance range", () => {
      useActivitiesStore.getState().setDistance([10, 50]);
      expect(useActivitiesStore.getState().distance).toEqual([10, 50]);
    });

    it("resets page to 1 when distance changes", () => {
      useActivitiesStore.getState().setPage(3);
      useActivitiesStore.getState().setDistance([20, 80]);
      expect(useActivitiesStore.getState().page).toBe(1);
    });
  });

  describe("setRace", () => {
    it("updates race to true", () => {
      useActivitiesStore.getState().setRace(true);
      expect(useActivitiesStore.getState().race).toBe(true);
    });

    it("updates race to false", () => {
      useActivitiesStore.getState().setRace(true);
      useActivitiesStore.getState().setRace(false);
      expect(useActivitiesStore.getState().race).toBe(false);
    });

    it("resets page to 1 when race changes", () => {
      useActivitiesStore.getState().setPage(4);
      useActivitiesStore.getState().setRace(true);
      expect(useActivitiesStore.getState().page).toBe(1);
    });
  });

  describe("setPage", () => {
    it("updates page number", () => {
      useActivitiesStore.getState().setPage(5);
      expect(useActivitiesStore.getState().page).toBe(5);
    });

    it("allows page 1", () => {
      useActivitiesStore.getState().setPage(1);
      expect(useActivitiesStore.getState().page).toBe(1);
    });

    it("allows high page numbers", () => {
      useActivitiesStore.getState().setPage(100);
      expect(useActivitiesStore.getState().page).toBe(100);
    });
  });

  describe("setOrder", () => {
    it("updates order to asc", () => {
      useActivitiesStore.getState().setOrder("asc");
      expect(useActivitiesStore.getState().order).toBe("asc");
    });

    it("updates order to desc", () => {
      useActivitiesStore.getState().setOrder("asc");
      useActivitiesStore.getState().setOrder("desc");
      expect(useActivitiesStore.getState().order).toBe("desc");
    });
  });

  describe("setOrderBy", () => {
    it("updates orderBy field", () => {
      useActivitiesStore.getState().setOrderBy("start_time");
      expect(useActivitiesStore.getState().orderBy).toBe("start_time");
    });

    it("updates orderBy to distance", () => {
      useActivitiesStore.getState().setOrderBy("total_distance");
      expect(useActivitiesStore.getState().orderBy).toBe("total_distance");
    });

    it("updates orderBy to empty string", () => {
      useActivitiesStore.getState().setOrderBy("start_time");
      useActivitiesStore.getState().setOrderBy("");
      expect(useActivitiesStore.getState().orderBy).toBe("");
    });
  });

  describe("resetFilters", () => {
    it("resets all filters to initial state", () => {
      useActivitiesStore.getState().setSport("running");
      useActivitiesStore.getState().setDistance([10, 50]);
      useActivitiesStore.getState().setRace(true);
      useActivitiesStore.getState().setPage(5);
      useActivitiesStore.getState().setOrder("asc");
      useActivitiesStore.getState().setOrderBy("distance");

      useActivitiesStore.getState().resetFilters();

      const state = useActivitiesStore.getState();
      expect(state.sport).toBeUndefined();
      expect(state.distance).toEqual([0, 100]);
      expect(state.race).toBe(false);
      expect(state.page).toBe(1);
      expect(state.order).toBe("desc");
      expect(state.orderBy).toBe("");
    });
  });
});

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      tokenExpiry: null,
    });
  });

  const createMockUser = (): User => ({
    id: "user-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    google_id: "google-123",
    google_picture: "https://example.com/pic.jpg",
    map: "leaflet",
    running_enabled: true,
    cycling_enabled: true,
    swimming_enabled: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  });

  const createMockToken = (): Token => ({
    access_token: "test-token-123",
    token_type: "bearer",
    expires_in: 3600,
  });

  describe("initial state", () => {
    it("has null user by default", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("has null token by default", () => {
      expect(useAuthStore.getState().token).toBeNull();
    });

    it("has null tokenExpiry by default", () => {
      expect(useAuthStore.getState().tokenExpiry).toBeNull();
    });
  });

  describe("setUser", () => {
    it("updates user", () => {
      const user = createMockUser();
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it("clears user when set to null", () => {
      const user = createMockUser();
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("setToken", () => {
    it("updates token", () => {
      useAuthStore.getState().setToken("new-token");
      expect(useAuthStore.getState().token).toBe("new-token");
    });

    it("clears token when set to null", () => {
      useAuthStore.getState().setToken("test-token");
      useAuthStore.getState().setToken(null);
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe("setAuth", () => {
    it("sets user, token, and calculates expiry", () => {
      const user = createMockUser();
      const token = createMockToken();
      const beforeTime = Date.now();

      useAuthStore.getState().setAuth(user, token);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe("test-token-123");
      expect(state.tokenExpiry).toBeGreaterThanOrEqual(beforeTime + 3600 * 1000);
    });

    it("calculates correct expiry based on expires_in", () => {
      const user = createMockUser();
      const token: Token = {
        access_token: "token",
        token_type: "bearer",
        expires_in: 7200,
      };
      const beforeTime = Date.now();

      useAuthStore.getState().setAuth(user, token);

      const state = useAuthStore.getState();
      expect(state.tokenExpiry).toBeGreaterThanOrEqual(beforeTime + 7200 * 1000);
      expect(state.tokenExpiry).toBeLessThanOrEqual(Date.now() + 7200 * 1000 + 100);
    });
  });

  describe("logout", () => {
    it("clears all auth data", () => {
      const user = createMockUser();
      const token = createMockToken();
      useAuthStore.getState().setAuth(user, token);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.tokenExpiry).toBeNull();
    });

    it("clears auth data when only user was set", () => {
      useAuthStore.getState().setUser(createMockUser());

      useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
