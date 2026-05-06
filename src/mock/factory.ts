import type {
  DistributionChannel,
  EvaluationDimension,
  FactoryCaliberCompareRow,
  FactoryFeatureConfig,
  FactoryLaunchCycleStats,
  FactoryOverviewCard,
  FactoryPipelineRunStatus,
  FactoryPipelineRunWithFeature,
  FactoryPipelineStageProgress,
  FactorySimilaritySearchResult,
  FactoryStageName,
  FactoryStageStatus,
  FactorySubmitPipelineResponse,
  Feature,
  FeatureDomain,
  FeatureLifecycleStage,
  FeatureType,
  FeatureVersion,
  PipelineStage,
  UpdateFrequency,
} from '../types';
import {
  FEATURE_TYPE_TO_FACTORY_EDITOR_MAP,
  FEATURE_TYPE_TO_FACTORY_LABEL_MAP,
} from '../types';
import featuresJson from './features.json';

type FactoryFeatureConfigPatch = Partial<
  Omit<
    FactoryFeatureConfig,
    'dataSource' | 'idMapping' | 'processingLogic' | 'outputConfig' | 'evaluationBaseline'
  >
> & {
  dataSource?: Partial<FactoryFeatureConfig['dataSource']>;
  idMapping?: Partial<FactoryFeatureConfig['idMapping']>;
  processingLogic?: Partial<FactoryFeatureConfig['processingLogic']>;
  outputConfig?: Partial<FactoryFeatureConfig['outputConfig']>;
  evaluationBaseline?: Partial<FactoryFeatureConfig['evaluationBaseline']> & {
    metrics?: FactoryFeatureConfig['evaluationBaseline']['metrics'];
  };
};

type FactoryPipelineSeed = {
  id: string;
  featureId: string;
  featureVersionId: string;
  stage: PipelineStage;
  status: 'queued' | 'running' | 'success' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  triggerType: 'manual' | 'scheduled' | 'publish_flow';
  errorMessage: string | null;
  runStatus: FactoryPipelineRunStatus;
  currentStageName: FactoryStageName;
  stages: Array<{
    name: FactoryStageName;
    status: FactoryStageStatus;
    startedAt: string | null;
    finishedAt: string | null;
  }>;
};

const rawFeatures = featuresJson as Feature[];
const factoryFeatureIds = [
  'feat_001',
  'feat_002',
  'feat_003',
  'feat_004',
  'feat_005',
  'feat_006',
  'feat_010',
  'feat_012',
  'feat_013',
  'feat_021',
  'feat_034',
] as const;
const stageLabelMap: Record<FactoryStageName, string> = {
  collect: '采集',
  process: '加工',
  evaluate: '评测',
  distribute: '分发',
};

const ownerByType: Record<FeatureType, { teamId: string; teamName: string }> = {
  rule: { teamId: 'team_factory_rule', teamName: '规则特征工坊' },
  sequence: { teamId: 'team_factory_sequence', teamName: '序列特征工坊' },
  algo: { teamId: 'team_factory_algo', teamName: '推理特征工坊' },
  vector: { teamId: 'team_factory_vector', teamName: '向量特征工坊' },
  llm_intent: { teamId: 'team_factory_llm', teamName: 'LLM 特征工坊' },
};

const lifecycleByFeatureId: Record<string, FeatureLifecycleStage> = {
  feat_001: 'listed',
  feat_002: 'testing',
  feat_003: 'developing',
  feat_004: 'developing',
  feat_005: 'testing',
  feat_006: 'listed',
  feat_010: 'testing',
  feat_012: 'listed',
  feat_013: 'developing',
  feat_021: 'listed',
  feat_034: 'listed',
};

const evaluationDimensions: EvaluationDimension[] = ['accuracy', 'coverage', 'stability', 'freshness'];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getRawFeatureById(featureId: string): Feature {
  const feature = rawFeatures.find((item) => item.id === featureId);
  if (!feature) {
    throw new Error(`Unknown factory feature id: ${featureId}`);
  }
  return feature;
}

function toFeatureDomain(feature: Feature): FeatureDomain {
  if (feature.namespace.includes('ecommerce')) return 'transaction';
  if (feature.namespace.includes('lifestyle')) return 'content_profile';
  return 'cross_domain';
}

function toUpdateFrequency(feature: Feature): UpdateFrequency {
  const freshness = feature.health?.freshness;
  if (freshness === 'realtime') return 'realtime';
  if (freshness === 'T+7') return 'weekly';
  return 'daily';
}

function toDistributionChannels(feature: Feature): DistributionChannel[] {
  if (feature.type === 'algo') return ['api', 'internal'];
  if (feature.type === 'vector') return ['api', 'marketplace'];
  if (feature.type === 'llm_intent') return ['api', 'foundry'];
  if (feature.type === 'sequence') return ['batch', 'foundry'];
  return ['marketplace', 'internal'];
}

function buildVersions(
  feature: Feature,
  currentVersionId: string,
  pipelineRunId: string | null,
  lifecycle: FeatureLifecycleStage,
): FeatureVersion[] {
  const currentVersionNum = Number(currentVersionId.split('_v')[1] ?? '2');
  const previousVersionId = `${feature.id}_v${Math.max(currentVersionNum - 1, 1)}`;

  return [
    {
      id: previousVersionId,
      version: `v${Math.max(currentVersionNum - 1, 1)}`,
      versionLabel: `稳定基线 v${Math.max(currentVersionNum - 1, 1)}`,
      changelog: '补充历史映射口径与字段回填',
      createdAt: '2026-04-12T10:00:00.000Z',
      createdBy: '系统迁移脚本',
      isLatest: false,
      status: lifecycle === 'listed' ? 'listed' : 'testing',
      caliberVariantIds: [`${feature.id}_caliber_default`],
      evaluationReportId: `${feature.id}_report_prev`,
      pipelineRunId: null,
      publishedAt: lifecycle === 'listed' ? '2026-04-14T09:00:00.000Z' : null,
    },
    {
      id: currentVersionId,
      version: `v${currentVersionNum}`,
      versionLabel: `当前版本 v${currentVersionNum}`,
      changelog: '补齐供给方产线配置、评测基线与可复用口径。',
      createdAt: '2026-04-23T10:00:00.000Z',
      createdBy: ownerByType[feature.type].teamName,
      isLatest: true,
      status: lifecycle,
      caliberVariantIds: [`${feature.id}_caliber_default`, `${feature.id}_caliber_strict`],
      evaluationReportId: `${feature.id}_report_latest`,
      pipelineRunId,
      publishedAt: lifecycle === 'listed' ? '2026-04-24T09:30:00.000Z' : null,
    },
  ];
}

function buildFactoryFeature(base: Feature, pipelineRunId: string | null): Feature {
  const lifecycleStage = lifecycleByFeatureId[base.id] ?? 'developing';
  const currentVersionId = `${base.id}_v${lifecycleStage === 'listed' ? 3 : 2}`;
  const owner = ownerByType[base.type];
  const updateFrequency = toUpdateFrequency(base);
  const coverage = typeof base.health.coverage === 'number' ? base.health.coverage : 0.8;
  const accuracy = typeof base.health.accuracy === 'number' ? base.health.accuracy : 0.82;

  return {
    ...clone(base),
    domain: toFeatureDomain(base),
    tagLayer: base.type === 'rule' ? 'l2' : base.type === 'llm_intent' ? 'l1' : 'l3',
    updateFrequency,
    distributionChannels: toDistributionChannels(base),
    lifecycleStage,
    owner: {
      ownerUserId: `${owner.teamId}_owner`,
      ownerTeamId: owner.teamId,
      ownerTeamName: owner.teamName,
    },
    currentVersionId,
    versions: buildVersions(base, currentVersionId, pipelineRunId, lifecycleStage),
    caliberVariants: [
      {
        id: `${base.id}_caliber_default`,
        name: '默认口径',
        description: '适用于日常生产使用的标准口径。',
        isDefault: true,
        metricDefinition: `${base.name} 近 30 天生产口径`,
        sampleValue: '0.82',
      },
      {
        id: `${base.id}_caliber_strict`,
        name: '严格口径',
        description: '强化覆盖率与稳定性约束的评测口径。',
        isDefault: false,
        metricDefinition: `${base.name} 严格治理口径`,
        sampleValue: '0.78',
      },
    ],
    latestEvaluation: {
      id: `${base.id}_report_latest`,
      featureId: base.id,
      featureVersionId: currentVersionId,
      reportNo: `RPT-${base.id.toUpperCase()}`,
      overallResult: lifecycleStage === 'listed' ? 'pass' : lifecycleStage === 'testing' ? 'warn' : 'pending',
      metrics: evaluationDimensions.map((dimension, index) => ({
        dimension,
        score: Number((accuracy - index * 0.02).toFixed(2)),
        baselineScore: Number((Math.max(accuracy - 0.05 - index * 0.01, 0.65)).toFixed(2)),
        result: lifecycleStage === 'developing' && dimension === 'freshness' ? 'pending' : 'pass',
        summary: `${dimension} 达到当前产线要求`,
      })),
      evaluator: 'Factory Mock QA',
      evaluatedAt: '2026-04-24T11:00:00.000Z',
      recommendation: lifecycleStage === 'listed' ? '建议继续复用并按周回归评测。' : '建议补齐配置后继续推进上线。',
      blockedReason: lifecycleStage === 'developing' ? '待完成配置提交后触发完整评测。' : null,
    },
    latestQualitySnapshot: {
      id: `${base.id}_quality_latest`,
      featureId: base.id,
      snapshotAt: '2026-04-24T12:00:00.000Z',
      score: base.health.score,
      freshnessHours: updateFrequency === 'weekly' ? 72 : 24,
      coverageRate: coverage,
      stabilityRate: Number((Math.max(accuracy - 0.03, 0.72)).toFixed(2)),
      latestAlertType: lifecycleStage === 'developing' ? 'latency' : null,
      latestAlertMessage: lifecycleStage === 'developing' ? '待发布版本尚未完成全量稳定性验证。' : null,
    },
  };
}

function buildStageProgress(feature: Feature, stages: FactoryPipelineSeed['stages']): FactoryPipelineStageProgress[] {
  const ownerTeamName = ownerByType[feature.type].teamName;
  return stages.map((stage) => ({
    name: stage.name,
    label: stageLabelMap[stage.name],
    status: stage.status,
    ownerTeamName,
    startedAt: stage.startedAt,
    finishedAt: stage.finishedAt,
  }));
}

const pipelineSeeds: FactoryPipelineSeed[] = [
  {
    id: 'factory_run_001',
    featureId: 'feat_001',
    featureVersionId: 'feat_001_v3',
    stage: 'done',
    status: 'success',
    startedAt: '2026-04-19T01:00:00.000Z',
    finishedAt: '2026-04-19T04:20:00.000Z',
    durationSeconds: 12000,
    triggerType: 'publish_flow',
    errorMessage: null,
    runStatus: 'completed',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-19T01:00:00.000Z', finishedAt: '2026-04-19T01:25:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-19T01:25:00.000Z', finishedAt: '2026-04-19T02:15:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-19T02:15:00.000Z', finishedAt: '2026-04-19T03:10:00.000Z' },
      { name: 'distribute', status: 'completed', startedAt: '2026-04-19T03:10:00.000Z', finishedAt: '2026-04-19T04:20:00.000Z' },
    ],
  },
  {
    id: 'factory_run_002',
    featureId: 'feat_002',
    featureVersionId: 'feat_002_v2',
    stage: 'transform',
    status: 'running',
    startedAt: '2026-04-24T02:30:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'manual',
    errorMessage: null,
    runStatus: 'running',
    currentStageName: 'process',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-24T02:30:00.000Z', finishedAt: '2026-04-24T02:55:00.000Z' },
      { name: 'process', status: 'running', startedAt: '2026-04-24T02:55:00.000Z', finishedAt: null },
      { name: 'evaluate', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_003',
    featureId: 'feat_004',
    featureVersionId: 'feat_004_v2',
    stage: 'validate',
    status: 'failed',
    startedAt: '2026-04-23T00:40:00.000Z',
    finishedAt: '2026-04-23T03:05:00.000Z',
    durationSeconds: 8700,
    triggerType: 'scheduled',
    errorMessage: '向量索引覆盖率低于阈值，评测未通过。',
    runStatus: 'failed',
    currentStageName: 'evaluate',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-23T00:40:00.000Z', finishedAt: '2026-04-23T01:05:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-23T01:05:00.000Z', finishedAt: '2026-04-23T02:15:00.000Z' },
      { name: 'evaluate', status: 'failed', startedAt: '2026-04-23T02:15:00.000Z', finishedAt: '2026-04-23T03:05:00.000Z' },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_004',
    featureId: 'feat_005',
    featureVersionId: 'feat_005_v2',
    stage: 'queued',
    status: 'queued',
    startedAt: '2026-04-24T09:20:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'manual',
    errorMessage: null,
    runStatus: 'pending',
    currentStageName: 'collect',
    stages: [
      { name: 'collect', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'process', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'evaluate', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_005',
    featureId: 'feat_013',
    featureVersionId: 'feat_013_v2',
    stage: 'extract',
    status: 'running',
    startedAt: '2026-04-24T04:10:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'scheduled',
    errorMessage: null,
    runStatus: 'running',
    currentStageName: 'collect',
    stages: [
      { name: 'collect', status: 'running', startedAt: '2026-04-24T04:10:00.000Z', finishedAt: null },
      { name: 'process', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'evaluate', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_006',
    featureId: 'feat_021',
    featureVersionId: 'feat_021_v3',
    stage: 'done',
    status: 'success',
    startedAt: '2026-04-20T00:30:00.000Z',
    finishedAt: '2026-04-20T02:55:00.000Z',
    durationSeconds: 8700,
    triggerType: 'publish_flow',
    errorMessage: null,
    runStatus: 'completed',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-20T00:30:00.000Z', finishedAt: '2026-04-20T00:52:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-20T00:52:00.000Z', finishedAt: '2026-04-20T01:35:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-20T01:35:00.000Z', finishedAt: '2026-04-20T02:05:00.000Z' },
      { name: 'distribute', status: 'completed', startedAt: '2026-04-20T02:05:00.000Z', finishedAt: '2026-04-20T02:55:00.000Z' },
    ],
  },
  {
    id: 'factory_run_007',
    featureId: 'feat_034',
    featureVersionId: 'feat_034_v3',
    stage: 'publish',
    status: 'running',
    startedAt: '2026-04-24T06:40:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'publish_flow',
    errorMessage: null,
    runStatus: 'running',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-24T06:40:00.000Z', finishedAt: '2026-04-24T07:05:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-24T07:05:00.000Z', finishedAt: '2026-04-24T07:45:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-24T07:45:00.000Z', finishedAt: '2026-04-24T08:20:00.000Z' },
      { name: 'distribute', status: 'running', startedAt: '2026-04-24T08:20:00.000Z', finishedAt: null },
    ],
  },
  {
    id: 'factory_run_008',
    featureId: 'feat_006',
    featureVersionId: 'feat_006_v2',
    stage: 'done',
    status: 'success',
    startedAt: '2026-04-21T01:15:00.000Z',
    finishedAt: '2026-04-21T03:48:00.000Z',
    durationSeconds: 9180,
    triggerType: 'scheduled',
    errorMessage: null,
    runStatus: 'completed',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-21T01:15:00.000Z', finishedAt: '2026-04-21T01:40:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-21T01:40:00.000Z', finishedAt: '2026-04-21T02:26:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-21T02:26:00.000Z', finishedAt: '2026-04-21T03:00:00.000Z' },
      { name: 'distribute', status: 'completed', startedAt: '2026-04-21T03:00:00.000Z', finishedAt: '2026-04-21T03:48:00.000Z' },
    ],
  },
  {
    id: 'factory_run_009',
    featureId: 'feat_010',
    featureVersionId: 'feat_010_v1',
    stage: 'validate',
    status: 'failed',
    startedAt: '2026-04-22T05:30:00.000Z',
    finishedAt: '2026-04-22T08:05:00.000Z',
    durationSeconds: 9300,
    triggerType: 'manual',
    errorMessage: '评测覆盖率未达标，需补齐 DID 映射。',
    runStatus: 'failed',
    currentStageName: 'evaluate',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-22T05:30:00.000Z', finishedAt: '2026-04-22T05:58:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-22T05:58:00.000Z', finishedAt: '2026-04-22T06:52:00.000Z' },
      { name: 'evaluate', status: 'failed', startedAt: '2026-04-22T06:52:00.000Z', finishedAt: '2026-04-22T08:05:00.000Z' },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_010',
    featureId: 'feat_012',
    featureVersionId: 'feat_012_v4',
    stage: 'publish',
    status: 'running',
    startedAt: '2026-04-24T03:20:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'publish_flow',
    errorMessage: null,
    runStatus: 'running',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-24T03:20:00.000Z', finishedAt: '2026-04-24T03:42:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-24T03:42:00.000Z', finishedAt: '2026-04-24T04:35:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-24T04:35:00.000Z', finishedAt: '2026-04-24T05:10:00.000Z' },
      { name: 'distribute', status: 'running', startedAt: '2026-04-24T05:10:00.000Z', finishedAt: null },
    ],
  },
  {
    id: 'factory_run_011',
    featureId: 'feat_003',
    featureVersionId: 'feat_003_v1',
    stage: 'queued',
    status: 'queued',
    startedAt: '2026-04-24T10:15:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'manual',
    errorMessage: null,
    runStatus: 'pending',
    currentStageName: 'collect',
    stages: [
      { name: 'collect', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'process', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'evaluate', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ],
  },
  {
    id: 'factory_run_012',
    featureId: 'feat_002',
    featureVersionId: 'feat_002_v3',
    stage: 'done',
    status: 'success',
    startedAt: '2026-04-18T22:10:00.000Z',
    finishedAt: '2026-04-19T01:18:00.000Z',
    durationSeconds: 11280,
    triggerType: 'scheduled',
    errorMessage: null,
    runStatus: 'completed',
    currentStageName: 'distribute',
    stages: [
      { name: 'collect', status: 'completed', startedAt: '2026-04-18T22:10:00.000Z', finishedAt: '2026-04-18T22:42:00.000Z' },
      { name: 'process', status: 'completed', startedAt: '2026-04-18T22:42:00.000Z', finishedAt: '2026-04-18T23:40:00.000Z' },
      { name: 'evaluate', status: 'completed', startedAt: '2026-04-18T23:40:00.000Z', finishedAt: '2026-04-19T00:24:00.000Z' },
      { name: 'distribute', status: 'completed', startedAt: '2026-04-19T00:24:00.000Z', finishedAt: '2026-04-19T01:18:00.000Z' },
    ],
  },
];

const latestPipelineRunIdByFeature = new Map<string, string>();
for (const seed of pipelineSeeds) {
  latestPipelineRunIdByFeature.set(seed.featureId, seed.id);
}

const factoryFeatureStore = new Map<string, Feature>(
  factoryFeatureIds.map((featureId) => {
    const baseFeature = getRawFeatureById(featureId);
    const feature = buildFactoryFeature(baseFeature, latestPipelineRunIdByFeature.get(featureId) ?? null);
    return [featureId, feature];
  }),
);

function getFactoryFeature(featureId: string): Feature {
  const feature = factoryFeatureStore.get(featureId);
  if (!feature) {
    throw new Error(`Unknown factory feature id: ${featureId}`);
  }
  return feature;
}

function buildPipelineRun(seed: FactoryPipelineSeed): FactoryPipelineRunWithFeature {
  const feature = getFactoryFeature(seed.featureId);
  return {
    id: seed.id,
    featureId: seed.featureId,
    featureVersionId: seed.featureVersionId,
    stage: seed.stage,
    status: seed.status,
    startedAt: seed.startedAt,
    finishedAt: seed.finishedAt,
    durationSeconds: seed.durationSeconds,
    triggerType: seed.triggerType,
    errorMessage: seed.errorMessage,
    feature: clone(feature),
    pipelineType: feature.type,
    pipelineLabel: FEATURE_TYPE_TO_FACTORY_LABEL_MAP[feature.type],
    runStatus: seed.runStatus,
    currentStageName: seed.currentStageName,
    stages: buildStageProgress(feature, seed.stages),
  };
}

let pipelineRunSequence = pipelineSeeds.length;
let factoryPipelineRunsStore = pipelineSeeds.map(buildPipelineRun);

const factoryLaunchCycleStatsSeed: FactoryLaunchCycleStats = {
  baselineDays: 9.5,
  medianDays: 6.8,
  targetDays: 5.5,
  samples: [
    { featureId: 'feat_001', featureName: '电商特征_1', pipelineType: 'rule', launchDays: 4.8, releasedAt: '2026-04-19' },
    { featureId: 'feat_021', featureName: '跨域特征_21', pipelineType: 'rule', launchDays: 5.2, releasedAt: '2026-04-20' },
    { featureId: 'feat_002', featureName: '生服特征_2', pipelineType: 'sequence', launchDays: 7.1, releasedAt: '2026-04-18' },
    { featureId: 'feat_013', featureName: '电商特征_13', pipelineType: 'algo', launchDays: 8.4, releasedAt: '2026-04-17' },
    { featureId: 'feat_034', featureName: '电商特征_34', pipelineType: 'vector', launchDays: 6.1, releasedAt: '2026-04-24' },
    { featureId: 'feat_005', featureName: '生服特征_5', pipelineType: 'llm_intent', launchDays: 9.3, releasedAt: '2026-04-16' },
  ],
};

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Number(((sorted[middle - 1]! + sorted[middle]!) / 2).toFixed(1))
    : Number(sorted[middle]!.toFixed(1));
}

function emptyStatusCounts(): Record<FactoryPipelineRunStatus, number> {
  return {
    completed: 0,
    running: 0,
    failed: 0,
    pending: 0,
  };
}

const similaritySeed: FactorySimilaritySearchResult[] = [
  {
    featureId: 'feat_001',
    featureName: '电商特征_1',
    type: 'rule',
    domain: 'transaction',
    lifecycleStage: 'listed',
    similarityScore: 92,
    accuracy: 0.82,
    coverage: 0.78,
    updateFrequency: 'weekly',
    reuseSuggestion: '高度重复，优先复用现有规则并只补充差异条件。',
    hitReasons: ['命中交易近 30 天活跃规则', 'ID 映射口径一致', '下游场景高度重叠'],
  },
  {
    featureId: 'feat_021',
    featureName: '跨域特征_21',
    type: 'rule',
    domain: 'cross_domain',
    lifecycleStage: 'listed',
    similarityScore: 84,
    accuracy: 0.91,
    coverage: 0.82,
    updateFrequency: 'daily',
    reuseSuggestion: '可复用主链路，建议保留跨域口径并缩小输出范围。',
    hitReasons: ['跨域交易融合口径相近', '评测基线已齐备'],
  },
  {
    featureId: 'feat_034',
    featureName: '电商特征_34',
    type: 'vector',
    domain: 'transaction',
    lifecycleStage: 'listed',
    similarityScore: 76,
    accuracy: 0.9,
    coverage: 0.84,
    updateFrequency: 'daily',
    reuseSuggestion: '中等相似，适合参考向量召回配置与评测阈值。',
    hitReasons: ['召回特征字段重合', '向量维度设置接近'],
  },
  {
    featureId: 'feat_005',
    featureName: '生服特征_5',
    type: 'llm_intent',
    domain: 'content_profile',
    lifecycleStage: 'testing',
    similarityScore: 58,
    accuracy: 0.88,
    coverage: 0.86,
    updateFrequency: 'daily',
    reuseSuggestion: '低相似度，可复用 Prompt 结构但需重建语义标签。',
    hitReasons: ['场景目标存在部分重叠'],
  },
];

const factoryConfigStore = new Map<string, FactoryFeatureConfig>(
  factoryFeatureIds.map((featureId) => {
    const feature = getFactoryFeature(featureId);
    const editorType = FEATURE_TYPE_TO_FACTORY_EDITOR_MAP[feature.type];
    const ownerTeamName = feature.owner?.ownerTeamName ?? ownerByType[feature.type].teamName;
    const updateFrequency = feature.updateFrequency ?? 'daily';
    const contentByEditor = {
      rule: 'if user_paid_days_30 >= 3 and refund_ratio_30d < 0.2 then score = 1 else score = 0',
      sql: 'select user_id, max(pay_cnt_30d) as seq_score from dwd_user_trade_seq_di group by user_id;',
      model: 'model://factory/algo/ctr_uplift_v2?feature_set=trade_cross_v2&threshold=0.71',
      dsl: 'vector(index="trade_intent_v3").join(profile_embedding).topk(50).filter(score > 0.72)',
      prompt: '请根据用户最近 14 天交易与内容行为，输出购买意图标签与置信度。',
    } satisfies Record<typeof editorType, string>;

    return [
      featureId,
      {
        featureId,
        featureName: feature.name,
        pipelineType: feature.type,
        editorType,
        versionId: feature.currentVersionId ?? `${featureId}_v2`,
        isDraft: feature.lifecycleStage !== 'listed',
        updatedAt: '2026-04-24T12:30:00.000Z',
        dataSource: {
          primaryTable:
            feature.type === 'sequence'
              ? 'dwd_user_trade_seq_di'
              : feature.type === 'algo'
                ? 'ads_cross_feature_train_df'
                : feature.type === 'vector'
                  ? 'dwd_content_embedding_df'
                  : feature.type === 'llm_intent'
                    ? 'dwd_dialogue_event_di'
                    : 'dwd_trade_order_di',
          joinTables: ['dim_user_profile_df', 'dim_device_mapping_df'],
          partitionKey: 'dt',
          updateFrequency,
          filters: ['dt = ${bizdate}', 'is_test = 0'],
        },
        idMapping: {
          primaryIdType: feature.type === 'llm_intent' ? 'conversation_id' : 'user_id',
          mappingPolicy: '通过统一 ID Mapping 服务回填 merchant_id / device_id。',
          bridgeTable: 'dim_identity_mapping_df',
          ttlDays: feature.type === 'vector' ? 30 : 14,
        },
        processingLogic: {
          summary: `${FEATURE_TYPE_TO_FACTORY_LABEL_MAP[feature.type]}产线加工逻辑`,
          content: contentByEditor[editorType],
          inputFields: ['user_id', 'merchant_id', 'pay_cnt_30d', 'active_days_14d'],
          outputField: `${feature.id}_score`,
        },
        outputConfig: {
          namespace: feature.namespace,
          channel: feature.distributionChannels?.[0] ?? 'internal',
          topicName: `${feature.id}.topic`,
          ownerTeamName,
          slaMinutes: feature.type === 'algo' ? 45 : 30,
        },
        evaluationBaseline: {
          sampleSize: 120000,
          reportId: `${feature.id}_report_latest`,
          metrics: evaluationDimensions.map((dimension, index) => ({
            dimension,
            baselineScore: Number((0.72 + index * 0.03).toFixed(2)),
            targetScore: Number((0.8 + index * 0.025).toFixed(2)),
          })),
        },
      },
    ] as const;
  }),
);

export const mockFactoryFeatures = Array.from(factoryFeatureStore.values()).map((feature) => clone(feature));

export function getFactoryPipelineOverview(): FactoryOverviewCard[] {
  const cards = new Map<FeatureType, FactoryOverviewCard>();

  for (const run of factoryPipelineRunsStore) {
    const current = cards.get(run.pipelineType) ?? {
      featureType: run.pipelineType,
      label: FEATURE_TYPE_TO_FACTORY_LABEL_MAP[run.pipelineType],
      total: 0,
      runStatusCounts: emptyStatusCounts(),
      medianLaunchDays: 0,
    };

    current.total += 1;
    current.runStatusCounts[run.runStatus] += 1;
    cards.set(run.pipelineType, current);
  }

  for (const [featureType, card] of cards) {
    const launchDays = factoryLaunchCycleStatsSeed.samples
      .filter((sample) => sample.pipelineType === featureType)
      .map((sample) => sample.launchDays);
    card.medianLaunchDays = median(launchDays);
  }

  return Array.from(cards.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN')).map((card) => clone(card));
}

export function getFactoryGanttRows(featureType?: FeatureType | 'all'): FactoryPipelineRunWithFeature[] {
  return factoryPipelineRunsStore
    .filter((item) => (featureType && featureType !== 'all' ? item.pipelineType === featureType : true))
    .map((item) => clone(item));
}

export function getFactoryLaunchCycleStats(): FactoryLaunchCycleStats {
  return clone(factoryLaunchCycleStatsSeed);
}

export function getFactoryFeatureConfig(featureId: string): FactoryFeatureConfig | null {
  const config = factoryConfigStore.get(featureId);
  return config ? clone(config) : null;
}

export function saveFactoryFeatureConfig(featureId: string, patch: FactoryFeatureConfigPatch): FactoryFeatureConfig | null {
  const current = factoryConfigStore.get(featureId);
  if (!current) return null;

  const next: FactoryFeatureConfig = {
    ...current,
    ...patch,
    updatedAt: '2026-04-25T09:30:00.000Z',
    dataSource: { ...current.dataSource, ...patch.dataSource },
    idMapping: { ...current.idMapping, ...patch.idMapping },
    processingLogic: { ...current.processingLogic, ...patch.processingLogic },
    outputConfig: { ...current.outputConfig, ...patch.outputConfig },
    evaluationBaseline: {
      ...current.evaluationBaseline,
      ...patch.evaluationBaseline,
      metrics: patch.evaluationBaseline?.metrics ?? current.evaluationBaseline.metrics,
    },
  };

  factoryConfigStore.set(featureId, next);
  return clone(next);
}

export function submitFactoryPipeline(featureId: string): FactorySubmitPipelineResponse | null {
  const config = factoryConfigStore.get(featureId);
  const feature = factoryFeatureStore.get(featureId);
  if (!config || !feature) return null;

  pipelineRunSequence += 1;
  const runId = `factory_run_${String(pipelineRunSequence).padStart(3, '0')}`;
  const versionId = `${featureId}_v${Number((feature.currentVersionId ?? `${featureId}_v2`).split('_v')[1] ?? '2') + 1}`;

  const updatedFeature: Feature = {
    ...clone(feature),
    lifecycleStage: 'developing',
    currentVersionId: versionId,
    versions: [
      ...(feature.versions ?? []).map((version) => ({ ...version, isLatest: false })),
      {
        id: versionId,
        version: versionId.split('_').slice(-1)[0] ?? 'v1',
        versionLabel: `提交版本 ${versionId.split('_').slice(-1)[0] ?? 'v1'}`,
        changelog: '由供给方配置页提交至流水线',
        createdAt: '2026-04-25T10:00:00.000Z',
        createdBy: feature.owner?.ownerTeamName ?? ownerByType[feature.type].teamName,
        isLatest: true,
        status: 'developing',
        caliberVariantIds: feature.caliberVariants?.map((variant) => variant.id) ?? [],
        evaluationReportId: null,
        pipelineRunId: runId,
        publishedAt: null,
      },
    ],
  };

  factoryFeatureStore.set(featureId, updatedFeature);
  factoryConfigStore.set(featureId, {
    ...config,
    versionId,
    isDraft: false,
    updatedAt: '2026-04-25T10:00:00.000Z',
  });

  const run: FactoryPipelineRunWithFeature = {
    id: runId,
    featureId,
    featureVersionId: versionId,
    stage: 'extract',
    status: 'running',
    startedAt: '2026-04-25T10:00:00.000Z',
    finishedAt: null,
    durationSeconds: null,
    triggerType: 'manual',
    errorMessage: null,
    feature: clone(updatedFeature),
    pipelineType: updatedFeature.type,
    pipelineLabel: FEATURE_TYPE_TO_FACTORY_LABEL_MAP[updatedFeature.type],
    runStatus: 'running',
    currentStageName: 'collect',
    stages: buildStageProgress(updatedFeature, [
      { name: 'collect', status: 'running', startedAt: '2026-04-25T10:00:00.000Z', finishedAt: null },
      { name: 'process', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'evaluate', status: 'pending', startedAt: null, finishedAt: null },
      { name: 'distribute', status: 'pending', startedAt: null, finishedAt: null },
    ]),
  };

  factoryPipelineRunsStore = [run, ...factoryPipelineRunsStore];

  return {
    featureId,
    pipelineRun: clone(run),
    message: '已提交至流水线，产线状态更新为 running。',
  };
}

export function searchFactorySimilarFeatures(query: string): FactorySimilaritySearchResult[] {
  const keyword = query.trim().toLowerCase();
  const ranked = similaritySeed
    .map((item) => {
      const text = [item.featureName, item.reuseSuggestion, ...item.hitReasons].join(' ').toLowerCase();
      const bonus = keyword && text.includes(keyword) ? 6 : 0;
      return {
        item,
        score: item.similarityScore + bonus,
      };
    })
    .filter(({ item, score }) => {
      if (!keyword) return true;
      if (score > item.similarityScore) return true;
      return item.type.includes(keyword) || item.domain.includes(keyword);
    })
    .sort((a, b) => b.score - a.score);

  return ranked.map(({ item }) => clone(item));
}

export function getFactoryCaliberComparison(featureIds: string[]): FactoryCaliberCompareRow[] {
  const targetIds = featureIds.length ? featureIds : similaritySeed.slice(0, 2).map((item) => item.featureId);

  return targetIds
    .map((featureId) => {
      const feature = factoryFeatureStore.get(featureId);
      const config = factoryConfigStore.get(featureId);
      if (!feature || !config) return null;

      return {
        featureId,
        featureName: feature.name,
        caliber: feature.caliberVariants?.find((variant) => variant.isDefault)?.name ?? '默认口径',
        dataSource: config.dataSource.primaryTable,
        coverageRate: typeof feature.health.coverage === 'number' ? feature.health.coverage : 0,
        accuracyRate: typeof feature.health.accuracy === 'number' ? feature.health.accuracy : 0,
        updateFrequency: feature.updateFrequency ?? 'daily',
        ownerTeamName: feature.owner?.ownerTeamName ?? ownerByType[feature.type].teamName,
      } satisfies FactoryCaliberCompareRow;
    })
    .filter((item): item is FactoryCaliberCompareRow => item !== null);
}
