import { create } from 'zustand';
import type { AssetPreview } from '../api/assetPreview';

export type CachedAssetPreview = {
  data: AssetPreview;
  fetchedAtMs: number;
};

type AssetPreviewCacheState = {
  byId: Record<string, CachedAssetPreview | undefined>;
  getFresh: (assetId: string, ttlMs: number) => AssetPreview | null;
  setCached: (assetId: string, data: AssetPreview) => void;
  clear: () => void;
};

export const useAssetPreviewCacheStore = create<AssetPreviewCacheState>((set, get) => ({
  byId: {},
  getFresh: (assetId, ttlMs) => {
    const entry = get().byId[assetId];
    if (!entry) return null;
    if (Date.now() - entry.fetchedAtMs > ttlMs) return null;
    return entry.data;
  },
  setCached: (assetId, data) =>
    set((s) => ({
      byId: {
        ...s.byId,
        [assetId]: { data, fetchedAtMs: Date.now() },
      },
    })),
  clear: () => set({ byId: {} }),
}));

