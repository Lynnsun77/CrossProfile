import type {
  DemandGap,
  ProducerDashboardPipelineOverview,
  ProducerDashboardSupplyCoverage,
  ProducerRevenueLoop,
  QualityHealthHeatmapPoint,
  QualityValueRankingItem,
} from '../types';
import {
  getProducerConsumptionRanking,
  getProducerDashboardPipelineOverview,
  getProducerDashboardSupplyCoverage,
  getProducerGapTopItems,
  getProducerHealthHeatmap,
  getProducerRevenueLoop,
} from '../mock/producerInsights';

export type ProducerDashboardRankingRequest = {
  limit?: number;
};

export type ProducerDashboardGapTopRequest = {
  limit?: number;
};

export type ProducerDashboardHealthHeatmapResponse = {
  items: QualityHealthHeatmapPoint[];
  total: number;
};

export type ProducerDashboardConsumptionRankingResponse = {
  items: QualityValueRankingItem[];
  total: number;
};

export type ProducerDashboardGapTopResponse = {
  items: DemandGap[];
  total: number;
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withQuery(pathname: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value != null && value !== '') {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildProducerDashboardSupplyCoverageUrl() {
  return '/api/dashboard/producer/supply-coverage';
}

export async function getProducerDashboardSupplyCoverageApi(): Promise<ProducerDashboardSupplyCoverage> {
  void buildProducerDashboardSupplyCoverageUrl();
  await delay(110);
  return getProducerDashboardSupplyCoverage();
}

export function buildProducerDashboardPipelineOverviewUrl() {
  return '/api/dashboard/producer/pipeline-overview';
}

export async function getProducerDashboardPipelineOverviewApi(): Promise<ProducerDashboardPipelineOverview> {
  void buildProducerDashboardPipelineOverviewUrl();
  await delay(130);
  return getProducerDashboardPipelineOverview();
}

export function buildProducerDashboardHealthHeatmapUrl() {
  return '/api/dashboard/producer/health-heatmap';
}

export async function getProducerDashboardHealthHeatmapApi(): Promise<ProducerDashboardHealthHeatmapResponse> {
  void buildProducerDashboardHealthHeatmapUrl();
  await delay(120);
  const items = getProducerHealthHeatmap();
  return {
    items,
    total: items.length,
  };
}

export function buildProducerDashboardConsumptionRankingUrl(req: ProducerDashboardRankingRequest = {}) {
  return withQuery('/api/dashboard/producer/consumption-ranking', [
    ['limit', req.limit ? String(req.limit) : undefined],
  ]);
}

export async function getProducerDashboardConsumptionRankingApi(
  req: ProducerDashboardRankingRequest = {},
): Promise<ProducerDashboardConsumptionRankingResponse> {
  void buildProducerDashboardConsumptionRankingUrl(req);
  await delay(110);
  const items = getProducerConsumptionRanking(req.limit ?? 10);
  return {
    items,
    total: items.length,
  };
}

export function buildProducerDashboardRevenueLoopUrl(req: ProducerDashboardRankingRequest = {}) {
  return withQuery('/api/dashboard/producer/revenue-loop', [
    ['limit', req.limit ? String(req.limit) : undefined],
  ]);
}

export async function getProducerDashboardRevenueLoopApi(
  req: ProducerDashboardRankingRequest = {},
): Promise<ProducerRevenueLoop> {
  void buildProducerDashboardRevenueLoopUrl(req);
  await delay(120);
  return getProducerRevenueLoop(req.limit ?? 5);
}

export function buildProducerDashboardGapTopUrl(req: ProducerDashboardGapTopRequest = {}) {
  return withQuery('/api/dashboard/producer/gap-top', [
    ['limit', req.limit ? String(req.limit) : undefined],
  ]);
}

export async function getProducerDashboardGapTopApi(
  req: ProducerDashboardGapTopRequest = {},
): Promise<ProducerDashboardGapTopResponse> {
  void buildProducerDashboardGapTopUrl(req);
  await delay(100);
  const items = getProducerGapTopItems(req.limit ?? 5);
  return {
    items,
    total: items.length,
  };
}
