import type { ConsumerSubRole } from '../store/globalState';
import type { Asset } from '../types';
import { buildAssetId } from '../lib/runtimeTokens';
import { mockAssets } from './index';
import type { PlatformRecommendationTabKey } from '../features/hero-recommend/types';

export type MarketAgentPhase = 'idle' | 'sending' | 'thinking' | 'streaming_cards' | 'done';

export type MarketTraceNodeCode =
  | 'request_received'
  | 'understand_goal'
  | 'match_scene'
  | 'inspect_supply'
  | 'score_uplift'
  | 'compose_cards'
  | 'final_review';

export type MarketTraceNode = {
  code: MarketTraceNodeCode;
  icon: string;
  label: string;
  description: string;
};

export const MARKET_TRACE_DICTIONARY: Record<MarketTraceNodeCode, MarketTraceNode> = {
  request_received: {
    code: 'request_received',
    icon: '1',
    label: '接收需求',
    description: '校验输入的目标、场景与筛选上下文',
  },
  understand_goal: {
    code: 'understand_goal',
    icon: '2',
    label: '理解目标',
    description: '抽取核心业务指标与预期 uplift',
  },
  match_scene: {
    code: 'match_scene',
    icon: '3',
    label: '匹配场景',
    description: '结合行业场景和历史策略信号做初筛',
  },
  inspect_supply: {
    code: 'inspect_supply',
    icon: '4',
    label: '扫描资产供给',
    description: '比对资产质量、时效、订阅热度与覆盖范围',
  },
  score_uplift: {
    code: 'score_uplift',
    icon: '5',
    label: '测算收益',
    description: '按 mock 历史效果估算潜在提升空间',
  },
  compose_cards: {
    code: 'compose_cards',
    icon: '6',
    label: '整理推荐卡',
    description: '收敛理由、理由摘要与 CTA 展示顺序',
  },
  final_review: {
    code: 'final_review',
    icon: '7',
    label: '输出结果',
    description: '完成脱敏检查与最终排序',
  },
};

export const MARKET_TRACE_FLOW: MarketTraceNodeCode[] = [
  'request_received',
  'understand_goal',
  'match_scene',
  'inspect_supply',
  'score_uplift',
  'compose_cards',
  'final_review',
];

export const MARKET_RECOMMEND_IDS: Record<ConsumerSubRole, string[]> = {
  business: [buildAssetId(4), buildAssetId(15), buildAssetId(20)],
  algorithm: [buildAssetId(16), buildAssetId(17), buildAssetId(18)],
};

export const MARKETPLACE_PLATFORM_TAB_IDS: Record<PlatformRecommendationTabKey, string[]> = {
  owned_tags: mockAssets
    .filter((asset) => asset.type === 'tag' && asset.dataSourceType !== 'external')
    .slice(0, 6)
    .map((asset) => asset.id),
  recent_hot: [...mockAssets]
    .sort((a, b) => (b.heat ?? b.subs ?? 0) - (a.heat ?? a.subs ?? 0))
    .slice(0, 6)
    .map((asset) => asset.id),
};

export const MARKET_ROLE_COPY: Record<ConsumerSubRole, { title: string; subtitle: string; helper: string }> = {
  business: {
    title: '智能推荐',
    subtitle: '工作台驱动的消费视角入口，统一收口到 AI 推荐、折叠筛选与资产流。',
    helper: '更适合围绕 GMV、拉新、召回等业务目标快速找可直接使用的资产。',
  },
  algorithm: {
    title: '智能推荐',
    subtitle: '工作台驱动的算法入口，围绕特征复用、收益评估与资产健康统一收口。',
    helper: '更适合先确认场景目标，再查看特征包、模型与高复用资产。',
  },
};

export function getMarketplaceRecommendations(role: ConsumerSubRole): Array<Asset & { isAIRecommended: true }> {
  const ids = MARKET_RECOMMEND_IDS[role];
  return ids
    .map((id) => mockAssets.find((asset) => asset.id === id))
    .filter((asset): asset is Asset => Boolean(asset))
    .slice(0, 3)
    .map((asset) => ({ ...asset, isAIRecommended: true as const }));
}

export function getMarketplacePlatformRecommendations(tabKey: PlatformRecommendationTabKey): Asset[] {
  const ids = MARKETPLACE_PLATFORM_TAB_IDS[tabKey] ?? [];
  return ids
    .map((id) => mockAssets.find((asset) => asset.id === id))
    .filter((asset): asset is Asset => Boolean(asset));
}
