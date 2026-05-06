import type { AgentStep } from '../types';
import { buildAssetId, fieldKeys, toolKeys } from '../lib/runtimeTokens';

export const agentScript: AgentStep[] = [
  { step: 1, user: '帮我找能在 [{{scene}}] 提升 [{{goal}}] 的特征/人群/标签' },
  {
    step: 2,
    tool: toolKeys.recommendCrowd,
    toolStatus: 'loading',
    toolText: '正在思考历史特征策略匹配度…',
  },
  {
    step: 3,
    tool: toolKeys.evaluateFeature,
    toolStatus: 'loading',
    toolText: '找到历史符合 [{{goal}}]、[{{scene}}] 的特征,正在统计历史收益…',
  },
  {
    step: 4,
    tool: toolKeys.recommendAsset,
    toolStatus: 'done',
    toolText: '为你推荐「{{assetName}}」特征资产',
    toolOutput: { [fieldKeys.assetId]: buildAssetId(4) },
  },
  {
    step: 5,
    assistant: '帮你找到「{{assetName}}」等三个卡片, 规模 124 万，历史收益 ¥340 万',
    recommendAssetIds: [buildAssetId(4), buildAssetId(1), buildAssetId(10)],
  },
];
