import { create } from 'zustand';
import type { AssetDetailSource, AssetDetailView } from '../types';

interface ViewState {
  view: AssetDetailView;
  source: AssetDetailSource;
  useCase: string | null;
  setRouteContext: (payload: Partial<Pick<ViewState, 'view' | 'source' | 'useCase'>>) => void;
  reset: () => void;
}

const initialState = {
  view: 'consumer' as AssetDetailView,
  source: 'marketplace' as AssetDetailSource,
  useCase: null,
};

export const useAssetDetailViewStore = create<ViewState>((set) => ({
  ...initialState,
  setRouteContext: (payload) => set((state) => ({ ...state, ...payload })),
  reset: () => set(initialState),
}));
