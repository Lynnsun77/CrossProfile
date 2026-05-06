import { create } from 'zustand';

export type CompareBasketItem = {
  assetId: string;
  title: string;
};

type CompareBasketState = {
  items: CompareBasketItem[];
  add: (item: CompareBasketItem) => void;
  remove: (assetId: string) => void;
  has: (assetId: string) => boolean;
  clear: () => void;
};

export const useCompareBasketStore = create<CompareBasketState>((set, get) => ({
  items: [],
  add: (item) =>
    set((s) => {
      if (s.items.some((it) => it.assetId === item.assetId)) return s;
      return { items: [...s.items, item] };
    }),
  remove: (assetId) => set((s) => ({ items: s.items.filter((it) => it.assetId !== assetId) })),
  has: (assetId) => get().items.some((it) => it.assetId === assetId),
  clear: () => set({ items: [] }),
}));

