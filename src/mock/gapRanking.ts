import type { Domain } from '../types';

export interface GapRankingItem {
  id: string;
  title: string;
  domain: Domain;
  // 0-100, larger means bigger demand gap.
  gapScore: number;
  // Demand volume (arbitrary unit) to make the list feel realistic.
  demand: number;
}

// Deterministic mock for GET /api/gap-ranking.
export const mockGapRanking: GapRankingItem[] = [
  { id: 'gap_001', title: '跨域券投放 · 新客拉新', domain: 'cross', gapScore: 92, demand: 4800 },
  { id: 'gap_002', title: '电商复购 · 高价值回流', domain: 'ecommerce', gapScore: 88, demand: 4100 },
  { id: 'gap_003', title: '生服到店 · 周末高峰引流', domain: 'lifestyle', gapScore: 84, demand: 3600 },
  { id: 'gap_004', title: '跨域会员 · 分层运营', domain: 'cross', gapScore: 81, demand: 3200 },
  { id: 'gap_005', title: '电商优惠 · 券敏感分层', domain: 'ecommerce', gapScore: 78, demand: 2900 },
  { id: 'gap_006', title: '生服配送 · 履约风险预警', domain: 'lifestyle', gapScore: 73, demand: 2500 },
  { id: 'gap_007', title: '跨域活动 · 组合购偏好', domain: 'cross', gapScore: 69, demand: 2100 },
  { id: 'gap_008', title: '电商直播 · 观看转化提升', domain: 'ecommerce', gapScore: 66, demand: 1900 },
];

