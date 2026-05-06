import type { Asset, FeatureType, RecommendMeta } from '../types';
import type { ConsumerSubRole } from '../store/globalState';
import { mockAssets } from '../mock';

export type RecommendBias = 'balanced' | 'tag' | 'crowd' | 'model' | 'pack';

export type RecommendRequest = {
  subRole: ConsumerSubRole;
  recommendBias: RecommendBias;
  featureClass: 'all' | FeatureType;
  limit?: number;
};

export type RecommendItem = {
  asset: Asset;
  recommendMeta: RecommendMeta;
};

export type RecommendResponse = {
  success: boolean;
  items: RecommendItem[];
};

export function buildRecommendUrl() {
  return '/api/recommend';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashString(input: string) {
  // Deterministic hash for stable mock recommendation.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeFeatureClass(asset: Asset): FeatureType {
  if (asset.type === 'tag') return 'rule';
  if (asset.type === 'crowd_template') return 'sequence';
  if (asset.type === 'model') return 'algo';
  return 'vector';
}

function typeWeightFor(subRole: ConsumerSubRole, bias: RecommendBias): Record<Asset['type'], number> {
  // Keep it simple but observable: subRole + bias changes distribution.
  const base: Record<Asset['type'], number> =
    subRole === 'algorithm'
      ? { tag: 1, crowd_template: 2, feature_pack: 4, model: 5 }
      : { tag: 4, crowd_template: 5, feature_pack: 2, model: 1 };

  const bump = (key: Asset['type'], by: number) => {
    base[key] = clamp((base[key] ?? 1) + by, 1, 99);
  };

  if (bias === 'tag') bump('tag', 6);
  if (bias === 'crowd') bump('crowd_template', 6);
  if (bias === 'model') bump('model', 6);
  if (bias === 'pack') bump('feature_pack', 6);

  return base;
}

function weightedPickUnique<T>(
  items: T[],
  getWeight: (item: T) => number,
  rand: () => number,
  count: number
): T[] {
  const pool = items.slice();
  const out: T[] = [];
  while (pool.length > 0 && out.length < count) {
    const weights = pool.map((x) => Math.max(0, getWeight(x)));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) {
      out.push(pool.shift() as T);
      continue;
    }
    let r = rand() * total;
    let pickedIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i]!;
      if (r <= 0) {
        pickedIdx = i;
        break;
      }
    }
    out.push(pool.splice(pickedIdx, 1)[0] as T);
  }
  return out;
}

function buildRecommendMeta(asset: Asset, subRole: ConsumerSubRole): RecommendMeta {
  const scene = asset.domain === 'ecommerce' || asset.domain === 'ecom' ? '电商' : asset.domain === 'lifestyle' || asset.domain === 'local' ? '生服' : '跨域';
  const goal = subRole === 'algorithm' ? '提升泛化' : '拉新客';
  // Stable mock numbers derived from id.
  const seed = hashString(`${asset.id}_${subRole}`);
  const rnd = mulberry32(seed);
  const sceneSimilarity = 0.55 + rnd() * 0.4;
  const goalLift = 0.08 + rnd() * 0.22;
  return { sceneSimilarity: clamp(sceneSimilarity, 0, 1), goalLift: clamp(goalLift, 0, 1), scene, goal };
}

// Mock POST /api/recommend
export async function postRecommend(req: RecommendRequest): Promise<RecommendResponse> {
  void buildRecommendUrl();
  await new Promise((resolve) => window.setTimeout(resolve, 240));

  const limit = clamp(req.limit ?? 6, 1, 12);
  const seed = hashString(`${req.subRole}_${req.recommendBias}_${req.featureClass}`);
  const rand = mulberry32(seed);
  const weights = typeWeightFor(req.subRole, req.recommendBias);

  const candidates = mockAssets
    .filter((a) => (req.featureClass === 'all' ? true : normalizeFeatureClass(a) === req.featureClass))
    .filter((a) => typeof a.subs === 'number'); // keep stable ordering

  const picked = weightedPickUnique(
    candidates,
    (a) => (weights[a.type] ?? 1) * (1 + (a.heat ?? a.subs) / 100),
    rand,
    limit
  );

  return {
    success: true,
    items: picked.map((asset) => ({
      asset: { ...asset, isAIRecommended: true },
      recommendMeta: buildRecommendMeta(asset, req.subRole),
    })),
  };
}

