import { mockAssets } from '../mock';

export type AssetPreview = {
  assetId: string;
  title: string;
  summary: string;
  highlights: string[];
  updatedAt: string;
};

export function buildAssetPreviewUrl(assetId: string) {
  return `/api/asset/${encodeURIComponent(assetId)}/preview`;
}

function stableUpdatedAtFromId(assetId: string) {
  const base = new Date('2026-04-24T00:00:00.000Z');
  const m = assetId.match(/(\d+)$/);
  const n = m ? Number(m[1]) : 0;
  const days = (n % 9) + 1;
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

// Mock GET /api/asset/:id/preview
export async function getAssetPreview(assetId: string): Promise<AssetPreview> {
  void buildAssetPreviewUrl(assetId);
  await new Promise((resolve) => window.setTimeout(resolve, 260));

  const asset = mockAssets.find((a) => a.id === assetId);
  const title = asset?.nameBiz || asset?.name || assetId;
  const summary = asset?.description || asset?.desc || '暂无预览信息';

  const healthScore = typeof asset?.health?.score === 'number' ? asset.health.score : null;
  const subs = typeof asset?.subs === 'number' ? asset.subs : null;
  const freshness = asset?.health?.freshness;

  const highlights: string[] = [];
  if (healthScore != null) highlights.push(`质量评分 ${healthScore}`);
  if (subs != null) highlights.push(`订阅数 ${subs}`);
  if (typeof freshness === 'string') {
    const label = freshness === 'realtime' ? '实时' : freshness;
    highlights.push(`时效 ${label}`);
  }

  return {
    assetId,
    title,
    summary,
    highlights: highlights.slice(0, 3),
    updatedAt: stableUpdatedAtFromId(assetId),
  };
}

