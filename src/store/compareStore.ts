import { create } from 'zustand';
import { Feature } from '../types';

interface CompareStore {
  features: Feature[];
  addFeature: (feature: Feature) => void;
  removeFeature: (id: string) => void;
  clearFeatures: () => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
  features: [],
  addFeature: (feature) => set((state) => {
    if (state.features.find(f => f.id === feature.id)) return state;
    return { features: [...state.features, feature] };
  }),
  removeFeature: (id) => set((state) => ({
    features: state.features.filter(f => f.id !== id)
  })),
  clearFeatures: () => set({ features: [] })
}));
