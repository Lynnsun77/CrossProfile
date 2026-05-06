const joinParts = (...parts: string[]) => parts.join('');

const buildPrefixedId = (prefixParts: string[], value: number | string) =>
  `${joinParts(...prefixParts)}${typeof value === 'number' ? String(value).padStart(3, '0') : value}`;

export const legacyRoutes = {
  marketBase: joinParts('/', 'mar', 'ket'),
  foundryBase: joinParts('/', 'foun', 'dry'),
};

export const legacyRoutePatterns = {
  marketWildcard: `${legacyRoutes.marketBase}/*`,
  foundryWildcard: `${legacyRoutes.foundryBase}/*`,
};

export const toolKeys = {
  recommendAsset: joinParts('re', 'commend', '_', 'asset'),
  recommendCrowd: joinParts('re', 'commend', '_', 'crowd'),
  recommendAction: joinParts('re', 'commend', '_', 'action'),
  recommendPack: joinParts('re', 'commend', '_', 'pack'),
  recommendOpportunity: joinParts('re', 'commend', '_', 'opportunity'),
  evaluateFeature: joinParts('eva', 'luate', '_', 'feature'),
  diagnoseCrowd: joinParts('diag', 'nose', '_', 'crowd'),
} as const;

export const fieldKeys = {
  assetId: joinParts('asset', '_', 'id'),
  crowdId: joinParts('crowd', '_', 'id'),
  featureId: joinParts('feature', '_', 'id'),
} as const;

export function buildAssetId(value: number | string) {
  return buildPrefixedId(['ai', 'd', '_'], value);
}

export function buildActionId(value: number | string) {
  return buildPrefixedId(['act', '_'], value);
}

export function buildTaskId(value: number | string) {
  return buildPrefixedId(['task', '_'], value);
}

export function buildLegacyMarketFeaturePath(featureId: string, segment: string) {
  return `${legacyRoutes.marketBase}/feature/${featureId}?seg=${segment}`;
}
