import { create } from "zustand";
import { type } from "arktype";

const ActivitiesFilterData = type({
  sport: "string",
  distance: ["number", "number"],
  race: "boolean",
  page: "number",
  order: "'asc'|'desc'",
  orderBy: "string",
});
type ActivitiesFilterData = typeof ActivitiesFilterData.infer;

interface ActivitiesFilterState extends ActivitiesFilterData {
  setSport: (sport: string) => void;
  setDistance: (distance: [number, number]) => void;
  setRace: (race: boolean) => void;
  setPage: (page: number) => void;
  setOrder: (order: "asc" | "desc") => void;
  setOrderBy: (orderBy: string) => void;
  resetFilters: () => void;
}

const initialState: ActivitiesFilterData = {
  sport: "",
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
