import type { Asset, Domain, FeatureType } from '../types';
import { mockAssets } from '../mock';

export type FeatureClassParam = 'all' | FeatureType;
export type MarketplaceTabParam = 'all' | 'ranking' | 'favorites';

export type SortKey = 'heat' | 'quality' | 'ab_revenue' | 'latest' | 'subs';
export type SortDir = 'asc' | 'desc';

export type Tier = 'common' | 'premium' | 'longtail';
export type DataSource = 'btm_plus' | 'external' | 'cross_domain' | 'private_end';
export type Timeliness = 'realtime' | 't1' | 't7';
export type SubRange = '0_30' | '30_60' | '60_plus';
export type PublishedAfter = '7d' | '30d' | '90d';

export type MarketplaceFilters = {
  tier: Tier | null;
  dataSource: DataSource | null;
  timeliness: Timeliness | null;
  subRange: SubRange | null;
  publishedAfter: PublishedAfter | null;
};

export type AssetsRequest = {
  featureClass: FeatureClassParam;
  tab: MarketplaceTabParam;
  q: string;
  filters: MarketplaceFilters;
  sortKey: SortKey;
  sortDir: SortDir;
  favoriteIds?: string[];
};

export type DerivedAsset = Asset & {
  featureClass: FeatureType;
  tier: Tier;
  dataSource: DataSource;
  timeliness: Timeliness;
  publishedAtMs: number;
  qualityScore: number;
  abRevenue: number;
};

export type AssetsResponse = {
  items: DerivedAsset[];
  total: number;
};

export function buildAssetsUrl(req: AssetsRequest) {
  const params = new URLSearchParams();
  params.set('featureClass', req.featureClass);
  params.set('tab', req.tab);
  if (req.q.trim()) params.set('q', req.q.trim());
  if (req.sortKey) params.set('sortKey', req.sortKey);
  if (req.sortDir) params.set('sortDir', req.sortDir);
  if (req.favoriteIds?.length) params.set('favoriteIds', req.favoriteIds.join(','));

  const f = req.filters;
  if (f.tier) params.set('tier', f.tier);
  if (f.dataSource) params.set('dataSource', f.dataSource);
  if (f.timeliness) params.set('timeliness', f.timeliness);
  if (f.subRange) params.set('subRange', f.subRange);
  if (f.publishedAfter) params.set('publishedAfter', f.publishedAfter);

  return `/api/assets?${params.toString()}`;
}

export function buildAssetUrl(assetId: string) {
  return `/api/asset/${encodeURIComponent(assetId)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeFeatureClass(asset: Asset): FeatureType {
  if (asset.type === 'tag') return 'rule';
  if (asset.type === 'crowd_template') return 'sequence';
  if (asset.type === 'model') return 'algo';
  return 'vector';
}

function normalizeTier(asset: Asset): Tier {
  if (asset.lifecycle === 'hot') return 'premium';
  if (asset.lifecycle === 'new') return 'premium';
  if (asset.lifecycle === 'deprecated') return 'longtail';
  return 'common';
}

function normalizeDataSource(asset: Asset): DataSource {
  if (asset.dataSourceType) return asset.dataSourceType;
  if (asset.domain === 'cross') return 'cross_domain';
  if (asset.type === 'tag') return 'external';
  return 'btm_plus';
}

function normalizeTimeliness(asset: Asset): Timeliness {
  const v = asset.health?.freshness;
  if (v === 'green' || v === 'realtime') return 'realtime';
  if (v === 'yellow' || v === 'T+1') return 't1';
  if (v === 'red' || v === 'T+7') return 't7';
  return 't1';
}

function derivePublishedAtMs(asset: Asset): number {
  const numeric = Number(String(asset.id).replace(/\D/g, '').slice(-3)) || 1;
  const today = new Date();
  const baseDays =
    asset.lifecycle === 'new'
      ? 6
      : asset.lifecycle === 'hot'
        ? 18
        : asset.lifecycle === 'deprecated'
          ? 120
          : 45;
  const jitter = numeric % 13; // 0..12
  const daysAgo = clamp(baseDays + jitter - 6, 1, 180);
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(12, 0, 0, 0);
  return dt.getTime();
}

function deriveAbRevenue(asset: Asset): number {
  if (typeof asset.uplift?.value === 'number') return asset.uplift.value;
  if (typeof asset.health?.lift === 'number') return Math.round(asset.health.lift * 100);
  return 0;
}

function deriveAsset(asset: Asset): DerivedAsset {
  return {
    ...asset,
    featureClass: normalizeFeatureClass(asset),
    tier: normalizeTier(asset),
    dataSource: normalizeDataSource(asset),
    timeliness: normalizeTimeliness(asset),
    publishedAtMs: derivePublishedAtMs(asset),
    qualityScore: Number(asset.health?.score ?? 0),
    abRevenue: deriveAbRevenue(asset),
  };
}

type SearchParsed = {
  freeText: string;
  domain: Domain | null;
  tier: Tier | null;
  timeliness: Timeliness | null;
  minQualityScore: number | null;
};

function tokenizeStructuredQuery(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const s = input.trim();
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) break;
    if (s[i] === '"') {
      i++;
      let buf = '';
      while (i < s.length && s[i] !== '"') {
        buf += s[i]!;
        i++;
      }
      if (s[i] === '"') i++;
      if (buf.trim()) tokens.push(buf.trim());
      continue;
    }
    let buf = '';
    while (i < s.length && !/\s/.test(s[i]!)) {
      buf += s[i]!;
      i++;
    }
    if (buf.trim()) tokens.push(buf.trim());
  }
  return tokens;
}

function parseMinScore(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  const m = v.match(/^(>=|>|=)?\s*(\d{1,3})$/);
  if (m) return clamp(Number(m[2]), 0, 100);
  if (v === 'excellent') return 90;
  if (v === 'good') return 80;
  if (v === 'qualified') return 70;
  return null;
}

function parseStructuredSearch(input: string): SearchParsed {
  const tokens = tokenizeStructuredQuery(input);
  const free: string[] = [];
  let domain: Domain | null = null;
  let tier: Tier | null = null;
  let timeliness: Timeliness | null = null;
  let minQualityScore: number | null = null;

  for (const token of tokens) {
    const idx = token.indexOf(':');
    if (idx <= 0) {
      free.push(token);
      continue;
    }
    const key = token.slice(0, idx).trim().toLowerCase();
    const value = token.slice(idx + 1).trim();
    if (!value) continue;

    if (key === 'domain') {
      const v = value.toLowerCase();
      if (v === 'cross' || v === 'ecommerce' || v === 'lifestyle' || v === 'ecom' || v === 'local') {
        domain = v as Domain;
        continue;
      }
    }
    if (key === 'tier') {
      const v = value.toLowerCase();
      if (v === 'common' || v === 'premium' || v === 'longtail') {
        tier = v as Tier;
        continue;
      }
    }
    if (key === 'timeliness') {
      const v = value.toLowerCase();
      if (v === 'realtime' || v === 't1' || v === 't7' || v === 't+1' || v === 't+7') {
        timeliness = (v === 't+1' ? 't1' : v === 't+7' ? 't7' : v) as Timeliness;
        continue;
      }
      if (v === 'fresh') {
        timeliness = 'realtime';
        continue;
      }
    }
    if (key === 'quality') {
      const parsed = parseMinScore(value);
      if (parsed != null) {
        minQualityScore = parsed;
        continue;
      }
    }
    free.push(token);
  }

  return {
    freeText: free.join(' ').trim(),
    domain,
    tier,
    timeliness,
    minQualityScore,
  };
}

function matchFreeText(asset: Asset, freeText: string): boolean {
  const q = freeText.trim().toLowerCase();
  if (!q) return true;
  const fields = [
    asset.id,
    asset.name,
    asset.nameBiz,
    asset.nameAlgo,
    asset.desc,
    asset.description,
    asset.namespace,
    asset.domain,
    asset.type,
    ...(asset.scenarios ?? []),
    ...(asset.chipsBiz ?? []),
    ...(asset.chipsAlgo ?? []),
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  return fields.some((f) => f.includes(q));
}

// Mock GET /api/assets (in-memory filter + sort)
export async function getAssetsApi(req: AssetsRequest): Promise<AssetsResponse> {
  void buildAssetsUrl(req);
  await new Promise((resolve) => window.setTimeout(resolve, 160));

  const derived = mockAssets.map(deriveAsset);

  if (req.tab === 'ranking') {
    const items = derived
      .slice()
      .sort((a, b) => (b.heat ?? b.subs) - (a.heat ?? a.subs))
      .slice(0, 10);
    return { items, total: items.length };
  }

  const parsed = parseStructuredSearch(req.q);
  const favorites = new Set(req.favoriteIds ?? []);

  const now = Date.now();
  const publishedAfterMs =
    req.filters.publishedAfter === '7d'
      ? now - 7 * 24 * 3600 * 1000
      : req.filters.publishedAfter === '30d'
        ? now - 30 * 24 * 3600 * 1000
        : req.filters.publishedAfter === '90d'
          ? now - 90 * 24 * 3600 * 1000
          : null;

  const filtered = derived
    .filter((a) => (req.featureClass === 'all' ? true : a.featureClass === req.featureClass))
    .filter((a) => (req.filters.tier ? a.tier === req.filters.tier : true))
    .filter((a) => (req.filters.dataSource ? a.dataSource === req.filters.dataSource : true))
    .filter((a) => (req.filters.timeliness ? a.timeliness === req.filters.timeliness : true))
    .filter((a) => {
      if (!req.filters.subRange) return true;
      const s = a.subs ?? 0;
      if (req.filters.subRange === '0_30') return s < 30;
      if (req.filters.subRange === '30_60') return s >= 30 && s < 60;
      return s >= 60;
    })
    .filter((a) => (publishedAfterMs ? a.publishedAtMs >= publishedAfterMs : true))
    .filter((a) => (parsed.domain ? a.domain === parsed.domain : true))
    .filter((a) => (parsed.tier ? a.tier === parsed.tier : true))
    .filter((a) => (parsed.timeliness ? a.timeliness === parsed.timeliness : true))
    .filter((a) => (parsed.minQualityScore != null ? a.qualityScore >= parsed.minQualityScore : true))
    .filter((a) => matchFreeText(a, parsed.freeText))
    .filter((a) => (req.tab === 'favorites' ? favorites.has(a.id) : true));

  const dir = req.sortDir === 'asc' ? 1 : -1;
  const items = filtered.slice().sort((a, b) => {
    const ax =
      req.sortKey === 'heat'
        ? a.heat ?? a.subs
        : req.sortKey === 'quality'
          ? a.qualityScore
          : req.sortKey === 'ab_revenue'
            ? a.abRevenue
            : req.sortKey === 'latest'
              ? a.publishedAtMs
              : a.subs;
    const bx =
      req.sortKey === 'heat'
        ? b.heat ?? b.subs
        : req.sortKey === 'quality'
          ? b.qualityScore
          : req.sortKey === 'ab_revenue'
            ? b.abRevenue
            : req.sortKey === 'latest'
              ? b.publishedAtMs
              : b.subs;
    return (ax - bx) * dir;
  });

  return { items, total: filtered.length };
}

// Mock GET /api/asset/:id
export async function getAssetApi(assetId: string): Promise<DerivedAsset | null> {
  void buildAssetUrl(assetId);
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const found = mockAssets.find((a) => a.id === assetId);
  return found ? deriveAsset(found) : null;
}

