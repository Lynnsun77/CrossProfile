import type { ConsumerSubRole } from '../store/globalState';
import type { FeatureType } from '../types';

export type SaveMyStrategyRequest = {
  assetId: string;
  subRole: ConsumerSubRole;
  featureClass: 'all' | FeatureType;
};

export type SaveMyStrategyResponse = {
  success: boolean;
  strategyId: string;
};

export function buildMyStrategyUrl() {
  return '/api/my-strategy';
}

// Mock POST /api/my-strategy
export async function postSaveMyStrategy(req: SaveMyStrategyRequest): Promise<SaveMyStrategyResponse> {
  void buildMyStrategyUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  const strategyId = `st_${req.assetId}_${Date.now().toString(36)}`;
  return { success: true, strategyId };
}

