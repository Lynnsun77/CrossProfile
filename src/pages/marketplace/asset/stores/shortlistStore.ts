import { create } from 'zustand';
import { buildAssetId } from '../../../../lib/runtimeTokens';

interface ShortlistState {
  assetIds: string[];
  add: (assetId: string) => void;
  remove: (assetId: string) => void;
  toggle: (assetId: string) => void;
  reset: () => void;
}

export const useAssetDetailShortlistStore = create<ShortlistState>((set) => ({
  assetIds: [buildAssetId(2), buildAssetId(3)],
  add: (assetId) =>
    set((state) => ({
      assetIds: state.assetIds.includes(assetId) ? state.assetIds : [...state.assetIds, assetId],
    })),
  remove: (assetId) => set((state) => ({ assetIds: state.assetIds.filter((id) => id !== assetId) })),
  toggle: (assetId) =>
    set((state) => ({
      assetIds: state.assetIds.includes(assetId)
        ? state.assetIds.filter((id) => id !== assetId)
        : [...state.assetIds, assetId],
    })),
  reset: () => set({ assetIds: [] }),
}));
