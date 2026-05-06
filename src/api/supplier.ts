import type { Asset, AssetType } from '../types';
import { mockAssets } from '../mock';
import { mockGapRanking, type GapRankingItem } from '../mock/gapRanking';

export type SupplierAssetStatus = 'listed' | 'draft' | 'review' | 'offline';

export type SupplierAssetRow = Asset & {
  supplierStatus: SupplierAssetStatus;
  versionText: string;
  updatedAt: string; // YYYY-MM-DD
};

export type GapRankingResponse = {
  items: GapRankingItem[];
};

export type SupplierAssetsRequest = {
  status: SupplierAssetStatus;
  owner?: string;
};

export type SupplierAssetsResponse = {
  items: SupplierAssetRow[];
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function stableDateFromId(id: string) {
  // Keep it stable, no dependency on runtime "today".
  const base = new Date('2026-04-24T00:00:00.000Z');
  const m = id.match(/(\d+)$/);
  const n = m ? Number(m[1]) : 0;
  const days = (n % 12) + 1;
  base.setUTCDate(base.getUTCDate() - days);
  return formatDate(base);
}

function versionFromAsset(asset: Asset) {
  const candidates = [asset.nameAlgo, asset.name, asset.desc].filter(Boolean).join(' ');
  // Keep '-' last in the character class to avoid "Range out of order" on some TS regex parsers.
  const m = candidates.match(/(?:^|[_\-.])(v\d+)(?:$|[\s_.-])/i);
  if (m?.[1]) return m[1].toLowerCase();
  // Fallback: map by type to keep it meaningful in the demo table.
  const byType: Record<AssetType, string> = {
    tag: 'v1',
    crowd_template: 'v2',
    feature_pack: 'v1',
    model: 'v3',
  };
  return byType[asset.type] ?? 'v1';
}

function distributeStatus(index: number): SupplierAssetStatus {
  // Deterministic distribution across 4 tabs.
  const mod = index % 4;
  if (mod === 0) return 'listed';
  if (mod === 1) return 'draft';
  if (mod === 2) return 'review';
  return 'offline';
}

export function buildGapRankingUrl() {
  return '/api/gap-ranking';
}

export async function getGapRankingApi(): Promise<GapRankingResponse> {
  void buildGapRankingUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 140));
  const items = mockGapRanking.slice().sort((a, b) => b.gapScore - a.gapScore).slice(0, 5);
  return { items };
}

export function buildSupplierAssetsUrl(req: SupplierAssetsRequest) {
  const params = new URLSearchParams();
  params.set('status', req.status);
  if (req.owner) params.set('owner', req.owner);
  return `/api/supplier/assets?${params.toString()}`;
}

export async function getSupplierAssetsApi(req: SupplierAssetsRequest): Promise<SupplierAssetsResponse> {
  void buildSupplierAssetsUrl(req);
  await new Promise((resolve) => window.setTimeout(resolve, 160));

  const augmented: SupplierAssetRow[] = mockAssets.map((asset, idx) => ({
    ...asset,
    supplierStatus: distributeStatus(idx),
    versionText: versionFromAsset(asset),
    updatedAt: stableDateFromId(asset.id),
  }));

  const items = augmented
    .filter((it) => it.supplierStatus === req.status)
    .slice()
    .sort((a, b) => b.subs - a.subs);

  return { items };
}

export function getConsumedTopAssetsTop5() {
  // Spec: Top5 consumed assets by subscribeCount/subs.
  return mockAssets
    .slice()
    .sort((a, b) => b.subs - a.subs)
    .slice(0, 5);
}
