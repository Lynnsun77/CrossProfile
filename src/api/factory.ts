import type {
  FactoryCaliberCompareRow,
  FactoryFeatureConfig,
  FactoryLaunchCycleStats,
  FactoryOverviewCard,
  FactoryPipelineRunWithFeature,
  FactorySimilaritySearchResult,
  FactorySubmitPipelineResponse,
  FeatureType,
} from '../types';
import {
  getFactoryCaliberComparison,
  getFactoryFeatureConfig,
  getFactoryGanttRows,
  getFactoryLaunchCycleStats,
  getFactoryPipelineOverview,
  saveFactoryFeatureConfig,
  searchFactorySimilarFeatures,
  submitFactoryPipeline,
} from '../mock/factory';

export type FactoryGanttRequest = {
  featureType?: 'all' | FeatureType;
};

export type FactoryFeatureConfigPatch = Partial<
  Omit<
    FactoryFeatureConfig,
    'dataSource' | 'idMapping' | 'processingLogic' | 'outputConfig' | 'evaluationBaseline'
  >
> & {
  dataSource?: Partial<FactoryFeatureConfig['dataSource']>;
  idMapping?: Partial<FactoryFeatureConfig['idMapping']>;
  processingLogic?: Partial<FactoryFeatureConfig['processingLogic']>;
  outputConfig?: Partial<FactoryFeatureConfig['outputConfig']>;
  evaluationBaseline?: Partial<FactoryFeatureConfig['evaluationBaseline']> & {
    metrics?: FactoryFeatureConfig['evaluationBaseline']['metrics'];
  };
};

export type FactorySimilaritySearchRequest = {
  q: string;
};

export type FactoryCaliberCompareRequest = {
  featureIds: string[];
};

export type FactoryOverviewResponse = {
  items: FactoryOverviewCard[];
  total: number;
};

export type FactoryGanttResponse = {
  items: FactoryPipelineRunWithFeature[];
  total: number;
};

export type FactorySimilaritySearchResponse = {
  items: FactorySimilaritySearchResult[];
  hasHighSimilarity: boolean;
};

export type FactoryCaliberCompareResponse = {
  items: FactoryCaliberCompareRow[];
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function buildFactoryOverviewUrl() {
  return '/api/factory/overview';
}

export async function getFactoryOverviewApi(): Promise<FactoryOverviewResponse> {
  void buildFactoryOverviewUrl();
  await delay(120);
  const items = getFactoryPipelineOverview();
  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

export function buildFactoryGanttUrl(req: FactoryGanttRequest = {}) {
  const params = new URLSearchParams();
  if (req.featureType && req.featureType !== 'all') {
    params.set('featureType', req.featureType);
  }
  const query = params.toString();
  return query ? `/api/factory/gantt?${query}` : '/api/factory/gantt';
}

export async function getFactoryGanttApi(req: FactoryGanttRequest = {}): Promise<FactoryGanttResponse> {
  void buildFactoryGanttUrl(req);
  await delay(150);
  const items = getFactoryGanttRows(req.featureType ?? 'all');
  return {
    items,
    total: items.length,
  };
}

export function buildFactoryLaunchCycleStatsUrl() {
  return '/api/factory/launch-cycle-stats';
}

export async function getFactoryLaunchCycleStatsApi(): Promise<FactoryLaunchCycleStats> {
  void buildFactoryLaunchCycleStatsUrl();
  await delay(100);
  return getFactoryLaunchCycleStats();
}

export function buildFactoryFeatureConfigUrl(featureId: string) {
  return `/api/factory/features/${encodeURIComponent(featureId)}/config`;
}

export async function getFactoryFeatureConfigApi(featureId: string): Promise<FactoryFeatureConfig | null> {
  void buildFactoryFeatureConfigUrl(featureId);
  await delay(110);
  return getFactoryFeatureConfig(featureId);
}

export async function saveFactoryFeatureConfigApi(
  featureId: string,
  patch: FactoryFeatureConfigPatch,
): Promise<FactoryFeatureConfig | null> {
  void buildFactoryFeatureConfigUrl(featureId);
  await delay(140);
  return saveFactoryFeatureConfig(featureId, patch);
}

export function buildSubmitFactoryPipelineUrl(featureId: string) {
  return `/api/factory/features/${encodeURIComponent(featureId)}/submit`;
}

export async function submitFactoryPipelineApi(featureId: string): Promise<FactorySubmitPipelineResponse | null> {
  void buildSubmitFactoryPipelineUrl(featureId);
  await delay(160);
  return submitFactoryPipeline(featureId);
}

export function buildFactorySimilaritySearchUrl(req: FactorySimilaritySearchRequest) {
  const params = new URLSearchParams();
  if (req.q.trim()) params.set('q', req.q.trim());
  const query = params.toString();
  return query ? `/api/factory/similarity-search?${query}` : '/api/factory/similarity-search';
}

export async function searchFactorySimilarFeaturesApi(
  req: FactorySimilaritySearchRequest,
): Promise<FactorySimilaritySearchResponse> {
  void buildFactorySimilaritySearchUrl(req);
  await delay(130);
  const items = searchFactorySimilarFeatures(req.q);
  return {
    items,
    hasHighSimilarity: items.some((item) => item.similarityScore > 80),
  };
}

export function buildFactoryCaliberCompareUrl(req: FactoryCaliberCompareRequest) {
  const params = new URLSearchParams();
  if (req.featureIds.length) {
    params.set('featureIds', req.featureIds.join(','));
  }
  const query = params.toString();
  return query ? `/api/factory/caliber-compare?${query}` : '/api/factory/caliber-compare';
}

export async function getFactoryCaliberComparisonApi(
  req: FactoryCaliberCompareRequest,
): Promise<FactoryCaliberCompareResponse> {
  void buildFactoryCaliberCompareUrl(req);
  await delay(120);
  return {
    items: getFactoryCaliberComparison(req.featureIds),
  };
}
