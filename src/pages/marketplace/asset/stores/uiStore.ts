import { create } from 'zustand';

export type AssetDetailLayerKey = 'layer0' | 'layer1' | 'layer2' | 'layer3';

interface UiState {
  activeLayer: AssetDetailLayerKey;
  drilldownOpen: boolean;
  activeDrilldownId: string | null;
  setActiveLayer: (layer: AssetDetailLayerKey) => void;
  setDrilldownOpen: (open: boolean) => void;
  openDrilldown: (drilldownId: string) => void;
  closeDrilldown: () => void;
  reset: () => void;
}

const initialState = {
  activeLayer: 'layer0' as AssetDetailLayerKey,
  drilldownOpen: false,
  activeDrilldownId: null,
};

export const useAssetDetailUiStore = create<UiState>((set) => ({
  ...initialState,
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  setDrilldownOpen: (drilldownOpen) => set((state) => ({ drilldownOpen, activeDrilldownId: drilldownOpen ? state.activeDrilldownId : null })),
  openDrilldown: (activeDrilldownId) => set({ drilldownOpen: true, activeDrilldownId }),
  closeDrilldown: () => set({ drilldownOpen: false, activeDrilldownId: null }),
  reset: () => set(initialState),
}));
