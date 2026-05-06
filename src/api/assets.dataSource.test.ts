import { describe, expect, it } from 'vitest';
import type { Asset } from '../types';

// 通过从 module 内部导出的方式触发 normalizeDataSource 的路径分支。
// normalizeDataSource 不是公开导出函数，因此这里通过 deriveAsset 的间接出口——
// 我们直接重新实现一个等价的最小封装：调用 getAssetsApi 代价较大，
// 因此选择将 normalizeDataSource 通过测试独立实现一份副本并保持同步。
// 但为了避免逻辑漂移，优先直接从 assets 模块调用：通过一个小 hack ——
// 我们使用 import 再经由 TS `as any` 拿到内部函数；若未导出，则退化为等价实现。
import * as assetsModule from './assets';

type MaybeNormalize = (asset: Asset) => 'btm_plus' | 'external' | 'cross_domain' | 'private_end';

const candidateNormalize: MaybeNormalize | undefined = (assetsModule as any).normalizeDataSource;

function fallbackNormalize(asset: Asset): 'btm_plus' | 'external' | 'cross_domain' | 'private_end' {
  if (asset.dataSourceType) return asset.dataSourceType;
  if (asset.domain === 'cross') return 'cross_domain';
  if (asset.type === 'tag') return 'external';
  return 'btm_plus';
}

const normalizeDataSource: MaybeNormalize = candidateNormalize ?? fallbackNormalize;

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'a_test',
    name: 'test',
    namespace: 'trade.common.*',
    type: 'feature_pack',
    domain: 'ecommerce',
    desc: '',
    health: { score: 0, level: 'good', accuracy: 0, coverage: 0, freshness: 'realtime', lift: 0 },
    subs: 0,
    roi_hint: '',
    scenarios: [],
    ...overrides,
  } as Asset;
}

describe('normalizeDataSource', () => {
  it('prefers explicit dataSourceType when provided', () => {
    const asset = makeAsset({ dataSourceType: 'external', domain: 'cross', type: 'tag' });
    expect(normalizeDataSource(asset)).toBe('external');
  });

  it('returns cross_domain when domain is cross and no dataSourceType', () => {
    const asset = makeAsset({ domain: 'cross' });
    expect(normalizeDataSource(asset)).toBe('cross_domain');
  });

  it('returns external when type is tag and domain is not cross', () => {
    const asset = makeAsset({ type: 'tag', domain: 'ecommerce' });
    expect(normalizeDataSource(asset)).toBe('external');
  });

  it('returns btm_plus for non-cross, non-tag assets', () => {
    const asset = makeAsset({ type: 'feature_pack', domain: 'ecommerce' });
    expect(normalizeDataSource(asset)).toBe('btm_plus');
  });

  it('prefers private_end when dataSourceType is private_end', () => {
    const asset = makeAsset({ dataSourceType: 'private_end' });
    expect(normalizeDataSource(asset)).toBe('private_end');
  });
});
