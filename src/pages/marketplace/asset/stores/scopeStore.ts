import { create } from 'zustand';

interface ScopeState {
  scope: string | null;
  compareWith: string | null;
  setScope: (scope: string | null) => void;
  setCompareWith: (compareWith: string | null) => void;
  hydrateFromQuery: (payload: { scope: string | null; compareWith: string | null }) => void;
  reset: () => void;
}

const initialState = {
  scope: null,
  compareWith: null,
};

export const useAssetDetailScopeStore = create<ScopeState>((set) => ({
  ...initialState,
  setScope: (scope) => set({ scope }),
  setCompareWith: (compareWith) => set({ compareWith }),
  hydrateFromQuery: ({ scope, compareWith }) => set({ scope, compareWith }),
  reset: () => set(initialState),
}));
