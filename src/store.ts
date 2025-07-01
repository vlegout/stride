import { create } from "zustand";
import { type } from "arktype";
import { persist } from "zustand/middleware";
import type { User, Token } from "./types";
import { Sport } from "./types";

const ActivitiesFilterData = type({
  sport: Sport.or("undefined"),
  distance: ["number", "number"],
  race: "boolean",
  page: "number",
  order: "'asc'|'desc'",
  orderBy: "string",
});
type ActivitiesFilterData = typeof ActivitiesFilterData.infer;

interface ActivitiesFilterState extends ActivitiesFilterData {
  setSport: (sport?: Sport) => void;
  setDistance: (distance: [number, number]) => void;
  setRace: (race: boolean) => void;
  setPage: (page: number) => void;
  setOrder: (order: "asc" | "desc") => void;
  setOrderBy: (orderBy: string) => void;
  resetFilters: () => void;
}

const initialState: ActivitiesFilterData = {
  sport: undefined,
  distance: [0, 100] as [number, number],
  race: false,
  page: 1,
  order: "desc",
  orderBy: "",
};

export const useActivitiesStore = create<ActivitiesFilterState>((set) => ({
  ...initialState,
  setSport: (sport) => set({ sport, page: 1 }),
  setDistance: (distance) => set({ distance, page: 1 }),
  setRace: (race) => set({ race, page: 1 }),
  setPage: (page) => set({ page }),
  setOrder: (order) => set({ order }),
  setOrderBy: (orderBy) => set({ orderBy }),
  resetFilters: () => set(initialState),
}));

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiry: number | null;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuth: (user: User, token: Token) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiry: null,
      logout: () => {
        set({
          user: null,
          token: null,
          tokenExpiry: null,
        });
      },
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuth: (user: User, token: Token) => {
        const expiry = Date.now() + token.expires_in * 1000;
        set({
          user,
          token: token.access_token,
          tokenExpiry: expiry,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiry: state.tokenExpiry,
      }),
    },
  ),
);
