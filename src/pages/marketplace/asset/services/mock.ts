import { getAssetApi, type DerivedAsset } from '../../../../api/assets';
import { buildAssetId } from '../../../../lib/runtimeTokens';
import type { AssetDetailIdentity, AssetDetailMockData, AssetDetailQueryState } from '../types';
import { buildAssetDetailFixture } from './fixtures';

const FALLBACK_ASSET_ID = buildAssetId(1);

export class AssetDetailMockError extends Error {
  status: 401 | 403 | 404 | 500;

  constructor(status: 401 | 403 | 404 | 500, message: string) {
    super(message);
    this.name = 'AssetDetailMockError';
    this.status = status;
  }
}

function normalizeAssetId(input: string | undefined) {
  if (!input) return FALLBACK_ASSET_ID;
  return input.replace(/-/g, '_');
}

function buildIdentity(asset: DerivedAsset): AssetDetailIdentity {
  return {
    assetId: asset.id,
    displayName: asset.nameBiz || asset.name || asset.id,
    technicalName: asset.nameAlgo || asset.namespace,
    summary: asset.description || asset.desc || '诊断详情页骨架阶段：后续将在此补齐定义、质量、试算与订阅决策信息。',
    scenarios: asset.scenarios || [],
  };
}

function maybeThrowMockError(query: AssetDetailQueryState) {
  const explicit = query.mockError;
  if (explicit && explicit !== 'random') {
    const status = Number(explicit) as 401 | 403 | 404 | 500;
    throw new AssetDetailMockError(status, `mock ${explicit} error`);
  }

  if (explicit === 'random' || query.chaos) {
    const shouldThrow = explicit === 'random' ? true : Math.random() < 0.05;
    if (shouldThrow) {
      const statuses: Array<401 | 403 | 500> = [401, 403, 500];
      const status = statuses[Math.floor(Math.random() * statuses.length)]!;
      throw new AssetDetailMockError(status, `chaos mock ${status}`);
    }
  }
}

export async function getAssetDetailMockData(
  rawAssetId: string | undefined,
  query: AssetDetailQueryState,
): Promise<AssetDetailMockData> {
  maybeThrowMockError(query);
  const normalizedId = normalizeAssetId(rawAssetId);
  const [asset, compareAssetA, compareAssetB] = await Promise.all([
    getAssetApi(normalizedId),
    getAssetApi(buildAssetId(2)),
    getAssetApi(buildAssetId(3)),
  ]);
  const resolvedAsset = rawAssetId ? asset : asset || (await getAssetApi(FALLBACK_ASSET_ID));

  if (!resolvedAsset) {
    throw new AssetDetailMockError(404, '未找到资产详情 mock 数据');
  }

  const compareAssets = [compareAssetA, compareAssetB].filter(Boolean) as DerivedAsset[];

  return {
    asset: resolvedAsset,
    identity: buildIdentity(resolvedAsset),
    query,
    ...buildAssetDetailFixture(resolvedAsset, query, compareAssets),
  };
}
