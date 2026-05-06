import type {
  DemandGap,
  DemandHeatmapCell,
  DemandScenario,
  DrilldownQualityAttributionAnalysis,
  DrilldownRootCauseItem,
  DrilldownSegmentAccuracy,
  EvaluationMetric,
  FactoryPipelineRunStatus,
  FactoryPipelineRunWithFeature,
  Feature,
  FeatureDomain,
  FusionEvaluationResult,
  FusionEvaluationRun,
  FusionGraphData,
  FusionGraphNode,
  FusionQualityCompareRow,
  FusionRelation,
  ProducerDashboardPipelineOverview,
  ProducerDashboardSupplyCoverage,
  ProducerRevenueLoop,
  QualityHealthHeatmapPoint,
  QualityHealthStatus,
  QualitySnapshot,
  UnmatchedQueryRankingItem,
} from '../types';
import { DEMAND_SCENARIOS, FEATURE_TYPE_TO_FACTORY_LABEL_MAP } from '../types';
import { getFactoryGanttRows, getFactoryPipelineOverview } from './factory';
import { mockFeatures } from './index';
import {
  getGovernanceTickets,
  getQualityAttributionKpis,
  getQualityFeatureAttributionDetail,
  getQualityHealthList,
  getQualityHeatmapPoints,
  getQualityTrend,
  getQualityValueRanking,
} from './quality';

type GapMutationInput = {
  operatorUserId: string;
  operatorUserName: string;
  operatorTeamName: string;
};

type FusionEvaluationSeed = {
  summary: string;
  overallScore: number;
  decision: FusionEvaluationResult['decision'];
  dimensions: EvaluationMetric[];
  comparedFeatureIds: string[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function inferFeatureDomain(feature: Feature): FeatureDomain {
  if (feature.domain) return feature.domain;
  if (feature.namespace.includes('ecommerce')) return 'transaction';
  if (feature.namespace.includes('lifestyle')) return 'content_profile';
  return 'cross_domain';
}

function inferHealthStatus(score: number): QualityHealthStatus {
  if (score >= 85) return 'healthy';
  if (score >= 70) return 'warning';
  return 'critical';
}

function sum<T>(items: T[], mapper: (item: T) => number) {
  return items.reduce((total, item) => total + mapper(item), 0);
}

const heatmapDomains: FeatureDomain[] = ['transaction', 'content_profile', 'cross_domain'];

const producerGapSeeds: DemandGap[] = [
  {
    id: 'gap_001',
    title: '大促拉新高意图标签缺口',
    source: 'ai_discovery',
    status: 'open',
    priority: 'high',
    requestedByTeam: '增长运营',
    relatedDomain: 'transaction',
    expectedBusinessValue: 128,
    claimedByUserId: null,
    dueAt: '2026-05-08T00:00:00.000Z',
    scenario: '拉新',
    queryText: '大促新客高转化意图',
    unmetQueryCount: 420,
    relatedFeatureIds: [],
    rootCauseType: 'missing_feature',
  },
  {
    id: 'gap_002',
    title: '内容冷启促活序列特征补齐',
    source: 'consumer_feedback',
    status: 'claimed',
    priority: 'high',
    requestedByTeam: '内容运营',
    relatedDomain: 'content_profile',
    expectedBusinessValue: 96,
    claimedByUserId: 'user_producer_006',
    dueAt: '2026-05-03T00:00:00.000Z',
    scenario: '促活',
    queryText: '内容冷启活跃用户序列',
    unmetQueryCount: 310,
    relatedFeatureIds: ['feat_006'],
    claimedByUserName: '林川',
    claimedByTeamName: '内容供给组',
    rootCauseType: 'quality',
  },
  {
    id: 'gap_003',
    title: '跨域召回稳定人群识别',
    source: 'sales_request',
    status: 'planning',
    priority: 'mid',
    requestedByTeam: '本地生活增长',
    relatedDomain: 'cross_domain',
    expectedBusinessValue: 88,
    claimedByUserId: 'user_producer_010',
    dueAt: '2026-05-12T00:00:00.000Z',
    scenario: '召回',
    queryText: '跨域流失召回稳定识别',
    unmetQueryCount: 260,
    relatedFeatureIds: ['feat_010', 'feat_021'],
    claimedByUserName: '沈墨',
    claimedByTeamName: '跨域供给组',
    rootCauseType: 'fusion',
  },
  {
    id: 'gap_004',
    title: '结算页转化风险预估特征',
    source: 'strategy_project',
    status: 'in_progress',
    priority: 'high',
    requestedByTeam: '交易产品',
    relatedDomain: 'transaction',
    expectedBusinessValue: 142,
    claimedByUserId: 'user_producer_001',
    dueAt: '2026-05-06T00:00:00.000Z',
    scenario: '转化',
    queryText: '结算页流失风险预估',
    unmetQueryCount: 380,
    relatedFeatureIds: ['feat_001', 'feat_012'],
    claimedByUserName: '李四',
    claimedByTeamName: '特征供给一组',
    rootCauseType: 'pipeline',
  },
  {
    id: 'gap_005',
    title: '会员成长值分层标签升级',
    source: 'governance',
    status: 'completed',
    priority: 'mid',
    requestedByTeam: '会员运营',
    relatedDomain: 'transaction',
    expectedBusinessValue: 74,
    claimedByUserId: 'user_producer_012',
    dueAt: '2026-04-30T00:00:00.000Z',
    scenario: '会员运营',
    queryText: '会员成长值精细分层',
    unmetQueryCount: 150,
    relatedFeatureIds: ['feat_012'],
    claimedByUserName: '姚远',
    claimedByTeamName: '交易供给组',
    rootCauseType: 'quality',
  },
  {
    id: 'gap_006',
    title: '短视频内容推荐兴趣向量缺口',
    source: 'ai_discovery',
    status: 'open',
    priority: 'high',
    requestedByTeam: '内容推荐',
    relatedDomain: 'content_profile',
    expectedBusinessValue: 117,
    claimedByUserId: null,
    dueAt: '2026-05-10T00:00:00.000Z',
    scenario: '内容推荐',
    queryText: '短视频高消费兴趣向量',
    unmetQueryCount: 405,
    relatedFeatureIds: ['feat_034'],
    rootCauseType: 'quality',
  },
  {
    id: 'gap_007',
    title: '商家经营流失预警融合特征',
    source: 'consumer_feedback',
    status: 'claimed',
    priority: 'mid',
    requestedByTeam: '商家运营',
    relatedDomain: 'cross_domain',
    expectedBusinessValue: 91,
    claimedByUserId: 'user_producer_admin_001',
    dueAt: '2026-05-09T00:00:00.000Z',
    scenario: '商家经营',
    queryText: '商家履约波动与流失预警',
    unmetQueryCount: 240,
    relatedFeatureIds: ['feat_021', 'feat_034'],
    claimedByUserName: '王五',
    claimedByTeamName: '特征供给平台主管',
    rootCauseType: 'fusion',
  },
  {
    id: 'gap_008',
    title: '跨域拉新人群首单预测',
    source: 'sales_request',
    status: 'open',
    priority: 'high',
    requestedByTeam: '电商策略',
    relatedDomain: 'cross_domain',
    expectedBusinessValue: 134,
    claimedByUserId: null,
    dueAt: '2026-05-14T00:00:00.000Z',
    scenario: '拉新',
    queryText: '跨域首单预测标签',
    unmetQueryCount: 460,
    relatedFeatureIds: [],
    rootCauseType: 'missing_feature',
  },
];

const unmatchedQuerySeeds: UnmatchedQueryRankingItem[] = [
  {
    id: 'unmatched_001',
    queryText: '大促新客高转化意图',
    scenario: '拉新',
    domain: 'transaction',
    source: 'ai_discovery',
    searchCount: 420,
    weeklyDelta: 0.28,
    relatedGapIds: ['gap_001'],
  },
  {
    id: 'unmatched_002',
    queryText: '内容冷启活跃用户序列',
    scenario: '促活',
    domain: 'content_profile',
    source: 'consumer_feedback',
    searchCount: 310,
    weeklyDelta: 0.16,
    relatedGapIds: ['gap_002'],
  },
  {
    id: 'unmatched_003',
    queryText: '跨域流失召回稳定识别',
    scenario: '召回',
    domain: 'cross_domain',
    source: 'sales_request',
    searchCount: 260,
    weeklyDelta: 0.11,
    relatedGapIds: ['gap_003'],
  },
  {
    id: 'unmatched_004',
    queryText: '结算页流失风险预估',
    scenario: '转化',
    domain: 'transaction',
    source: 'strategy_project',
    searchCount: 380,
    weeklyDelta: 0.21,
    relatedGapIds: ['gap_004'],
  },
  {
    id: 'unmatched_005',
    queryText: '会员成长值精细分层',
    scenario: '会员运营',
    domain: 'transaction',
    source: 'governance',
    searchCount: 150,
    weeklyDelta: -0.08,
    relatedGapIds: ['gap_005'],
  },
  {
    id: 'unmatched_006',
    queryText: '短视频高消费兴趣向量',
    scenario: '内容推荐',
    domain: 'content_profile',
    source: 'ai_discovery',
    searchCount: 405,
    weeklyDelta: 0.24,
    relatedGapIds: ['gap_006'],
  },
  {
    id: 'unmatched_007',
    queryText: '商家履约波动与流失预警',
    scenario: '商家经营',
    domain: 'cross_domain',
    source: 'consumer_feedback',
    searchCount: 240,
    weeklyDelta: 0.09,
    relatedGapIds: ['gap_007'],
  },
  {
    id: 'unmatched_008',
    queryText: '跨域首单预测标签',
    scenario: '拉新',
    domain: 'cross_domain',
    source: 'sales_request',
    searchCount: 460,
    weeklyDelta: 0.33,
    relatedGapIds: ['gap_008'],
  },
  {
    id: 'unmatched_009',
    queryText: '商家新店成长潜力分层',
    scenario: '商家经营',
    domain: 'transaction',
    source: 'ai_discovery',
    searchCount: 210,
    weeklyDelta: 0.14,
    relatedGapIds: [],
  },
  {
    id: 'unmatched_010',
    queryText: '内容付费召回高价值预测',
    scenario: '召回',
    domain: 'content_profile',
    source: 'strategy_project',
    searchCount: 198,
    weeklyDelta: 0.12,
    relatedGapIds: [],
  },
];

const fusionRelationsStore: FusionRelation[] = [
  {
    id: 'fusion_001',
    sourceFeatureId: 'feat_021',
    targetFeatureId: 'feat_001',
    relationType: 'derived_from',
    confidence: 0.91,
    note: '跨域召回主特征派生出交易拉新规则。',
    createdAt: '2026-04-18T10:00:00.000Z',
  },
  {
    id: 'fusion_002',
    sourceFeatureId: 'feat_001',
    targetFeatureId: 'feat_012',
    relationType: 'paired_with',
    confidence: 0.86,
    note: '交易规则与会员成长值特征常被组合消费。',
    createdAt: '2026-04-19T08:30:00.000Z',
  },
  {
    id: 'fusion_003',
    sourceFeatureId: 'feat_034',
    targetFeatureId: 'feat_006',
    relationType: 'paired_with',
    confidence: 0.84,
    note: '兴趣向量与内容过滤规则联合提升内容促活。',
    createdAt: '2026-04-20T11:20:00.000Z',
  },
  {
    id: 'fusion_004',
    sourceFeatureId: 'feat_010',
    targetFeatureId: 'feat_021',
    relationType: 'overlaps_with',
    confidence: 0.78,
    note: '跨域召回链路存在部分样本重叠。',
    createdAt: '2026-04-22T15:00:00.000Z',
  },
  {
    id: 'fusion_005',
    sourceFeatureId: 'feat_003',
    targetFeatureId: 'feat_012',
    relationType: 'replaces',
    confidence: 0.73,
    note: '新版会员分层可替代部分旧策略组合。',
    createdAt: '2026-04-21T14:10:00.000Z',
  },
  {
    id: 'fusion_006',
    sourceFeatureId: 'feat_008',
    targetFeatureId: 'feat_001',
    relationType: 'overlaps_with',
    confidence: 0.81,
    note: '电商策略排序与拉新规则共享核心交易信号。',
    createdAt: '2026-04-17T09:45:00.000Z',
  },
  {
    id: 'fusion_007',
    sourceFeatureId: 'feat_012',
    targetFeatureId: 'feat_021',
    relationType: 'paired_with',
    confidence: 0.83,
    note: '会员成长值与跨域召回特征形成高价值组合。',
    createdAt: '2026-04-23T13:00:00.000Z',
  },
];

let demandGapStore = producerGapSeeds.map((gap) => clone(gap));
let fusionRunSequence = 0;
const fusionRunStore = new Map<string, FusionEvaluationRun>();
const fusionResultStore = new Map<string, FusionEvaluationResult>();

function getFeatureById(featureId: string): Feature | null {
  return mockFeatures.find((feature) => feature.id === featureId) ?? null;
}

function getLatestSnapshotMap() {
  return new Map(getQualityHealthList().map((item) => [item.featureId, item.latestSnapshot]));
}

function getRankingMap() {
  return new Map(getQualityValueRanking().map((item) => [item.featureId, item]));
}

function getPipelineRunsMap() {
  const grouped = new Map<string, FactoryPipelineRunWithFeature[]>();
  for (const run of getFactoryGanttRows('all')) {
    const list = grouped.get(run.featureId) ?? [];
    list.push(run);
    grouped.set(run.featureId, list);
  }
  return grouped;
}

function getLatestPipelineRun(featureId: string): FactoryPipelineRunWithFeature | null {
  const runs = getPipelineRunsMap().get(featureId) ?? [];
  if (!runs.length) return null;
  return runs
    .slice()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] ?? null;
}

function buildSnapshotFromFeature(feature: Feature): QualitySnapshot {
  const score = feature.health.score;
  const accuracyRate = typeof feature.health.accuracy === 'number' ? feature.health.accuracy : 0.8;
  const coverageRate = typeof feature.health.coverage === 'number' ? feature.health.coverage : 0.8;

  return {
    id: `${feature.id}_snapshot_fallback`,
    featureId: feature.id,
    snapshotAt: '2026-04-25T10:00:00.000Z',
    score,
    freshnessHours: feature.health.freshness === 'T+7' ? 72 : feature.health.freshness === 'T+1' ? 24 : 2,
    coverageRate,
    stabilityRate: Number(Math.max(accuracyRate - 0.04, 0.62).toFixed(2)),
    latestAlertType: null,
    latestAlertMessage: null,
    status: inferHealthStatus(score),
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: inferFeatureDomain(feature),
  };
}

function buildProducerFeature(featureId: string): Feature | null {
  const factoryRun = getLatestPipelineRun(featureId);
  if (factoryRun?.feature) {
    const snapshot = getLatestSnapshotMap().get(featureId) ?? factoryRun.feature.latestQualitySnapshot ?? null;
    const ranking = getRankingMap().get(featureId);
    return {
      ...clone(factoryRun.feature),
      latestQualitySnapshot: snapshot ? clone(snapshot) : factoryRun.feature.latestQualitySnapshot ?? null,
      attributionSummary: ranking
        ? {
            totalConsumptionTeams: ranking.totalConsumptionTeams,
            totalTriggeredRevenue: ranking.totalRevenue,
            topConsumerTeamName: ranking.ownerTeamName,
            lastConsumptionAt: '2026-04-25T10:00:00.000Z',
          }
        : factoryRun.feature.attributionSummary ?? null,
    };
  }

  const baseFeature = getFeatureById(featureId);
  if (!baseFeature) return null;

  const snapshot = getLatestSnapshotMap().get(featureId) ?? buildSnapshotFromFeature(baseFeature);
  const ranking = getRankingMap().get(featureId);
  return {
    ...clone(baseFeature),
    domain: inferFeatureDomain(baseFeature),
    updateFrequency: baseFeature.health.freshness === 'T+7' ? 'weekly' : baseFeature.health.freshness === 'realtime' ? 'realtime' : 'daily',
    latestQualitySnapshot: clone(snapshot),
    attributionSummary: ranking
      ? {
          totalConsumptionTeams: ranking.totalConsumptionTeams,
          totalTriggeredRevenue: ranking.totalRevenue,
          topConsumerTeamName: ranking.ownerTeamName,
          lastConsumptionAt: '2026-04-25T10:00:00.000Z',
        }
      : null,
  };
}

function demandStatusWeight(status: DemandGap['status']) {
  if (status === 'open') return 5;
  if (status === 'claimed') return 4;
  if (status === 'in_progress') return 3;
  if (status === 'planning') return 2;
  if (status === 'completed') return 1;
  return 0;
}

function buildHeatmapCell(scenario: DemandScenario, domain: FeatureDomain): DemandHeatmapCell {
  const gaps = demandGapStore.filter((gap) => gap.scenario === scenario && gap.relatedDomain === domain);
  const queries = unmatchedQuerySeeds.filter((item) => item.scenario === scenario && item.domain === domain);

  return {
    scenario,
    domain,
    demandCount: gaps.length + queries.length,
    openGapCount: gaps.filter((gap) => gap.status === 'open').length,
    claimedGapCount: gaps.filter((gap) => gap.status === 'claimed' || gap.status === 'in_progress').length,
    totalBusinessValue: sum(gaps, (gap) => gap.expectedBusinessValue),
    unmatchedQueryCount: sum(queries, (item) => item.searchCount),
    gapIds: gaps.map((gap) => gap.id),
  };
}

function buildRootCauseItems(featureId: string): DrilldownRootCauseItem[] {
  const items: DrilldownRootCauseItem[] = [];
  const feature = buildProducerFeature(featureId);
  if (!feature) return items;

  const snapshot = feature.latestQualitySnapshot ?? buildSnapshotFromFeature(feature);
  const latestRun = getLatestPipelineRun(featureId);
  const ticket = getGovernanceTickets().find((item) => item.featureId === featureId) ?? null;
  const relatedRelations = fusionRelationsStore.filter(
    (relation) => relation.sourceFeatureId === featureId || relation.targetFeatureId === featureId,
  );

  if (snapshot.latestAlertType || snapshot.score < 80) {
    items.push({
      id: `${featureId}_root_quality`,
      type: 'quality',
      title: snapshot.latestAlertType ? `质量问题: ${snapshot.latestAlertType}` : '质量分波动',
      summary: snapshot.latestAlertMessage ?? `${feature.name} 当前质量分低于稳态阈值，需要继续治理。`,
      impactScope: `影响 ${feature.attributionSummary?.totalConsumptionTeams ?? 1} 个消费团队的日常调用与收益归因。`,
      severity: snapshot.score < 70 ? 'critical' : snapshot.score < 80 ? 'high' : 'medium',
      relatedPipelineRunId: latestRun?.id ?? null,
      relatedTicketId: ticket?.id ?? null,
    });
  }

  if (latestRun && latestRun.runStatus !== 'completed') {
    items.push({
      id: `${featureId}_root_pipeline`,
      type: 'pipeline',
      title: '流水线状态需关注',
      summary:
        latestRun.errorMessage ??
        `${FEATURE_TYPE_TO_FACTORY_LABEL_MAP[latestRun.pipelineType]}产线仍处于 ${latestRun.runStatus}，会影响新版本供给释放。`,
      impactScope: `当前阶段为 ${latestRun.currentStageName}，版本 ${latestRun.featureVersionId ?? '--'} 尚未稳定输出。`,
      severity: latestRun.runStatus === 'failed' ? 'critical' : 'medium',
      relatedPipelineRunId: latestRun.id,
      relatedTicketId: ticket?.id ?? null,
    });
  }

  if (relatedRelations.length >= 2) {
    items.push({
      id: `${featureId}_root_fusion`,
      type: 'fusion',
      title: '融合链路存在口径重叠',
      summary: `关联 ${relatedRelations.length} 条融合关系，需要确认复用边界与替换顺序。`,
      impactScope: '可能影响跨域召回、会员经营等组合场景下的口径一致性。',
      severity: relatedRelations.some((relation) => relation.confidence >= 0.85) ? 'high' : 'medium',
      relatedPipelineRunId: latestRun?.id ?? null,
      relatedTicketId: null,
    });
  }

  if (!items.length) {
    items.push({
      id: `${featureId}_root_coverage`,
      type: 'coverage',
      title: '消费覆盖仍有提升空间',
      summary: `${feature.name} 当前运行平稳，但在更多消费团队中的复用仍可继续扩大。`,
      impactScope: `当前已覆盖 ${feature.attributionSummary?.totalConsumptionTeams ?? 1} 个消费团队。`,
      severity: 'low',
      relatedPipelineRunId: latestRun?.id ?? null,
      relatedTicketId: null,
    });
  }

  return items;
}

function buildSegmentAccuracy(featureId: string): DrilldownSegmentAccuracy[] {
  const snapshot = getLatestSnapshotMap().get(featureId);
  const baseAccuracy = snapshot ? Number((snapshot.score / 100).toFixed(2)) : 0.82;
  return [
    { segment: '高价值用户', accuracyRate: Number((baseAccuracy + 0.05).toFixed(2)), sampleSize: 42000, deltaVsBaseline: 0.04 },
    { segment: '新客', accuracyRate: Number((baseAccuracy - 0.02).toFixed(2)), sampleSize: 36000, deltaVsBaseline: -0.01 },
    { segment: '沉默用户', accuracyRate: Number((baseAccuracy - 0.05).toFixed(2)), sampleSize: 28000, deltaVsBaseline: -0.03 },
    { segment: '跨域高潜人群', accuracyRate: Number((baseAccuracy + 0.01).toFixed(2)), sampleSize: 18000, deltaVsBaseline: 0.02 },
    { segment: '高风险回流用户', accuracyRate: Number((baseAccuracy - 0.08).toFixed(2)), sampleSize: 16000, deltaVsBaseline: -0.05 },
  ];
}

function buildFusionGraphNode(featureId: string, role: FusionGraphNode['role']): FusionGraphNode | null {
  const feature = buildProducerFeature(featureId);
  if (!feature) return null;
  const snapshot = feature.latestQualitySnapshot ?? buildSnapshotFromFeature(feature);
  return {
    featureId,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: inferFeatureDomain(feature),
    healthScore: snapshot.score,
    role,
  };
}

function buildFusionCompareRow(featureId: string, relationType: FusionRelation['relationType'] | null): FusionQualityCompareRow | null {
  const feature = buildProducerFeature(featureId);
  if (!feature) return null;
  const ranking = getRankingMap().get(featureId);
  const snapshot = feature.latestQualitySnapshot ?? buildSnapshotFromFeature(feature);
  return {
    featureId,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: inferFeatureDomain(feature),
    relationType,
    qualitySnapshot: clone(snapshot),
    attributedRevenue: ranking?.totalRevenue ?? 0,
    consumptionTeams: ranking?.totalConsumptionTeams ?? feature.lineage?.downstream.length ?? 0,
  };
}

function buildFusionEvaluationSeed(featureId: string, comparedFeatureIds: string[]): FusionEvaluationSeed {
  const compareRows = [featureId, ...comparedFeatureIds]
    .map((id) => buildFusionCompareRow(id, null))
    .filter((item): item is FusionQualityCompareRow => item !== null);

  const avgScore =
    compareRows.length > 0
      ? Number((sum(compareRows, (row) => row.qualitySnapshot.score) / compareRows.length).toFixed(1))
      : 80;
  const avgRevenue =
    compareRows.length > 0 ? Number((sum(compareRows, (row) => row.attributedRevenue) / compareRows.length).toFixed(0)) : 0;

  const dimensions: EvaluationMetric[] = [
    { dimension: 'accuracy', score: Number((avgScore / 100).toFixed(2)), baselineScore: 0.78, result: 'pass', summary: '融合后准确率优于基线。' },
    { dimension: 'coverage', score: 0.84, baselineScore: 0.75, result: 'pass', summary: '融合后覆盖更多关键需求场景。' },
    { dimension: 'stability', score: 0.79, baselineScore: 0.76, result: 'pass', summary: '线上稳定性可接受。' },
    { dimension: 'freshness', score: 0.74, baselineScore: 0.78, result: 'warn', summary: '新鲜度仍受上游补数时延影响。' },
  ];

  return {
    summary: `融合测评已完成，候选组合近 30 天平均收益 ${Math.round(avgRevenue / 10000)} 万元，建议继续灰度观察。`,
    overallScore: avgScore,
    decision: avgScore >= 82 ? 'promote' : avgScore >= 75 ? 'observe' : 'rollback',
    dimensions,
    comparedFeatureIds,
  };
}

export function getProducerDashboardSupplyCoverage(): ProducerDashboardSupplyCoverage {
  const totalFeatureCount = mockFeatures.length;
  const activeFeatureCount = getQualityHeatmapPoints().length;
  const coveredGapCount = demandGapStore.filter((gap) => (gap.relatedFeatureIds?.length ?? 0) > 0).length;
  const totalGapCount = demandGapStore.length;
  const featureCountByDomain = new Map<FeatureDomain, number>();

  for (const feature of mockFeatures) {
    const domain = inferFeatureDomain(feature);
    featureCountByDomain.set(domain, (featureCountByDomain.get(domain) ?? 0) + 1);
  }

  const targetDomains = Array.from(new Set(demandGapStore.map((gap) => gap.relatedDomain)));

  return {
    coverageRate: Number((coveredGapCount / Math.max(totalGapCount, 1)).toFixed(2)),
    coveredGapCount,
    totalGapCount,
    activeFeatureCount,
    totalFeatureCount,
    domainBreakdown: targetDomains.map((domain) => {
      const gaps = demandGapStore.filter((gap) => gap.relatedDomain === domain);
      const covered = gaps.filter((gap) => (gap.relatedFeatureIds?.length ?? 0) > 0).length;
      return {
        domain,
        coveredGapCount: covered,
        totalGapCount: gaps.length,
        featureCount: featureCountByDomain.get(domain) ?? 0,
        coverageRate: Number((covered / Math.max(gaps.length, 1)).toFixed(2)),
      };
    }),
  };
}

export function getProducerDashboardPipelineOverview(): ProducerDashboardPipelineOverview {
  const runs = getFactoryGanttRows('all');
  const runStatusCounts: Record<FactoryPipelineRunStatus, number> = {
    completed: 0,
    running: 0,
    failed: 0,
    pending: 0,
  };

  for (const run of runs) {
    runStatusCounts[run.runStatus] += 1;
  }

  return {
    totalRuns: runs.length,
    runStatusCounts,
    cards: getFactoryPipelineOverview(),
    attentionRuns: runs
      .filter((run) => run.runStatus === 'failed' || run.runStatus === 'running' || run.runStatus === 'pending')
      .sort((a, b) => {
        const weightDiff =
          demandStatusWeight(a.runStatus === 'failed' ? 'open' : a.runStatus === 'running' ? 'claimed' : 'planning') -
          demandStatusWeight(b.runStatus === 'failed' ? 'open' : b.runStatus === 'running' ? 'claimed' : 'planning');
        if (weightDiff !== 0) return -weightDiff;
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      })
      .slice(0, 5)
      .map((run) => clone(run)),
  };
}

export function getProducerHealthHeatmap(): QualityHealthHeatmapPoint[] {
  return getQualityHeatmapPoints()
    .slice()
    .sort((a, b) => a.score - b.score)
    .map((item) => clone(item));
}

export function getProducerConsumptionRanking(limit = 10) {
  return getQualityValueRanking()
    .slice(0, limit)
    .map((item) => clone(item));
}

export function getProducerRevenueLoop(limit = 5): ProducerRevenueLoop {
  return {
    kpis: getQualityAttributionKpis().map((item) => clone(item)),
    topConsumers: getQualityValueRanking()
      .slice(0, limit)
      .map((item) => clone(item)),
    latestCalculatedAt: '2026-04-25T10:00:00.000Z',
  };
}

export function getProducerGapTopItems(limit = 5): DemandGap[] {
  return demandGapStore
    .filter((gap) => gap.status !== 'completed' && gap.status !== 'rejected')
    .slice()
    .sort((a, b) => b.expectedBusinessValue - a.expectedBusinessValue)
    .slice(0, limit)
    .map((gap) => clone(gap));
}

export function getDemandHeatmap(): DemandHeatmapCell[] {
  return DEMAND_SCENARIOS.flatMap((scenario) => heatmapDomains.map((domain) => buildHeatmapCell(scenario, domain)));
}

export function getUnmatchedQueryRanking(limit = 10): UnmatchedQueryRankingItem[] {
  return unmatchedQuerySeeds
    .slice()
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, limit)
    .map((item) => clone(item));
}

export function getDemandGapList(): DemandGap[] {
  return demandGapStore
    .slice()
    .sort((a, b) => {
      if (b.expectedBusinessValue !== a.expectedBusinessValue) {
        return b.expectedBusinessValue - a.expectedBusinessValue;
      }
      return demandStatusWeight(b.status) - demandStatusWeight(a.status);
    })
    .map((gap) => clone(gap));
}

export function claimDemandGap(gapId: string, input: GapMutationInput): DemandGap | null {
  const gap = demandGapStore.find((item) => item.id === gapId);
  if (!gap) return null;

  gap.status = 'claimed';
  gap.claimedByUserId = input.operatorUserId;
  gap.claimedByUserName = input.operatorUserName;
  gap.claimedByTeamName = input.operatorTeamName;

  return clone(gap);
}

export function unclaimDemandGap(gapId: string, input: GapMutationInput): DemandGap | null {
  const gap = demandGapStore.find((item) => item.id === gapId);
  if (!gap || gap.claimedByUserId !== input.operatorUserId) return null;

  gap.status = 'open';
  gap.claimedByUserId = null;
  gap.claimedByUserName = null;
  gap.claimedByTeamName = null;

  return clone(gap);
}

export function getDrilldownQualityAttributionAnalysis(featureId: string): DrilldownQualityAttributionAnalysis | null {
  const feature = buildProducerFeature(featureId);
  if (!feature) return null;

  const latestSnapshot = feature.latestQualitySnapshot ?? buildSnapshotFromFeature(feature);

  return {
    feature: clone(feature),
    latestSnapshot: clone(latestSnapshot),
    attributionDetail: getQualityFeatureAttributionDetail(featureId),
    qualityTrend: getQualityTrend(featureId, 30).map((item) => clone(item)),
    rootCauses: buildRootCauseItems(featureId),
    segmentAccuracy: buildSegmentAccuracy(featureId),
  };
}

export function getFusionGraph(featureId: string): FusionGraphData | null {
  const feature = buildProducerFeature(featureId);
  if (!feature) return null;

  const relations = fusionRelationsStore.filter(
    (relation) => relation.sourceFeatureId === featureId || relation.targetFeatureId === featureId,
  );
  const nodeMap = new Map<string, FusionGraphNode>();
  const targetNode = buildFusionGraphNode(featureId, 'target');
  if (targetNode) nodeMap.set(featureId, targetNode);

  for (const relation of relations) {
    const relatedId = relation.sourceFeatureId === featureId ? relation.targetFeatureId : relation.sourceFeatureId;
    const role: FusionGraphNode['role'] =
      relation.targetFeatureId === featureId && relation.relationType === 'derived_from'
        ? 'upstream'
        : relation.sourceFeatureId === featureId && relation.relationType === 'derived_from'
          ? 'downstream'
          : 'peer';
    const node = buildFusionGraphNode(relatedId, role);
    if (node) nodeMap.set(relatedId, node);
  }

  return {
    nodes: Array.from(nodeMap.values()).map((node) => clone(node)),
    relations: relations.map((relation) => clone(relation)),
  };
}

export function getFusionQualityComparison(featureId: string): FusionQualityCompareRow[] {
  const graph = getFusionGraph(featureId);
  if (!graph) return [];

  const relationTypeByFeatureId = new Map<string, FusionRelation['relationType']>();
  for (const relation of graph.relations) {
    const relatedId = relation.sourceFeatureId === featureId ? relation.targetFeatureId : relation.sourceFeatureId;
    relationTypeByFeatureId.set(relatedId, relation.relationType);
  }

  return graph.nodes
    .map((node) =>
      buildFusionCompareRow(node.featureId, node.featureId === featureId ? null : relationTypeByFeatureId.get(node.featureId) ?? null),
    )
    .filter((row): row is FusionQualityCompareRow => row !== null)
    .sort((a, b) => b.qualitySnapshot.score - a.qualitySnapshot.score);
}

export function runFusionEvaluation(featureId: string, comparedFeatureIds: string[] = []): FusionEvaluationRun | null {
  const feature = buildProducerFeature(featureId);
  if (!feature) return null;

  fusionRunSequence += 1;
  const evalRunId = `fusion_eval_${String(fusionRunSequence).padStart(3, '0')}`;
  const createdAt = '2026-04-25T15:00:00.000Z';
  const finishedAt = '2026-04-25T15:02:00.000Z';
  const seed = buildFusionEvaluationSeed(featureId, comparedFeatureIds);

  const run: FusionEvaluationRun = {
    evalRunId,
    featureId,
    status: 'completed',
    createdAt,
    finishedAt,
  };

  const result: FusionEvaluationResult = {
    evalRunId,
    featureId,
    summary: seed.summary,
    overallScore: seed.overallScore,
    decision: seed.decision,
    dimensions: seed.dimensions.map((item) => clone(item)),
    comparedFeatureIds: [...seed.comparedFeatureIds],
    createdAt,
    finishedAt,
  };

  fusionRunStore.set(evalRunId, run);
  fusionResultStore.set(evalRunId, result);
  return clone(run);
}

export function getFusionEvaluationResult(evalRunId: string): FusionEvaluationResult | null {
  const result = fusionResultStore.get(evalRunId);
  return result ? clone(result) : null;
}
