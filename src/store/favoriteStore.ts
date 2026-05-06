import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { postFavorite } from '../api/favorite';

type FavoriteState = {
  ids: string[];
  pendingIds: string[];
  isFavorite: (assetId: string) => boolean;
  isPending: (assetId: string) => boolean;
  toggleFavorite: (assetId: string) => Promise<boolean>;
};

function uniq(next: string[]) {
  return Array.from(new Set(next));
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      ids: [],
      pendingIds: [],
      isFavorite: (assetId) => get().ids.includes(assetId),
      isPending: (assetId) => get().pendingIds.includes(assetId),
      toggleFavorite: async (assetId) => {
        const current = get().ids.includes(assetId);
        const next = !current;

        set((s) => ({ pendingIds: uniq([...s.pendingIds, assetId]) }));
        try {
          const resp = await postFavorite({ assetId, favorited: next });
          if (resp.success) {
            set((s) => ({
              ids: resp.favorited ? uniq([...s.ids, assetId]) : s.ids.filter((id) => id !== assetId),
            }));
          }
          return resp.favorited;
        } finally {
          set((s) => ({ pendingIds: s.pendingIds.filter((id) => id !== assetId) }));
        }
      },
    }),
    { name: 'cp_favorites_v1', partialize: (s) => ({ ids: s.ids }) }
  )
);

