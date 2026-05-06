import type {
  ActionConfig,
  Asset,
  Crowd,
  CrowdDetail,
  DispatchTask,
  Feature,
  FeaturePack,
  KpiPoint,
  Opportunity,
} from '../types';
import assetsJson from './assets.json';
import crowdsJson from './crowds.json';
import featuresJson from './features.json';
import packsJson from './packs.json';
import kpiJson from './kpi.json';
import oppsJson from './opps.json';
import { agentScript } from './agentScript';
import { buildActionId, buildAssetId, buildTaskId } from '../lib/runtimeTokens';
import {
  crowdDetailsById,
  defaultCrowdDetail,
  getCrowdDetailById,
  mockCrowdDetails,
} from './crowdDetails';

export interface AgentScriptStep {
  step: number;
  user?: string;
  assistant?: string;
  tool?: string;
  toolOutput?: Record<string, unknown>;
}

export const mockAssets = assetsJson as Asset[];
export const mockCrowds = crowdsJson as Crowd[];
export const mockFeatures = featuresJson as Feature[];
export const mockPacks = packsJson as FeaturePack[];
export const mockKpis = kpiJson as KpiPoint[];
export const mockOpportunities = oppsJson as Opportunity[];
export const mockAgentScript = agentScript;
export const mockCrowdDetailsMap = crowdDetailsById;
export { defaultCrowdDetail, getCrowdDetailById, mockCrowdDetails };

export const mockActionConfigs: ActionConfig[] = [
  {
    id: buildActionId(1),
    crowd_id: buildAssetId(5),
    channel: 'coupon',
    estimatedGmv: 680000,
    estimatedMac: -0.06,
    touchpoints: ['push', 'ecommerce_coupon'],
    subsidy_level: 'mid',
    budget: 320000,
    copywriting_choice: '跨域领券立减',
    channels: ['ldmp', 'policy_platform'],
  },
  {
    id: buildActionId(2),
    crowd_id: buildAssetId(8),
    channel: 'push',
    estimatedGmv: 420000,
    estimatedMac: -0.04,
    touchpoints: ['push', 'lifestyle_home'],
    subsidy_level: 'low',
    budget: 180000,
    copywriting_choice: '回流专享福利',
    channels: ['ldmp', 'money_eff'],
  },
  {
    id: buildActionId(3),
    crowd_id: buildAssetId(4),
    channel: 'coupon',
    estimatedGmv: 820000,
    estimatedMac: -0.08,
    touchpoints: ['push', 'ecommerce_coupon'],
    subsidy_level: 'high',
    budget: 520000,
    copywriting_choice: '复购专属加码券',
    channels: ['ecommerce_dmp', 'policy_platform', 'api'],
  },
];

export const mockDispatchTasks: DispatchTask[] = [
  {
    id: buildTaskId(1),
    crowdId: buildAssetId(4),
    actionId: buildActionId(3),
    title: '电商复购人群模板 x 复购专属加码券',
    created_at: '2026-04-22 10:30',
    crowd_size: 1240000,
    channels: ['ecommerce_dmp', 'policy_platform'],
    status: 'queued',
  },
  {
    id: buildTaskId(2),
    crowdId: buildAssetId(5),
    actionId: buildActionId(1),
    title: '统一交易用户画像 x 跨域领券立减',
    created_at: '2026-04-22 09:45',
    crowd_size: 1280000,
    channels: ['ldmp', 'policy_platform'],
    status: 'running',
  },
  {
    id: buildTaskId(3),
    crowdId: buildAssetId(8),
    actionId: buildActionId(2),
    title: '跨域流失预警人群 x 回流专享福利',
    created_at: '2026-04-21 16:10',
    crowd_size: 960000,
    channels: ['ldmp', 'money_eff'],
    status: 'done',
    result: {
      gmv_lift: 0.024,
      mac_change: -0.067,
      cvr: 0.019,
    },
  },
];

export function getAssetById(id: string) {
  return mockAssets.find((asset) => asset.id === id) ?? mockAssets[0];
}

export function getCrowdByAssetId(assetId: string) {
  return mockCrowds.find((crowd) => crowd.asset_id === assetId) ?? mockCrowds[0];
}

export function getDefaultCrowdDetail(): CrowdDetail {
  return defaultCrowdDetail;
}

export function getPackById(id: string) {
  return mockPacks.find((pack) => pack.id === id) ?? mockPacks[0];
}

export function getFeatureById(id: string) {
  return mockFeatures.find((feature) => feature.id === id) ?? mockFeatures[0];
}

export function getOpportunityById(id: string) {
  return mockOpportunities.find((opp) => opp.id === id) ?? mockOpportunities[0];
}
