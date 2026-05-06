import type { DemandGap, DemandHeatmapCell, DemandScenario, FeatureDomain, UnmatchedQueryRankingItem } from '../types';
import {
  claimDemandGap,
  getDemandGapList,
  getDemandHeatmap,
  getUnmatchedQueryRanking,
  unclaimDemandGap,
} from '../mock/producerInsights';

export type DemandGapSortBy = 'business_value' | 'due_at' | 'unmatched_query_count';

export type ProducerGapListRequest = {
  scenario?: 'all' | DemandScenario;
  domain?: 'all' | FeatureDomain;
  status?: 'all' | DemandGap['status'];
  keyword?: string;
  sortBy?: DemandGapSortBy;
  page?: number;
  pageSize?: number;
};

export type DemandGapClaimInput = {
  operatorUserId: string;
  operatorUserName: string;
  operatorTeamName: string;
};

export type ProducerDemandHeatmapResponse = {
  items: DemandHeatmapCell[];
  total: number;
};

export type ProducerUnmatchedQueryRankingResponse = {
  items: UnmatchedQueryRankingItem[];
  total: number;
};

export type ProducerGapListResponse = {
  items: DemandGap[];
  total: number;
  page: number;
  pageSize: number;
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withQuery(pathname: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value != null && value !== '' && value !== 'all') {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function dueAtValue(value: string | null) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

export function buildProducerDemandHeatmapUrl() {
  return '/api/recommender/producer/demand-heatmap';
}

export async function getProducerDemandHeatmapApi(): Promise<ProducerDemandHeatmapResponse> {
  void buildProducerDemandHeatmapUrl();
  await delay(120);
  const items = getDemandHeatmap();
  return {
    items,
    total: items.length,
  };
}

export function buildProducerUnmatchedQueryRankingUrl(limit?: number) {
  return withQuery('/api/recommender/producer/unmatched-queries', [['limit', limit ? String(limit) : undefined]]);
}

export async function getProducerUnmatchedQueryRankingApi(limit = 10): Promise<ProducerUnmatchedQueryRankingResponse> {
  void buildProducerUnmatchedQueryRankingUrl(limit);
  await delay(110);
  const items = getUnmatchedQueryRanking(limit);
  return {
    items,
    total: items.length,
  };
}

export function buildProducerGapListUrl(req: ProducerGapListRequest = {}) {
  return withQuery('/api/recommender/producer/gaps', [
    ['scenario', req.scenario],
    ['domain', req.domain],
    ['status', req.status],
    ['keyword', req.keyword?.trim()],
    ['sortBy', req.sortBy],
    ['page', req.page ? String(req.page) : undefined],
    ['pageSize', req.pageSize ? String(req.pageSize) : undefined],
  ]);
}

export async function getProducerGapListApi(req: ProducerGapListRequest = {}): Promise<ProducerGapListResponse> {
  void buildProducerGapListUrl(req);
  await delay(140);

  const page = Math.max(req.page ?? 1, 1);
  const pageSize = Math.max(req.pageSize ?? 10, 1);
  const keyword = req.keyword?.trim().toLowerCase() ?? '';

  const filtered = getDemandGapList().filter((item) => {
    const matchesScenario = req.scenario && req.scenario !== 'all' ? item.scenario === req.scenario : true;
    const matchesDomain = req.domain && req.domain !== 'all' ? item.relatedDomain === req.domain : true;
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesKeyword = keyword
      ? [item.id, item.title, item.queryText ?? '', item.requestedByTeam].some((text) => text.toLowerCase().includes(keyword))
      : true;
    return matchesScenario && matchesDomain && matchesStatus && matchesKeyword;
  });

  const sorted = filtered.slice().sort((a, b) => {
    if (req.sortBy === 'due_at') {
      return dueAtValue(a.dueAt) - dueAtValue(b.dueAt);
    }
    if (req.sortBy === 'unmatched_query_count') {
      return (b.unmetQueryCount ?? 0) - (a.unmetQueryCount ?? 0);
    }
    return b.expectedBusinessValue - a.expectedBusinessValue;
  });

  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return {
    items,
    total: sorted.length,
    page,
    pageSize,
  };
}

export function buildProducerGapClaimUrl(gapId: string) {
  return `/api/recommender/producer/gaps/${encodeURIComponent(gapId)}/claim`;
}

export async function claimProducerGapApi(gapId: string, input: DemandGapClaimInput): Promise<DemandGap | null> {
  void buildProducerGapClaimUrl(gapId);
  await delay(100);
  return claimDemandGap(gapId, input);
}

export function buildProducerGapUnclaimUrl(gapId: string) {
  return `/api/recommender/producer/gaps/${encodeURIComponent(gapId)}/unclaim`;
}

export async function unclaimProducerGapApi(gapId: string, input: DemandGapClaimInput): Promise<DemandGap | null> {
  void buildProducerGapUnclaimUrl(gapId);
  await delay(100);
  return unclaimDemandGap(gapId, input);
}
