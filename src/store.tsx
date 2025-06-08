import { create } from "zustand";

interface ActivitiesFilterState {
  sport: string;
  distance: number[];
  race: boolean;
  page: number;
  order: "asc" | "desc";
  orderBy: string;
  setSport: (sport: string) => void;
  setDistance: (distance: number[]) => void;
  setRace: (race: boolean) => void;
  setPage: (page: number) => void;
  setOrder: (order: "asc" | "desc") => void;
  setOrderBy: (orderBy: string) => void;
  resetFilters: () => void;
}

const initialState = {
  sport: "",
  distance: [0, 100],
  race: false,
  page: 1,
  order: "desc" as const,
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
