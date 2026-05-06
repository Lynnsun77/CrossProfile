import { fieldKeys, toolKeys } from '../lib/runtimeTokens';

export const AGENT_TOOLS = {
  [toolKeys.recommendAsset]: { line: 1, inputs: ['goal'] },
  [toolKeys.recommendCrowd]: { line: 1, inputs: [fieldKeys.assetId] },
  [toolKeys.recommendAction]: { line: 1, inputs: [fieldKeys.crowdId] },
  [toolKeys.recommendPack]: { line: 2, inputs: ['algo_domain', 'metric', 'delta'] },
  [toolKeys.evaluateFeature]: { line: 2, inputs: [fieldKeys.featureId] },
  [toolKeys.recommendOpportunity]: { line: 3, inputs: [] },
} as const;
