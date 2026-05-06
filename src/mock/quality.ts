import type {
  AlertType,
  AttributionRecord,
  BacktestJob,
  BacktestMetrics,
  BacktestScenario,
  BacktestTriggerType,
  ConsumptionRecord,
  EvaluationDimension,
  Feature,
  FeatureDomain,
  FeatureType,
  GovernanceTicket,
  GovernanceTicketComment,
  GovernanceTicketDetail,
  GovernanceTicketTimelineEntry,
  HealthScoreBreakdown,
  HealthScoreSource,
  HealthScoreTrendPoint,
  LLMJudgeBadCase,
  LLMJudgeBadCaseAction,
  LLMJudgeDimensionScore,
  LLMJudgeFewShotExample,
  LLMJudgePromptTemplate,
  LLMJudgePromptTemplateVersion,
  LLMJudgeRun,
  QualityAlert,
  QualityAlertOverview,
  QualityAlertRule,
  QualityAttributionKpi,
  QualityDegradationEvent,
  QualityExportEntry,
  QualityExportFormat,
  QualityFeatureAttributionDetail,
  QualityHealthHeatmapPoint,
  QualityHealthListItem,
  QualityHealthReport,
  QualityHealthStatus,
  QualityMetricKey,
  QualityPlaceholderEntry,
  QualityTrendPoint,
  QualityValueRankingItem,
  SelfReviewRecord,
  SelfReviewTemplate,
  SurveyDispatch,
  SurveyResponse,
  SurveySummary,
  SurveyTemplate,
  SurveyWordCloudItem,
  UpdateFrequency,
} from '../types';
import featuresJson from './features.json';

type SnapshotSeed = {
  featureId: string;
  snapshotAt: string;
  score: number;
  freshnessHours: number;
  coverageRate: number;
  stabilityRate: number;
  latestAlertType: AlertType | null;
  latestAlertMessage: string | null;
};

type TicketDetailSeed = Omit<GovernanceTicketDetail, 'ticket' | 'relatedAlerts' | 'comments'>;

type CommentInput = {
  authorUserId: string;
  authorUserName: string;
  authorTeamName: string;
  content: string;
};

type TicketStatusUpdateInput = {
  status: GovernanceTicket['status'];
  operatorUserId: string;
  operatorUserName: string;
  operatorTeamName: string;
};

type AttributionTrendSeed = {
  period: string;
  metricValues: Partial<Record<QualityMetricKey, number>>;
};

const rawFeatures = featuresJson as Feature[];
const featureById = new Map(rawFeatures.map((feature) => [feature.id, feature]));

const ownerByType: Record<FeatureType, { teamId: string; teamName: string }> = {
  rule: { teamId: 'team_quality_rule', teamName: '规则特征治理组' },
  sequence: { teamId: 'team_quality_sequence', teamName: '序列特征治理组' },
  algo: { teamId: 'team_quality_algo', teamName: '算法特征治理组' },
  vector: { teamId: 'team_quality_vector', teamName: '向量特征治理组' },
  llm_intent: { teamId: 'team_quality_llm', teamName: 'LLM 特征治理组' },
};

const snapshotSeeds: SnapshotSeed[] = [
  {
    featureId: 'feat_001',
    snapshotAt: '2026-04-25T09:00:00.000Z',
    score: 92,
    freshnessHours: 10,
    coverageRate: 0.91,
    stabilityRate: 0.9,
    latestAlertType: null,
    latestAlertMessage: null,
  },
  {
    featureId: 'feat_002',
    snapshotAt: '2026-04-25T09:05:00.000Z',
    score: 88,
    freshnessHours: 18,
    coverageRate: 0.87,
    stabilityRate: 0.86,
    latestAlertType: null,
    latestAlertMessage: null,
  },
  {
    featureId: 'feat_003',
    snapshotAt: '2026-04-25T09:10:00.000Z',
    score: 85,
    freshnessHours: 22,
    coverageRate: 0.83,
    stabilityRate: 0.84,
    latestAlertType: 'drift',
    latestAlertMessage: '近 7 天样本分布发生轻微漂移，已进入观察态。',
  },
  {
    featureId: 'feat_004',
    snapshotAt: '2026-04-25T09:15:00.000Z',
    score: 82,
    freshnessHours: 28,
    coverageRate: 0.8,
    stabilityRate: 0.8,
    latestAlertType: 'coverage',
    latestAlertMessage: '跨域样本覆盖率较基线下滑 6.2%。',
  },
  {
    featureId: 'feat_005',
    snapshotAt: '2026-04-25T09:20:00.000Z',
    score: 79,
    freshnessHours: 36,
    coverageRate: 0.77,
    stabilityRate: 0.78,
    latestAlertType: 'freshness',
    latestAlertMessage: '增量入湖延迟，T+1 产物延后 12 小时。',
  },
  {
    featureId: 'feat_006',
    snapshotAt: '2026-04-25T09:25:00.000Z',
    score: 77,
    freshnessHours: 44,
    coverageRate: 0.79,
    stabilityRate: 0.76,
    latestAlertType: 'latency',
    latestAlertMessage: '生产接口 P95 延迟抬升到 240ms。',
  },
  {
    featureId: 'feat_007',
    snapshotAt: '2026-04-25T09:30:00.000Z',
    score: 74,
    freshnessHours: 52,
    coverageRate: 0.75,
    stabilityRate: 0.74,
    latestAlertType: 'freshness',
    latestAlertMessage: '离线补数未完成，连续两批次未回补成功。',
  },
  {
    featureId: 'feat_008',
    snapshotAt: '2026-04-25T09:35:00.000Z',
    score: 71,
    freshnessHours: 40,
    coverageRate: 0.72,
    stabilityRate: 0.75,
    latestAlertType: 'coverage',
    latestAlertMessage: '核心场景曝光样本缺失，覆盖率接近阈值。',
  },
  {
    featureId: 'feat_009',
    snapshotAt: '2026-04-25T09:40:00.000Z',
    score: 68,
    freshnessHours: 60,
    coverageRate: 0.69,
    stabilityRate: 0.71,
    latestAlertType: 'schema_change',
    latestAlertMessage: '上游字段枚举新增，解析逻辑未同步更新。',
  },
  {
    featureId: 'feat_010',
    snapshotAt: '2026-04-25T09:45:00.000Z',
    score: 66,
    freshnessHours: 72,
    coverageRate: 0.67,
    stabilityRate: 0.68,
    latestAlertType: 'drift',
    latestAlertMessage: '召回分布偏移，线上稳定性下降超过 10%。',
  },
  {
    featureId: 'feat_011',
    snapshotAt: '2026-04-25T09:50:00.000Z',
    score: 64,
    freshnessHours: 80,
    coverageRate: 0.7,
    stabilityRate: 0.65,
    latestAlertType: 'cost',
    latestAlertMessage: '向量检索成本飙升，超出预算阈值 18%。',
  },
  {
    featureId: 'feat_012',
    snapshotAt: '2026-04-25T09:55:00.000Z',
    score: 90,
    freshnessHours: 12,
    coverageRate: 0.89,
    stabilityRate: 0.9,
    latestAlertType: null,
    latestAlertMessage: null,
  },
];

const alertRulesSeed: QualityAlertRule[] = [
  {
    id: 'rule_quality_freshness_001',
    name: 'T+1 产物延迟超过 24h',
    alertType: 'freshness',
    ownerTeamId: 'team_quality_rule',
    ownerTeamName: '规则特征治理组',
    metricLabel: '数据新鲜度',
    comparator: '>=',
    thresholdValue: 24,
    status: 'enabled',
    latestTriggeredAt: '2026-04-25T09:20:00.000Z',
  },
  {
    id: 'rule_quality_coverage_001',
    name: '核心样本覆盖率低于 75%',
    alertType: 'coverage',
    ownerTeamId: 'team_quality_sequence',
    ownerTeamName: '序列特征治理组',
    metricLabel: '覆盖率',
    comparator: '<',
    thresholdValue: 0.75,
    status: 'enabled',
    latestTriggeredAt: '2026-04-25T09:35:00.000Z',
  },
  {
    id: 'rule_quality_drift_001',
    name: '样本分布 PSI 超过 0.2',
    alertType: 'drift',
    ownerTeamId: 'team_quality_algo',
    ownerTeamName: '算法特征治理组',
    metricLabel: '分布漂移',
    comparator: '>',
    thresholdValue: 0.2,
    status: 'enabled',
    latestTriggeredAt: '2026-04-25T09:45:00.000Z',
  },
  {
    id: 'rule_quality_latency_001',
    name: '线上调用 P95 超过 220ms',
    alertType: 'latency',
    ownerTeamId: 'team_quality_algo',
    ownerTeamName: '算法特征治理组',
    metricLabel: 'P95 延迟',
    comparator: '>',
    thresholdValue: 220,
    status: 'enabled',
    latestTriggeredAt: '2026-04-25T09:25:00.000Z',
  },
  {
    id: 'rule_quality_schema_001',
    name: 'Schema 变更未同步消费链路',
    alertType: 'schema_change',
    ownerTeamId: 'team_quality_vector',
    ownerTeamName: '向量特征治理组',
    metricLabel: 'Schema 变更数',
    comparator: '>',
    thresholdValue: 0,
    status: 'enabled',
    latestTriggeredAt: '2026-04-25T09:40:00.000Z',
  },
  {
    id: 'rule_quality_cost_001',
    name: '单万次查询成本超过预算',
    alertType: 'cost',
    ownerTeamId: 'team_quality_vector',
    ownerTeamName: '向量特征治理组',
    metricLabel: '单万次查询成本',
    comparator: '>',
    thresholdValue: 1.15,
    status: 'disabled',
    latestTriggeredAt: '2026-04-25T09:50:00.000Z',
  },
];

const alertsSeed: QualityAlert[] = [
  {
    id: 'alert_001',
    ruleId: 'rule_quality_coverage_001',
    featureId: 'feat_004',
    featureName: '跨域特征_4',
    featureType: 'vector',
    featureDomain: 'cross_domain',
    ownerTeamName: '向量特征治理组',
    alertType: 'coverage',
    status: 'open',
    healthStatus: 'warning',
    title: '跨域样本覆盖率回落',
    summary: '近 3 个批次平均覆盖率降至 80%，接近红线。',
    triggeredAt: '2026-04-25T09:15:00.000Z',
    currentValue: 0.8,
    thresholdValue: 0.75,
    relatedTicketId: 'ticket_002',
  },
  {
    id: 'alert_002',
    ruleId: 'rule_quality_freshness_001',
    featureId: 'feat_005',
    featureName: '电商特征_5',
    featureType: 'llm_intent',
    featureDomain: 'transaction',
    ownerTeamName: 'LLM 特征治理组',
    alertType: 'freshness',
    status: 'acknowledged',
    healthStatus: 'warning',
    title: '增量入湖延迟',
    summary: '增量链路延迟，T+1 产物生成较基线晚 12 小时。',
    triggeredAt: '2026-04-25T09:20:00.000Z',
    currentValue: 36,
    thresholdValue: 24,
    relatedTicketId: 'ticket_001',
  },
  {
    id: 'alert_003',
    ruleId: 'rule_quality_latency_001',
    featureId: 'feat_006',
    featureName: '生服特征_6',
    featureType: 'rule',
    featureDomain: 'content_profile',
    ownerTeamName: '规则特征治理组',
    alertType: 'latency',
    status: 'open',
    healthStatus: 'warning',
    title: '线上延迟升高',
    summary: '生产接口 P95 延迟达到 240ms，影响下游实时调用。',
    triggeredAt: '2026-04-25T09:25:00.000Z',
    currentValue: 240,
    thresholdValue: 220,
    relatedTicketId: null,
  },
  {
    id: 'alert_004',
    ruleId: 'rule_quality_freshness_001',
    featureId: 'feat_007',
    featureName: '跨域特征_7',
    featureType: 'sequence',
    featureDomain: 'cross_domain',
    ownerTeamName: '序列特征治理组',
    alertType: 'freshness',
    status: 'open',
    healthStatus: 'warning',
    title: '离线补数未完成',
    summary: '连续两批次未成功补数，已影响历史窗口计算。',
    triggeredAt: '2026-04-25T09:30:00.000Z',
    currentValue: 52,
    thresholdValue: 24,
    relatedTicketId: 'ticket_004',
  },
  {
    id: 'alert_005',
    ruleId: 'rule_quality_coverage_001',
    featureId: 'feat_008',
    featureName: '电商特征_8',
    featureType: 'algo',
    featureDomain: 'transaction',
    ownerTeamName: '算法特征治理组',
    alertType: 'coverage',
    status: 'acknowledged',
    healthStatus: 'warning',
    title: '核心场景覆盖不足',
    summary: '重点消费方请求有缺口，覆盖率已经跌到 72%。',
    triggeredAt: '2026-04-25T09:35:00.000Z',
    currentValue: 0.72,
    thresholdValue: 0.75,
    relatedTicketId: 'ticket_005',
  },
  {
    id: 'alert_006',
    ruleId: 'rule_quality_schema_001',
    featureId: 'feat_009',
    featureName: '生服特征_9',
    featureType: 'vector',
    featureDomain: 'content_profile',
    ownerTeamName: '向量特征治理组',
    alertType: 'schema_change',
    status: 'open',
    healthStatus: 'critical',
    title: '上游 Schema 变更未同步',
    summary: '枚举字段新增后解析失败，导致下游读数缺失。',
    triggeredAt: '2026-04-25T09:40:00.000Z',
    currentValue: 1,
    thresholdValue: 0,
    relatedTicketId: 'ticket_003',
  },
  {
    id: 'alert_007',
    ruleId: 'rule_quality_drift_001',
    featureId: 'feat_010',
    featureName: '跨域特征_10',
    featureType: 'llm_intent',
    featureDomain: 'cross_domain',
    ownerTeamName: 'LLM 特征治理组',
    alertType: 'drift',
    status: 'open',
    healthStatus: 'critical',
    title: '召回分布偏移',
    summary: '线上召回样本分布与评测期显著偏移，稳定性下降。',
    triggeredAt: '2026-04-25T09:45:00.000Z',
    currentValue: 0.27,
    thresholdValue: 0.2,
    relatedTicketId: null,
  },
  {
    id: 'alert_008',
    ruleId: 'rule_quality_cost_001',
    featureId: 'feat_011',
    featureName: '电商特征_11',
    featureType: 'sequence',
    featureDomain: 'transaction',
    ownerTeamName: '序列特征治理组',
    alertType: 'cost',
    status: 'resolved',
    healthStatus: 'critical',
    title: '成本超预算',
    summary: '向量检索成本抬升，已触发预算保护机制。',
    triggeredAt: '2026-04-25T09:50:00.000Z',
    currentValue: 1.38,
    thresholdValue: 1.15,
    relatedTicketId: 'ticket_003',
  },
];

const ticketStore: GovernanceTicket[] = [
  {
    id: 'ticket_001',
    ticketNo: 'QG-20260425-001',
    type: 'quality_fix',
    featureId: 'feat_005',
    title: '修复电商特征_5 的增量延迟',
    status: 'processing',
    severity: 'high',
    description: '增量计算链路延迟导致日更产物输出滞后，影响归因与实时调用。',
    assigneeUserId: 'user_producer_021',
    assigneeTeamId: 'team_quality_llm',
    assigneeUserName: '周岚',
    assigneeTeamName: 'LLM 特征治理组',
    reporterUserId: 'user_platform_001',
    reporterUserName: '李敏',
    reporterTeamId: 'team_platform',
    reporterTeamName: '平台治理',
    createdAt: '2026-04-25T09:25:00.000Z',
    resolvedAt: null,
    latestCommentAt: '2026-04-25T11:10:00.000Z',
    relatedAlertIds: ['alert_002'],
  },
  {
    id: 'ticket_002',
    ticketNo: 'QG-20260425-002',
    type: 'schema_review',
    featureId: 'feat_004',
    title: '评估跨域特征_4 的覆盖率回退风险',
    status: 'open',
    severity: 'medium',
    description: '跨域样本覆盖率下降，需确认是否为上游口径调整导致。',
    assigneeUserId: 'user_producer_014',
    assigneeTeamId: 'team_quality_vector',
    assigneeUserName: '陈卓',
    assigneeTeamName: '向量特征治理组',
    reporterUserId: 'user_platform_002',
    reporterUserName: '王乐',
    reporterTeamId: 'team_platform',
    reporterTeamName: '平台治理',
    createdAt: '2026-04-25T09:18:00.000Z',
    resolvedAt: null,
    latestCommentAt: '2026-04-25T10:02:00.000Z',
    relatedAlertIds: ['alert_001'],
  },
  {
    id: 'ticket_003',
    ticketNo: 'QG-20260425-003',
    type: 'publish_review',
    featureId: 'feat_009',
    title: '暂停生服特征_9 发布并处理 Schema 变更',
    status: 'resolved',
    severity: 'critical',
    description: 'Schema 变更导致下游消费失败，已要求暂停发布并补齐兼容层。',
    assigneeUserId: 'user_producer_003',
    assigneeTeamId: 'team_quality_vector',
    assigneeUserName: '刘启',
    assigneeTeamName: '向量特征治理组',
    reporterUserId: 'user_platform_003',
    reporterUserName: '高航',
    reporterTeamId: 'team_platform',
    reporterTeamName: '平台治理',
    createdAt: '2026-04-25T09:42:00.000Z',
    resolvedAt: '2026-04-25T13:20:00.000Z',
    latestCommentAt: '2026-04-25T13:18:00.000Z',
    relatedAlertIds: ['alert_006', 'alert_008'],
  },
  {
    id: 'ticket_004',
    ticketNo: 'QG-20260425-004',
    type: 'quality_fix',
    featureId: 'feat_007',
    title: '修复跨域特征_7 的离线补数任务',
    status: 'closed',
    severity: 'high',
    description: '补数脚本在跨域表 Join 阶段失败，已完成重跑并关闭问题单。',
    assigneeUserId: 'user_producer_017',
    assigneeTeamId: 'team_quality_sequence',
    assigneeUserName: '宋辰',
    assigneeTeamName: '序列特征治理组',
    reporterUserId: 'user_platform_002',
    reporterUserName: '王乐',
    reporterTeamId: 'team_platform',
    reporterTeamName: '平台治理',
    createdAt: '2026-04-25T09:31:00.000Z',
    resolvedAt: '2026-04-25T12:15:00.000Z',
    latestCommentAt: '2026-04-25T12:30:00.000Z',
    relatedAlertIds: ['alert_004'],
  },
  {
    id: 'ticket_005',
    ticketNo: 'QG-20260425-005',
    type: 'appeal',
    featureId: 'feat_008',
    title: '复核电商特征_8 的覆盖率告警阈值',
    status: 'processing',
    severity: 'low',
    description: '业务侧认为覆盖率阈值偏保守，申请复核规则配置与分层口径。',
    assigneeUserId: 'user_producer_005',
    assigneeTeamId: 'team_quality_algo',
    assigneeUserName: '何言',
    assigneeTeamName: '算法特征治理组',
    reporterUserId: 'user_producer_admin_001',
    reporterUserName: '王五',
    reporterTeamId: 'team_producer_admin',
    reporterTeamName: '特征供给平台主管',
    createdAt: '2026-04-25T09:37:00.000Z',
    resolvedAt: null,
    latestCommentAt: '2026-04-25T10:25:00.000Z',
    relatedAlertIds: ['alert_005'],
  },
];

const ticketDetailSeeds = new Map<string, TicketDetailSeed>([
  [
    'ticket_001',
    {
      impactSummary: '影响 2 个下游消费团队的日更归因结果，预计导致次日看板延后。',
      rootCauses: ['增量任务依赖的上游分区延迟', '补数任务未设置重试保护'],
      suggestedActions: ['为增量任务增加兜底分区', '补充失败自动重试与告警升级'],
      timeline: [
        {
          id: 'ticket_001_timeline_001',
          ticketId: 'ticket_001',
          type: 'created',
          operatorName: '李敏',
          summary: '创建工单并关联 freshness 告警。',
          createdAt: '2026-04-25T09:25:00.000Z',
        },
        {
          id: 'ticket_001_timeline_002',
          ticketId: 'ticket_001',
          type: 'assigned',
          operatorName: '平台治理系统',
          summary: '工单指派给 LLM 特征治理组。',
          createdAt: '2026-04-25T09:28:00.000Z',
        },
        {
          id: 'ticket_001_timeline_003',
          ticketId: 'ticket_001',
          type: 'status_changed',
          operatorName: '周岚',
          summary: '确认问题并进入处理中。',
          createdAt: '2026-04-25T09:45:00.000Z',
          toStatus: 'processing',
        },
      ],
    },
  ],
  [
    'ticket_002',
    {
      impactSummary: '覆盖率下滑尚未造成线上事故，但会影响治理看板排序和消费方推荐结果。',
      rootCauses: ['跨域样本白名单口径调整', '灰度链路未同步扩量'],
      suggestedActions: ['补齐白名单回放校验', '对比灰度与全量链路样本分布'],
      timeline: [
        {
          id: 'ticket_002_timeline_001',
          ticketId: 'ticket_002',
          type: 'created',
          operatorName: '王乐',
          summary: '根据覆盖率告警创建工单。',
          createdAt: '2026-04-25T09:18:00.000Z',
        },
      ],
    },
  ],
  [
    'ticket_003',
    {
      impactSummary: 'Schema 兼容问题已修复，相关发布流程已恢复。',
      rootCauses: ['上游枚举字段新增未同步协议', '下游消费方未做兜底兼容'],
      suggestedActions: ['建立 schema 变更前置校验', '为消费链路增加兜底默认值'],
      timeline: [
        {
          id: 'ticket_003_timeline_001',
          ticketId: 'ticket_003',
          type: 'created',
          operatorName: '高航',
          summary: 'Schema 变更触发发布阻断。',
          createdAt: '2026-04-25T09:42:00.000Z',
        },
        {
          id: 'ticket_003_timeline_002',
          ticketId: 'ticket_003',
          type: 'resolved',
          operatorName: '刘启',
          summary: '兼容层发布完成，恢复消费链路。',
          createdAt: '2026-04-25T13:20:00.000Z',
          toStatus: 'resolved',
        },
      ],
    },
  ],
  [
    'ticket_004',
    {
      impactSummary: '补数完成后健康度已回升，但仍保留一次回归观察。',
      rootCauses: ['Join 条件配置错误', '定时任务重跑缺少检查点'],
      suggestedActions: ['在补数前增加 SQL 校验', '保留一周回归监控'],
      timeline: [
        {
          id: 'ticket_004_timeline_001',
          ticketId: 'ticket_004',
          type: 'created',
          operatorName: '王乐',
          summary: '因离线补数失败创建工单。',
          createdAt: '2026-04-25T09:31:00.000Z',
        },
        {
          id: 'ticket_004_timeline_002',
          ticketId: 'ticket_004',
          type: 'closed',
          operatorName: '宋辰',
          summary: '回归验证通过，关闭工单。',
          createdAt: '2026-04-25T12:30:00.000Z',
          toStatus: 'closed',
        },
      ],
    },
  ],
  [
    'ticket_005',
    {
      impactSummary: '暂未影响发布，但需要评估规则阈值是否适配电商大促期样本波动。',
      rootCauses: ['覆盖率阈值沿用常态配置', '大促期间样本结构显著变化'],
      suggestedActions: ['引入节假日阈值模板', '在申诉期保留双口径对照'],
      timeline: [
        {
          id: 'ticket_005_timeline_001',
          ticketId: 'ticket_005',
          type: 'created',
          operatorName: '王五',
          summary: '治理负责人发起阈值申诉。',
          createdAt: '2026-04-25T09:37:00.000Z',
        },
        {
          id: 'ticket_005_timeline_002',
          ticketId: 'ticket_005',
          type: 'status_changed',
          operatorName: '何言',
          summary: '开始复核阈值策略。',
          createdAt: '2026-04-25T10:00:00.000Z',
          toStatus: 'processing',
        },
      ],
    },
  ],
]);

const ticketCommentsStore = new Map<string, GovernanceTicketComment[]>([
  [
    'ticket_001',
    [
      {
        id: 'ticket_001_comment_001',
        ticketId: 'ticket_001',
        authorUserId: 'user_platform_001',
        authorUserName: '李敏',
        authorTeamName: '平台治理',
        content: '已确认不是消费方请求量波动，请排查增量链路。',
        createdAt: '2026-04-25T09:32:00.000Z',
      },
      {
        id: 'ticket_001_comment_002',
        ticketId: 'ticket_001',
        authorUserId: 'user_producer_021',
        authorUserName: '周岚',
        authorTeamName: 'LLM 特征治理组',
        content: '正在重跑延迟分区，预计 30 分钟后恢复。',
        createdAt: '2026-04-25T11:10:00.000Z',
      },
    ],
  ],
  [
    'ticket_002',
    [
      {
        id: 'ticket_002_comment_001',
        ticketId: 'ticket_002',
        authorUserId: 'user_producer_014',
        authorUserName: '陈卓',
        authorTeamName: '向量特征治理组',
        content: '已定位到灰度样本未扩量，待补齐后再看趋势。',
        createdAt: '2026-04-25T10:02:00.000Z',
      },
    ],
  ],
  [
    'ticket_003',
    [
      {
        id: 'ticket_003_comment_001',
        ticketId: 'ticket_003',
        authorUserId: 'user_producer_003',
        authorUserName: '刘启',
        authorTeamName: '向量特征治理组',
        content: '兼容层已发布，正在验证下游恢复情况。',
        createdAt: '2026-04-25T13:18:00.000Z',
      },
    ],
  ],
  [
    'ticket_004',
    [
      {
        id: 'ticket_004_comment_001',
        ticketId: 'ticket_004',
        authorUserId: 'user_producer_017',
        authorUserName: '宋辰',
        authorTeamName: '序列特征治理组',
        content: '补数已重跑完成，建议保留一日观察后关闭。',
        createdAt: '2026-04-25T12:05:00.000Z',
      },
    ],
  ],
  [
    'ticket_005',
    [
      {
        id: 'ticket_005_comment_001',
        ticketId: 'ticket_005',
        authorUserId: 'user_producer_005',
        authorUserName: '何言',
        authorTeamName: '算法特征治理组',
        content: '已开始对比大促期与常态期覆盖率阈值差异。',
        createdAt: '2026-04-25T10:25:00.000Z',
      },
    ],
  ],
]);

const ticketTimelineStore = new Map<string, GovernanceTicketTimelineEntry[]>(
  Array.from(ticketDetailSeeds.entries()).map(([ticketId, seed]) => [ticketId, seed.timeline.map(clone)]),
);

const attributionStore: AttributionRecord[] = [
  {
    id: 'attr_001',
    featureId: 'feat_001',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sourceChannel: 'marketplace',
    attributedRevenue: 820000,
    attributedOrders: 12600,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_001',
    metricBreakdown: { CTR: 2.8, CVR: 1.6, ROI: 1.32, MAC: -16, GMV: 82, 'AB收益': 19 },
    rankInDomain: 2,
  },
  {
    id: 'attr_002',
    featureId: 'feat_001',
    consumerTeamId: 'team_ecommerce',
    consumerTeamName: '电商策略',
    sourceChannel: 'api',
    attributedRevenue: 610000,
    attributedOrders: 9300,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_001',
    metricBreakdown: { CTR: 2.5, CVR: 1.4, ROI: 1.28, MAC: -14, GMV: 61, 'AB收益': 15 },
    rankInDomain: 2,
  },
  {
    id: 'attr_003',
    featureId: 'feat_003',
    consumerTeamId: 'team_local_growth',
    consumerTeamName: '本地生活增长',
    sourceChannel: 'foundry',
    attributedRevenue: 910000,
    attributedOrders: 13400,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_002',
    metricBreakdown: { CTR: 3.1, CVR: 1.9, ROI: 1.38, MAC: -20, GMV: 91, 'AB收益': 23 },
    rankInDomain: 1,
  },
  {
    id: 'attr_004',
    featureId: 'feat_003',
    consumerTeamId: 'team_trade_pm',
    consumerTeamName: '交易产品',
    sourceChannel: 'internal',
    attributedRevenue: 560000,
    attributedOrders: 8700,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_002',
    metricBreakdown: { CTR: 2.2, CVR: 1.2, ROI: 1.21, MAC: -11, GMV: 56, 'AB收益': 12 },
    rankInDomain: 1,
  },
  {
    id: 'attr_005',
    featureId: 'feat_006',
    consumerTeamId: 'team_content_ops',
    consumerTeamName: '内容运营',
    sourceChannel: 'batch',
    attributedRevenue: 430000,
    attributedOrders: 6200,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_006',
    metricBreakdown: { CTR: 1.8, CVR: 1.1, ROI: 1.15, MAC: -8, GMV: 43, 'AB收益': 9 },
    rankInDomain: 3,
  },
  {
    id: 'attr_006',
    featureId: 'feat_008',
    consumerTeamId: 'team_ecommerce',
    consumerTeamName: '电商策略',
    sourceChannel: 'api',
    attributedRevenue: 760000,
    attributedOrders: 10900,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_008',
    metricBreakdown: { CTR: 2.6, CVR: 1.5, ROI: 1.3, MAC: -15, GMV: 76, 'AB收益': 18 },
    rankInDomain: 2,
  },
  {
    id: 'attr_007',
    featureId: 'feat_008',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sourceChannel: 'marketplace',
    attributedRevenue: 540000,
    attributedOrders: 7600,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_008',
    metricBreakdown: { CTR: 2.1, CVR: 1.3, ROI: 1.19, MAC: -9, GMV: 54, 'AB收益': 11 },
    rankInDomain: 2,
  },
  {
    id: 'attr_008',
    featureId: 'feat_010',
    consumerTeamId: 'team_local_growth',
    consumerTeamName: '本地生活增长',
    sourceChannel: 'foundry',
    attributedRevenue: 690000,
    attributedOrders: 9800,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_010',
    metricBreakdown: { CTR: 2.4, CVR: 1.5, ROI: 1.27, MAC: -12, GMV: 69, 'AB收益': 16 },
    rankInDomain: 3,
  },
  {
    id: 'attr_009',
    featureId: 'feat_012',
    consumerTeamId: 'team_trade_pm',
    consumerTeamName: '交易产品',
    sourceChannel: 'internal',
    attributedRevenue: 980000,
    attributedOrders: 14300,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_012',
    metricBreakdown: { CTR: 3.3, CVR: 2.1, ROI: 1.45, MAC: -22, GMV: 98, 'AB收益': 24 },
    rankInDomain: 1,
  },
  {
    id: 'attr_010',
    featureId: 'feat_012',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sourceChannel: 'marketplace',
    attributedRevenue: 710000,
    attributedOrders: 10200,
    windowDays: 30,
    calculatedAt: '2026-04-25T10:00:00.000Z',
    ownerUserId: 'user_producer_012',
    metricBreakdown: { CTR: 2.7, CVR: 1.8, ROI: 1.33, MAC: -17, GMV: 71, 'AB收益': 17 },
    rankInDomain: 1,
  },
];

const consumptionStore: ConsumptionRecord[] = [
  {
    id: 'cons_001',
    featureId: 'feat_001',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sceneName: '会员召回',
    channel: 'marketplace',
    consumedAt: '2026-04-25T08:30:00.000Z',
    requestCount: 420000,
    successRate: 0.992,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.11,
    gmvContribution: 280000,
    roiLift: 0.18,
  },
  {
    id: 'cons_002',
    featureId: 'feat_001',
    consumerTeamId: 'team_ecommerce',
    consumerTeamName: '电商策略',
    sceneName: '券包投放',
    channel: 'api',
    consumedAt: '2026-04-25T08:50:00.000Z',
    requestCount: 350000,
    successRate: 0.988,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.09,
    gmvContribution: 230000,
    roiLift: 0.15,
  },
  {
    id: 'cons_003',
    featureId: 'feat_003',
    consumerTeamId: 'team_local_growth',
    consumerTeamName: '本地生活增长',
    sceneName: '到店促活',
    channel: 'foundry',
    consumedAt: '2026-04-25T09:00:00.000Z',
    requestCount: 390000,
    successRate: 0.985,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.14,
    gmvContribution: 310000,
    roiLift: 0.2,
  },
  {
    id: 'cons_004',
    featureId: 'feat_003',
    consumerTeamId: 'team_trade_pm',
    consumerTeamName: '交易产品',
    sceneName: '统一策略分层',
    channel: 'internal',
    consumedAt: '2026-04-25T09:10:00.000Z',
    requestCount: 280000,
    successRate: 0.981,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.08,
    gmvContribution: 170000,
    roiLift: 0.12,
  },
  {
    id: 'cons_005',
    featureId: 'feat_006',
    consumerTeamId: 'team_content_ops',
    consumerTeamName: '内容运营',
    sceneName: '内容推荐过滤',
    channel: 'batch',
    consumedAt: '2026-04-25T09:15:00.000Z',
    requestCount: 220000,
    successRate: 0.974,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.05,
    gmvContribution: 120000,
    roiLift: 0.08,
  },
  {
    id: 'cons_006',
    featureId: 'feat_008',
    consumerTeamId: 'team_ecommerce',
    consumerTeamName: '电商策略',
    sceneName: '大促加权排序',
    channel: 'api',
    consumedAt: '2026-04-25T09:20:00.000Z',
    requestCount: 460000,
    successRate: 0.977,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.12,
    gmvContribution: 260000,
    roiLift: 0.16,
  },
  {
    id: 'cons_007',
    featureId: 'feat_008',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sceneName: '新客拉新',
    channel: 'marketplace',
    consumedAt: '2026-04-25T09:26:00.000Z',
    requestCount: 300000,
    successRate: 0.983,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.07,
    gmvContribution: 180000,
    roiLift: 0.1,
  },
  {
    id: 'cons_008',
    featureId: 'feat_010',
    consumerTeamId: 'team_local_growth',
    consumerTeamName: '本地生活增长',
    sceneName: '门店券核销',
    channel: 'foundry',
    consumedAt: '2026-04-25T09:30:00.000Z',
    requestCount: 260000,
    successRate: 0.968,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.09,
    gmvContribution: 210000,
    roiLift: 0.13,
  },
  {
    id: 'cons_009',
    featureId: 'feat_012',
    consumerTeamId: 'team_trade_pm',
    consumerTeamName: '交易产品',
    sceneName: '全域排序增强',
    channel: 'internal',
    consumedAt: '2026-04-25T09:36:00.000Z',
    requestCount: 510000,
    successRate: 0.994,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.16,
    gmvContribution: 360000,
    roiLift: 0.22,
  },
  {
    id: 'cons_010',
    featureId: 'feat_012',
    consumerTeamId: 'team_growth',
    consumerTeamName: '增长运营',
    sceneName: '会员精细化运营',
    channel: 'marketplace',
    consumedAt: '2026-04-25T09:40:00.000Z',
    requestCount: 400000,
    successRate: 0.991,
    consumerUserId: null,
    consumerUserName: null,
    abEffect: 0.13,
    gmvContribution: 250000,
    roiLift: 0.17,
  },
];

const attributionTrendSeed = new Map<string, AttributionTrendSeed[]>([
  [
    'feat_001',
    [
      { period: '2026-W14', metricValues: { CTR: 2.1, CVR: 1.2, ROI: 1.18, MAC: -10, GMV: 54, 'AB收益': 11 } },
      { period: '2026-W15', metricValues: { CTR: 2.3, CVR: 1.3, ROI: 1.22, MAC: -12, GMV: 61, 'AB收益': 13 } },
      { period: '2026-W16', metricValues: { CTR: 2.6, CVR: 1.5, ROI: 1.27, MAC: -14, GMV: 68, 'AB收益': 16 } },
      { period: '2026-W17', metricValues: { CTR: 2.8, CVR: 1.6, ROI: 1.3, MAC: -15, GMV: 72, 'AB收益': 17 } },
    ],
  ],
  [
    'feat_003',
    [
      { period: '2026-W14', metricValues: { CTR: 2.4, CVR: 1.4, ROI: 1.22, MAC: -12, GMV: 63, 'AB收益': 14 } },
      { period: '2026-W15', metricValues: { CTR: 2.6, CVR: 1.6, ROI: 1.28, MAC: -15, GMV: 74, 'AB收益': 17 } },
      { period: '2026-W16', metricValues: { CTR: 2.9, CVR: 1.8, ROI: 1.34, MAC: -18, GMV: 83, 'AB收益': 20 } },
      { period: '2026-W17', metricValues: { CTR: 3.1, CVR: 1.9, ROI: 1.37, MAC: -19, GMV: 89, 'AB收益': 22 } },
    ],
  ],
  [
    'feat_008',
    [
      { period: '2026-W14', metricValues: { CTR: 1.9, CVR: 1.1, ROI: 1.12, MAC: -7, GMV: 41, 'AB收益': 9 } },
      { period: '2026-W15', metricValues: { CTR: 2.1, CVR: 1.2, ROI: 1.17, MAC: -9, GMV: 49, 'AB收益': 11 } },
      { period: '2026-W16', metricValues: { CTR: 2.4, CVR: 1.4, ROI: 1.24, MAC: -12, GMV: 59, 'AB收益': 14 } },
      { period: '2026-W17', metricValues: { CTR: 2.6, CVR: 1.5, ROI: 1.28, MAC: -13, GMV: 66, 'AB收益': 16 } },
    ],
  ],
  [
    'feat_012',
    [
      { period: '2026-W14', metricValues: { CTR: 2.8, CVR: 1.7, ROI: 1.29, MAC: -15, GMV: 72, 'AB收益': 17 } },
      { period: '2026-W15', metricValues: { CTR: 3.0, CVR: 1.9, ROI: 1.35, MAC: -18, GMV: 84, 'AB收益': 20 } },
      { period: '2026-W16', metricValues: { CTR: 3.2, CVR: 2.0, ROI: 1.41, MAC: -20, GMV: 95, 'AB收益': 23 } },
      { period: '2026-W17', metricValues: { CTR: 3.3, CVR: 2.1, ROI: 1.44, MAC: -21, GMV: 101, 'AB收益': 24 } },
    ],
  ],
]);

let commentSequence = 1000;

function nextMutationTime(sequence: number) {
  const date = new Date('2026-04-25T14:00:00.000Z');
  date.setUTCMinutes(date.getUTCMinutes() + (sequence - 1000));
  return date.toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getFeatureOrThrow(featureId: string) {
  const feature = featureById.get(featureId);
  if (!feature) {
    throw new Error(`Unknown quality feature id: ${featureId}`);
  }
  return feature;
}

function toFeatureDomain(feature: Feature): FeatureDomain {
  if (feature.namespace.includes('ecommerce')) return 'transaction';
  if (feature.namespace.includes('lifestyle')) return 'content_profile';
  return 'cross_domain';
}

function toUpdateFrequency(feature: Feature): UpdateFrequency {
  const freshness = feature.health.freshness;
  if (freshness === 'realtime') return 'realtime';
  if (freshness === 'T+7') return 'weekly';
  return 'daily';
}

function toHealthStatus(score: number): QualityHealthStatus {
  if (score >= 85) return 'healthy';
  if (score >= 70) return 'warning';
  return 'critical';
}

function inferAffectedDimensions(seed: SnapshotSeed): EvaluationDimension[] {
  const affected: EvaluationDimension[] = [];
  if (seed.freshnessHours >= 36) affected.push('freshness');
  if (seed.coverageRate < 0.78) affected.push('coverage');
  if (seed.stabilityRate < 0.77) affected.push('stability');
  return affected.length ? affected : ['accuracy'];
}

function getOwner(feature: Feature) {
  return ownerByType[feature.type];
}

function buildQualitySnapshot(seed: SnapshotSeed) {
  const feature = getFeatureOrThrow(seed.featureId);
  const owner = getOwner(feature);

  return {
    id: `${seed.featureId}_snapshot_latest`,
    featureId: seed.featureId,
    snapshotAt: seed.snapshotAt,
    score: seed.score,
    freshnessHours: seed.freshnessHours,
    coverageRate: seed.coverageRate,
    stabilityRate: seed.stabilityRate,
    latestAlertType: seed.latestAlertType,
    latestAlertMessage: seed.latestAlertMessage,
    status: toHealthStatus(seed.score),
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: toFeatureDomain(feature),
    ownerTeamId: owner.teamId,
    ownerTeamName: owner.teamName,
    affectedDimensions: inferAffectedDimensions(seed),
  };
}

function sumMetric(records: AttributionRecord[], key: QualityMetricKey) {
  if (!records.length) return 0;
  const total = records.reduce((sum, record) => sum + (record.metricBreakdown?.[key] ?? 0), 0);
  return Number((total / records.length).toFixed(key === 'ROI' ? 2 : 1));
}

function buildRankingItems() {
  const recordsByFeature = new Map<string, AttributionRecord[]>();

  for (const record of attributionStore) {
    const list = recordsByFeature.get(record.featureId) ?? [];
    list.push(record);
    recordsByFeature.set(record.featureId, list);
  }

  const items = Array.from(recordsByFeature.entries())
    .map(([featureId, records]) => {
      const feature = getFeatureOrThrow(featureId);
      const owner = getOwner(feature);
      return {
        featureId,
        featureName: feature.name,
        featureType: feature.type,
        featureDomain: toFeatureDomain(feature),
        ownerTeamName: owner.teamName,
        rank: 0,
        totalRevenue: records.reduce((sum, record) => sum + record.attributedRevenue, 0),
        totalOrders: records.reduce((sum, record) => sum + record.attributedOrders, 0),
        totalConsumptionTeams: new Set(records.map((record) => record.consumerTeamName)).size,
        metricBreakdown: {
          CTR: sumMetric(records, 'CTR'),
          CVR: sumMetric(records, 'CVR'),
          ROI: sumMetric(records, 'ROI'),
          MAC: sumMetric(records, 'MAC'),
          GMV: sumMetric(records, 'GMV'),
          'AB收益': sumMetric(records, 'AB收益'),
        },
      } satisfies QualityValueRankingItem;
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return items;
}

function buildTrend(featureId: string, windowDays: 30 | 60 | 90): QualityTrendPoint[] {
  const feature = getFeatureOrThrow(featureId);
  const endDate = new Date('2026-04-25T00:00:00.000Z');
  const span = Math.max(1, Math.floor(windowDays / Math.max(feature.trend_30d.length - 1, 1)));
  const windowBias = windowDays === 90 ? -0.05 : windowDays === 60 ? -0.025 : 0;

  return feature.trend_30d.map((point, index) => {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - span * (feature.trend_30d.length - 1 - index));

    const accuracyRate = Number(Math.max(point.accuracy + windowBias, 0.6).toFixed(3));
    const coverageRate = Number(Math.max(point.coverage + windowBias / 2, 0.58).toFixed(3));
    const stabilityRate = Number(Math.max(accuracyRate - 0.03, 0.62).toFixed(3));

    return {
      date: date.toISOString().slice(0, 10),
      score: Number((((accuracyRate + coverageRate + stabilityRate) / 3) * 100).toFixed(1)),
      accuracyRate,
      coverageRate,
      stabilityRate,
      freshnessHours: windowDays === 30 ? 24 : windowDays === 60 ? 30 : 36,
      alertCount: index >= feature.trend_30d.length - 3 && windowDays !== 30 ? 1 : 0,
    };
  });
}

function normalizeFormat(format?: QualityExportFormat): QualityExportFormat {
  return format ?? 'xlsx';
}

const qualitySnapshots = snapshotSeeds.map(buildQualitySnapshot);

const backtestStatusPool: BacktestJob['status'][] = ['completed', 'completed', 'running', 'pending', 'failed'];
const backtestScenarioPool: BacktestScenario[] = ['future_behavior', 'mask_interest'];
const backtestTriggerPool: BacktestTriggerType[] = ['scheduled', 'manual', 'gate'];

const healthWeightMatrixByFeatureType: Record<FeatureType, Record<HealthScoreSource, number>> = {
  rule: {
    static_evaluation: 0.35,
    auto_backtest: 0.3,
    self_review: 0.2,
    llm_judgement: 0,
    human_eval: 0,
    questionnaire: 0.15,
  },
  sequence: {
    static_evaluation: 0.3,
    auto_backtest: 0.3,
    self_review: 0.2,
    llm_judgement: 0,
    human_eval: 0,
    questionnaire: 0.2,
  },
  algo: {
    static_evaluation: 0.28,
    auto_backtest: 0.32,
    self_review: 0.15,
    llm_judgement: 0.15,
    human_eval: 0,
    questionnaire: 0.1,
  },
  vector: {
    static_evaluation: 0.28,
    auto_backtest: 0.32,
    self_review: 0.15,
    llm_judgement: 0.15,
    human_eval: 0,
    questionnaire: 0.1,
  },
  llm_intent: {
    static_evaluation: 0.18,
    auto_backtest: 0.27,
    self_review: 0.15,
    llm_judgement: 0.25,
    human_eval: 0,
    questionnaire: 0.15,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function buildBacktestMetrics(snapshot: (typeof qualitySnapshots)[number], index: number): BacktestMetrics {
  const staticAccuracy = round(clamp(snapshot.score / 100 + 0.015, 0.7, 0.98));
  const driftBias = index % 10 === 4 ? -0.082 : index % 6 === 2 ? -0.038 : (index % 5) * 0.004 - 0.01;
  const accuracy = round(clamp(staticAccuracy + driftBias, 0.63, 0.97));
  const recallAtK = round(clamp(accuracy - 0.055 + (index % 4) * 0.008, 0.58, 0.95));
  const auc = round(clamp(accuracy + 0.06 - (index % 3) * 0.005, 0.7, 0.99));
  const precision = round(clamp(accuracy - 0.02 + (index % 2) * 0.01, 0.6, 0.96));
  const baselineAccuracy = round(clamp(staticAccuracy - 0.03 + (index % 3) * 0.004, 0.64, 0.95));
  const accuracyDelta = round(accuracy - staticAccuracy);
  const driftScore = round(Math.abs(accuracyDelta) + 0.04 + (index % 4) * 0.012);

  return {
    sampleSize: 18000 + (index % 8) * 5200,
    accuracy,
    recallAtK,
    auc,
    lift: round((accuracy - baselineAccuracy) * 100, 2),
    precision,
    baselineAccuracy,
    staticAccuracy,
    driftScore,
    accuracyDelta,
    gateThreshold: round(baselineAccuracy - 0.05),
  };
}

function buildBacktestTrend(metrics: BacktestMetrics, index: number) {
  const endDate = new Date('2026-04-26T00:00:00.000Z');
  return Array.from({ length: 30 }, (_, pointIndex) => {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - (29 - pointIndex));
    const wave = ((pointIndex + index) % 6) - 2;
    const accuracy = round(clamp(metrics.accuracy + wave * 0.004 - 0.01, 0.6, 0.98));
    return {
      date: date.toISOString().slice(0, 10),
      accuracy,
      recallAtK: round(clamp(metrics.recallAtK + wave * 0.003, 0.56, 0.96)),
      auc: round(clamp(metrics.auc + wave * 0.002, 0.7, 0.99)),
      lift: round(metrics.lift + wave * 0.3, 2),
      sampleSize: Math.max(metrics.sampleSize + wave * 320, 12000),
      driftScore: round(clamp(Math.abs(accuracy - metrics.staticAccuracy) + 0.035, 0.03, 0.3)),
    };
  });
}

const backtestJobsStore: BacktestJob[] = Array.from({ length: 40 }, (_, index) => {
  const snapshot = qualitySnapshots[index % qualitySnapshots.length];
  const createdAt = new Date('2026-04-26T09:00:00.000Z');
  createdAt.setUTCHours(createdAt.getUTCHours() - index * 4);

  const status = backtestStatusPool[index % backtestStatusPool.length];
  const metrics = buildBacktestMetrics(snapshot, index);
  const startedAt = status === 'pending' ? null : new Date(createdAt.getTime() + 15 * 60 * 1000).toISOString();
  const finishedAt =
    status === 'completed'
      ? new Date(createdAt.getTime() + 95 * 60 * 1000).toISOString()
      : status === 'failed'
        ? new Date(createdAt.getTime() + 38 * 60 * 1000).toISOString()
        : null;
  const driftAlert = metrics.driftScore >= 0.12 || metrics.accuracyDelta <= -0.05;

  return {
    id: `bt_job_${String(index + 1).padStart(3, '0')}`,
    featureId: snapshot.featureId,
    featureName: snapshot.featureName ?? getFeatureOrThrow(snapshot.featureId).name,
    featureType: snapshot.featureType ?? getFeatureOrThrow(snapshot.featureId).type,
    featureDomain: snapshot.featureDomain ?? toFeatureDomain(getFeatureOrThrow(snapshot.featureId)),
    ownerTeamName: snapshot.ownerTeamName ?? getOwner(getFeatureOrThrow(snapshot.featureId)).teamName,
    scenario: backtestScenarioPool[index % backtestScenarioPool.length],
    status,
    triggerType: backtestTriggerPool[index % backtestTriggerPool.length],
    createdAt: createdAt.toISOString(),
    startedAt,
    finishedAt,
    sampleWindowDays: ([7, 14, 30] as const)[index % 3],
    metrics: status === 'pending' || status === 'failed' ? null : metrics,
    recentTrend: status === 'pending' ? [] : buildBacktestTrend(metrics, index),
    driftAlert,
    relatedTicketId:
      status === 'failed'
        ? ticketStore[index % ticketStore.length]?.id ?? null
        : driftAlert && index % 3 === 0
          ? ticketStore[(index + 1) % ticketStore.length]?.id ?? null
          : null,
    failureReason:
      status === 'failed'
        ? index % 2 === 0
          ? '回放样本映射失败，用户主键桥接表未命中。'
          : '评测算子超时，AUC 聚合阶段被系统熔断。'
        : null,
  };
});

const selfReviewTemplates: SelfReviewTemplate[] = [
  {
    id: 'review_tpl_rule_v1',
    featureType: 'rule',
    name: '规则特征上线自评模板',
    version: 'v1.0',
    passingScore: 18,
    description: '适用于规则类特征的口径完备、回归验证和兜底自评。',
    items: [
      {
        id: 'review_rule_001',
        group: '口径定义',
        title: '规则字段口径已对齐消费方',
        description: '需覆盖字段定义、默认值与异常分支。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查口径文档、字段注释、默认值样例',
        autoCheckStatus: 'pass',
        autoCheckSummary: '口径文档和字段注释已齐全。',
        guidance: '建议附带 2 个线上真实样例。',
      },
      {
        id: 'review_rule_002',
        group: '工程质量',
        title: '规则变更存在回归用例',
        description: '需提供核心分支的单测或回放样本。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查单测文件与回放报告链接',
        autoCheckStatus: 'warn',
        autoCheckSummary: '已有回放报告，但缺 1 个边界样例单测。',
        guidance: '补齐兜底路径和空值分支验证。',
      },
      {
        id: 'review_rule_003',
        group: '样本准备',
        title: '回测样本覆盖主场景和灰度场景',
        description: '至少包含主链路与灰度链路各一组样本。',
        required: true,
        maxScore: 4,
        autoCheckRule: '校验样本分层标签与数量',
        autoCheckStatus: 'pass',
        autoCheckSummary: '主场景/灰度场景样本覆盖达标。',
        guidance: '大促样本建议单独留档。',
      },
      {
        id: 'review_rule_004',
        group: '验证闭环',
        title: '上线前回退预案明确',
        description: '需要定义告警条件、回退入口和责任人。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查工单模板与应急联系人',
        autoCheckStatus: 'pass',
        autoCheckSummary: '已配置降级阈值和责任团队。',
        guidance: '保留 24 小时观察期策略。',
      },
    ],
  },
  {
    id: 'review_tpl_sequence_v1',
    featureType: 'sequence',
    name: '序列特征数据链路自评模板',
    version: 'v1.0',
    passingScore: 17,
    description: '适用于序列类特征的窗口一致性、补数和样本完备性自评。',
    items: [
      {
        id: 'review_sequence_001',
        group: '样本准备',
        title: '窗口期样本覆盖近 30 天',
        description: '需要验证主窗口与补数窗口一致性。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查窗口配置和采样报告',
        autoCheckStatus: 'pass',
        autoCheckSummary: '近 30 天窗口样本覆盖完整。',
        guidance: '建议补充节假日波动样本。',
      },
      {
        id: 'review_sequence_002',
        group: '工程质量',
        title: '补数脚本可回放',
        description: '要求产出补数脚本和重放步骤。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查补数脚本与重跑 SOP',
        autoCheckStatus: 'warn',
        autoCheckSummary: '脚本存在，但缺少分区异常处理说明。',
        guidance: '补齐失败重试与检查点策略。',
      },
      {
        id: 'review_sequence_003',
        group: '口径定义',
        title: '序列截断和补齐策略已说明',
        description: '需覆盖截断长度、补零/补空策略。',
        required: true,
        maxScore: 4,
        autoCheckRule: '校验特征说明文档中的序列策略',
        autoCheckStatus: 'pass',
        autoCheckSummary: '截断和补齐策略已注明。',
        guidance: '建议增加极端长序列样例。',
      },
      {
        id: 'review_sequence_004',
        group: '风险兜底',
        title: '上游延迟有熔断与降级策略',
        description: '要求定义延迟阈值和降级路径。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查监控阈值和回退方案',
        autoCheckStatus: 'pass',
        autoCheckSummary: '上游延迟监控与降级策略已存在。',
        guidance: '建议保留离线补数人工介入入口。',
      },
    ],
  },
  {
    id: 'review_tpl_algo_v1',
    featureType: 'algo',
    name: '推理特征效果自评模板',
    version: 'v1.0',
    passingScore: 18,
    description: '适用于算法推理类特征的效果、漂移和实验结论自评。',
    items: [
      {
        id: 'review_algo_001',
        group: '验证闭环',
        title: '离线效果与线上基线已对齐',
        description: '需要给出 accuracy/AUC 与线上基线对比。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查评测报告和线上基线链接',
        autoCheckStatus: 'pass',
        autoCheckSummary: '离线效果和线上基线已建立映射。',
        guidance: '建议补充近 7 日分场景指标。',
      },
      {
        id: 'review_algo_002',
        group: '样本准备',
        title: '训练样本具备负样本均衡策略',
        description: '需说明采样比例与偏置控制。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查采样配置与样本报告',
        autoCheckStatus: 'warn',
        autoCheckSummary: '采样配置存在，但缺少偏置解释。',
        guidance: '补充 hard negative 的来源说明。',
      },
      {
        id: 'review_algo_003',
        group: '工程质量',
        title: '特征漂移告警已配置',
        description: '需提供 PSI 或分布漂移监控。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查漂移监控规则',
        autoCheckStatus: 'pass',
        autoCheckSummary: '漂移监控规则已接入。',
        guidance: '建议加入召回分布 TopK 对照。',
      },
      {
        id: 'review_algo_004',
        group: '风险兜底',
        title: '失败可降级到上一版本',
        description: '要求具备版本回退和灰度开关。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查版本回退与灰度策略',
        autoCheckStatus: 'pass',
        autoCheckSummary: '支持上一版本回退和灰度止损。',
        guidance: '保留灰度阈值调整记录。',
      },
    ],
  },
  {
    id: 'review_tpl_vector_v1',
    featureType: 'vector',
    name: '向量特征检索自评模板',
    version: 'v1.0',
    passingScore: 17,
    description: '适用于向量类特征的召回质量、索引成本和链路兼容性自评。',
    items: [
      {
        id: 'review_vector_001',
        group: '验证闭环',
        title: '召回质量达到场景基线',
        description: '需说明 recall@k 与基线差异。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查召回评测报告',
        autoCheckStatus: 'pass',
        autoCheckSummary: '召回质量达到基线。',
        guidance: '建议保留冷启动样本单独看板。',
      },
      {
        id: 'review_vector_002',
        group: '工程质量',
        title: '索引构建与重建成本可控',
        description: '需说明构建耗时和成本阈值。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查索引构建日志与预算',
        autoCheckStatus: 'warn',
        autoCheckSummary: '预算已记录，但成本波动说明不全。',
        guidance: '补充峰值流量期间的预算预案。',
      },
      {
        id: 'review_vector_003',
        group: '口径定义',
        title: '向量维度与归一化策略明确',
        description: '需要说明维度、归一化和距离度量。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查特征说明与索引配置',
        autoCheckStatus: 'pass',
        autoCheckSummary: '向量维度与归一化策略已登记。',
        guidance: '可附加一组线上示例向量。',
      },
      {
        id: 'review_vector_004',
        group: '风险兜底',
        title: '检索超时可回退',
        description: '要求提供超时阈值与降级策略。',
        required: true,
        maxScore: 4,
        autoCheckRule: '检查检索超时和降级开关',
        autoCheckStatus: 'pass',
        autoCheckSummary: '已配置超时熔断和回退。',
        guidance: '建议保留旁路召回对照。',
      },
    ],
  },
  {
    id: 'review_tpl_llm_v1',
    featureType: 'llm_intent',
    name: 'LLM 意图特征自评模板',
    version: 'v1.0',
    passingScore: 19,
    description: '适用于 LLM 意图类特征的提示词、样本审查和人工兜底自评。',
    items: [
      {
        id: 'review_llm_001',
        group: '口径定义',
        title: '提示词版本和口径说明齐全',
        description: '需要记录 prompt 版本和意图定义边界。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查 prompt 版本、意图定义和示例',
        autoCheckStatus: 'pass',
        autoCheckSummary: 'prompt 版本与意图定义已留档。',
        guidance: '建议增加误判样本集。',
      },
      {
        id: 'review_llm_002',
        group: '样本准备',
        title: '高风险样本完成人工抽检',
        description: '要求覆盖歧义、越权、脏词等样本。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查高风险样本抽检记录',
        autoCheckStatus: 'warn',
        autoCheckSummary: '已抽检主样本，但脏词样本覆盖不足。',
        guidance: '补充高风险输入对照集。',
      },
      {
        id: 'review_llm_003',
        group: '验证闭环',
        title: '线上回放和人工兜底策略存在',
        description: '需要提供回放结论与人工兜底入口。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查回放报告和人工兜底流程',
        autoCheckStatus: 'pass',
        autoCheckSummary: '回放报告和人工兜底策略已存在。',
        guidance: '建议增加版本回滚开关说明。',
      },
      {
        id: 'review_llm_004',
        group: '风险兜底',
        title: '敏感场景有禁用/降级阈值',
        description: '需定义风险阈值与自动降级路径。',
        required: true,
        maxScore: 5,
        autoCheckRule: '检查风险阈值和降级配置',
        autoCheckStatus: 'pass',
        autoCheckSummary: '敏感场景禁用阈值和降级路径已配置。',
        guidance: '保留人工复核升级开关。',
      },
    ],
  },
];

const selfReviewTemplateByType = new Map(selfReviewTemplates.map((template) => [template.featureType, template]));

const selfReviewSeedFeatures = rawFeatures
  .filter((feature, index, list) => list.findIndex((item) => item.type === feature.type) === index)
  .slice(0, 3);

const selfReviewRecordsStore: SelfReviewRecord[] = selfReviewSeedFeatures.map((feature, index) => {
  const template = selfReviewTemplateByType.get(feature.type) ?? selfReviewTemplates[0];
  const status = (['passed', 'submitted', 'failed'] as const)[index];
  const itemScores = template.items.map((item, itemIndex) => {
    const baseScore = status === 'failed' && itemIndex >= 2 ? Math.max(item.maxScore - 3, 1) : item.maxScore - (itemIndex % 2);
    return {
      ...clone(item),
      score: baseScore,
      comment:
        status === 'failed' && itemIndex >= 2
          ? '存在缺口，需补齐说明与兜底。'
          : itemIndex % 2 === 0
            ? '已完成并有对应证据链接。'
            : '已完成，建议补充更多样本说明。',
    };
  });
  const totalScore = itemScores.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const maxScore = itemScores.reduce((sum, item) => sum + item.maxScore, 0);
  const timestamp = new Date('2026-04-25T15:00:00.000Z');
  timestamp.setUTCHours(timestamp.getUTCHours() - index * 18);

  return {
    id: `self_review_${String(index + 1).padStart(3, '0')}`,
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    templateId: template.id,
    templateName: template.name,
    reviewerUserName: ['周岚', '宋辰', '何言'][index] ?? '评测同学',
    reviewerTeamName: getOwner(feature).teamName,
    status,
    totalScore,
    maxScore,
    progressRate: round(totalScore / Math.max(maxScore, 1), 2),
    submittedAt: status === 'submitted' || status === 'passed' || status === 'failed' ? timestamp.toISOString() : null,
    createdAt: new Date(timestamp.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: timestamp.toISOString(),
    recommendation:
      status === 'passed'
        ? '建议推进到 evaluating，并继续观察近 7 天漂移。'
        : status === 'failed'
          ? '建议回退到 draft，优先补样本和兜底策略。'
          : '可继续补充证据后提交正式评审。',
    nextLifecycleStage: status === 'passed' ? 'evaluating' : 'draft',
    aiSuggestions: [
      '补充近 30 天主场景与灰度场景样本对照。',
      '把自动预检失败项直接挂到发布门禁说明里。',
      '保留一条失败样例和对应回退路径说明。',
    ],
    items: itemScores,
  };
});

const selfReviewSuggestionsByFeatureId = new Map(
  selfReviewRecordsStore.map((record) => [record.featureId, record.aiSuggestions]),
);

type LLMJudgeRunCreateInput = {
  featureId: string;
  templateId: string;
  judgeModel: string;
  sampleSize: number;
  triggerMode: LLMJudgeRun['triggerMode'];
};

type LLMJudgePromptTemplateSaveInput = {
  name?: string;
  featureType?: FeatureType;
  featureDomain?: FeatureDomain;
  description?: string;
  judgeModel?: string;
  prompt: string;
  rubric: string[];
  fewShots: LLMJudgeFewShotExample[];
  tags?: string[];
  operator: string;
  changeNote: string;
};

type SurveyDispatchCreateInput = {
  templateId: string;
  featureId: string;
  channel: SurveyDispatch['channel'];
  sampleSize: number;
  scheduledAt: string;
  autoCreateTicket: boolean;
};

type SurveyLowScoreTicketCreateInput = {
  featureId: string;
  reporterUserId: string;
  reporterUserName: string;
  reporterTeamName: string;
  summary?: string;
};

const llmJudgeDimensionLabels: Array<LLMJudgeDimensionScore['key']> = [
  'semantic_accuracy',
  'instruction_following',
  'consistency',
  'safety',
];

const llmJudgeDimensionLabelMap: Record<LLMJudgeDimensionScore['key'], string> = {
  semantic_accuracy: '语义准确性',
  instruction_following: '指令遵循',
  consistency: '稳定一致性',
  safety: '风险安全性',
};

function createFewShotExamples(prefix: string): LLMJudgeFewShotExample[] {
  return [
    {
      id: `${prefix}_shot_001`,
      input: '输入：用户表达“想找适合周末亲子活动的券包”',
      expectedOutput: '输出：亲子到店券兴趣，高置信度；说明命中了周末/亲子/券包三类意图。',
      note: '覆盖组合意图和场景词。',
    },
    {
      id: `${prefix}_shot_002`,
      input: '输入：用户表达“最近没时间，不想再收到会员推送”',
      expectedOutput: '输出：会员触达拒绝意图；说明需压制营销触达。',
      note: '覆盖反向意图和压制场景。',
    },
  ];
}

function createTemplateVersion(
  version: string,
  prompt: string,
  createdAt: string,
  createdBy: string,
  changeNote: string,
  isCurrent: boolean,
  prefix: string,
): LLMJudgePromptTemplateVersion {
  return {
    version,
    prompt,
    rubric: [
      '检查语义标签是否与输入意图一致。',
      '检查解释文本是否覆盖关键触发词与边界条件。',
      '检查高风险或歧义样本是否给出保守结论。',
    ],
    fewShots: createFewShotExamples(prefix),
    changeNote,
    createdAt,
    createdBy,
    isCurrent,
  };
}

const llmJudgeTemplatesStore: LLMJudgePromptTemplate[] = [
  {
    id: 'judge_tpl_llm_intent',
    name: 'LLM 意图特征语义评判模板',
    featureType: 'llm_intent',
    featureDomain: 'transaction',
    description: '用于评估意图类特征在召回、解释与风控边界上的语义质量。',
    judgeModel: 'gpt-4.1',
    status: 'active',
    tags: ['意图识别', '语义质量', '高风险样本'],
    currentVersion: 'v3',
    prompt:
      '你是质量评审员。请从语义准确性、指令遵循、一致性、安全性四个维度对特征输出打分，并给出低分原因。',
    rubric: ['语义标签需准确', '解释需可追溯', '歧义样本需保守', '高风险样本需降级'],
    fewShots: createFewShotExamples('judge_tpl_llm_intent'),
    versions: [
      createTemplateVersion(
        'v1',
        '基础语义打分模板，要求输出标签和简要说明。',
        '2026-04-18T10:00:00.000Z',
        '周岚',
        '初始化模板。',
        false,
        'judge_tpl_llm_intent_v1',
      ),
      createTemplateVersion(
        'v2',
        '在基础模板上加入对歧义场景和压制场景的审查要求。',
        '2026-04-21T10:00:00.000Z',
        '周岚',
        '补充歧义和压制场景 few-shot。',
        false,
        'judge_tpl_llm_intent_v2',
      ),
      createTemplateVersion(
        'v3',
        '要求输出四维评分、理由和是否建议进入 bad case 库。',
        '2026-04-24T10:00:00.000Z',
        '周岚',
        '增强低分样本沉淀规则。',
        true,
        'judge_tpl_llm_intent_v3',
      ),
    ],
    createdAt: '2026-04-18T10:00:00.000Z',
    updatedAt: '2026-04-24T10:00:00.000Z',
    updatedBy: '周岚',
  },
  {
    id: 'judge_tpl_vector',
    name: '向量召回特征语义评判模板',
    featureType: 'vector',
    featureDomain: 'cross_domain',
    description: '用于检查向量召回结果的语义相关性、解释一致性与越界召回风险。',
    judgeModel: 'claude-3.7-sonnet',
    status: 'active',
    tags: ['向量召回', '跨域', '相关性'],
    currentVersion: 'v2',
    prompt:
      '你是向量召回质量审阅器。请判断召回结果与原始语义请求是否一致，并识别越界召回。',
    rubric: ['召回结果需相关', '解释需覆盖关键召回词', '越界召回需扣分', '高风险词需审慎'],
    fewShots: createFewShotExamples('judge_tpl_vector'),
    versions: [
      createTemplateVersion(
        'v1',
        '输出相关性判断、召回理由和风险标签。',
        '2026-04-19T09:00:00.000Z',
        '陈卓',
        '初始化模板。',
        false,
        'judge_tpl_vector_v1',
      ),
      createTemplateVersion(
        'v2',
        '加入跨域越界召回检查和安全风险扣分项。',
        '2026-04-24T18:00:00.000Z',
        '陈卓',
        '补充越界召回规则。',
        true,
        'judge_tpl_vector_v2',
      ),
    ],
    createdAt: '2026-04-19T09:00:00.000Z',
    updatedAt: '2026-04-24T18:00:00.000Z',
    updatedBy: '陈卓',
  },
  {
    id: 'judge_tpl_algo',
    name: '推理特征解释性评判模板',
    featureType: 'algo',
    featureDomain: 'transaction',
    description: '用于评估推理类特征输出是否语义自洽、解释可信且适合业务消费。',
    judgeModel: 'doubao-judge-pro',
    status: 'active',
    tags: ['推理特征', '解释性', '稳定性'],
    currentVersion: 'v2',
    prompt:
      '请扮演推理特征评测专家，对输出结果的可解释性和语义合理性给出四维评分。',
    rubric: ['输出需与输入证据一致', '解释链条需清晰', '相似样本结论需稳定', '风险场景需保守'],
    fewShots: createFewShotExamples('judge_tpl_algo'),
    versions: [
      createTemplateVersion(
        'v1',
        '要求输出总体评分、结论和一条主要缺陷。',
        '2026-04-20T13:00:00.000Z',
        '何言',
        '初始化模板。',
        false,
        'judge_tpl_algo_v1',
      ),
      createTemplateVersion(
        'v2',
        '扩展为四维打分并增加 bad case 判定建议。',
        '2026-04-23T13:00:00.000Z',
        '何言',
        '加入 bad case 分类标准。',
        true,
        'judge_tpl_algo_v2',
      ),
    ],
    createdAt: '2026-04-20T13:00:00.000Z',
    updatedAt: '2026-04-23T13:00:00.000Z',
    updatedBy: '何言',
  },
];

const llmJudgeTemplateById = new Map(llmJudgeTemplatesStore.map((template) => [template.id, template]));

const semanticFeaturePool = rawFeatures.filter((feature) => ['llm_intent', 'vector', 'algo'].includes(feature.type));
const llmJudgeFeaturePool = semanticFeaturePool.length > 0 ? semanticFeaturePool : rawFeatures.slice(0, 6);
const llmJudgeStatusPool: LLMJudgeRun['status'][] = [
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'running',
  'completed',
  'completed',
  'failed',
  'completed',
  'completed',
  'running',
  'completed',
  'queued',
  'completed',
];

function buildJudgeDimensions(overallScore: number, index: number): LLMJudgeDimensionScore[] {
  return llmJudgeDimensionLabels.map((key, dimensionIndex) => {
    const offset = [2, 0, -2, 1][dimensionIndex] + ((index + dimensionIndex) % 3) - 1;
    const score = round(clamp(overallScore + offset, 52, 98), 1);
    return {
      key,
      label: llmJudgeDimensionLabelMap[key],
      score,
      summary:
        score >= 85
          ? '样本表现稳定，可直接用于健康度聚合。'
          : score >= 75
            ? '存在少量边界样本偏差，建议持续观察。'
            : '边界样本质量偏弱，建议沉淀 bad case。',
    };
  });
}

const llmJudgeRunsSeed: LLMJudgeRun[] = Array.from({ length: 15 }, (_, index) => {
  const feature = llmJudgeFeaturePool[index % llmJudgeFeaturePool.length];
  const template = llmJudgeTemplatesStore.find((item) => item.featureType === feature.type) ?? llmJudgeTemplatesStore[0];
  const status = llmJudgeStatusPool[index];
  const createdAt = new Date('2026-04-26T11:00:00.000Z');
  createdAt.setUTCHours(createdAt.getUTCHours() - index * 6);
  const startedAt = status === 'queued' ? null : new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString();
  const finishedAt =
    status === 'completed'
      ? new Date(createdAt.getTime() + 70 * 60 * 1000).toISOString()
      : status === 'failed'
        ? new Date(createdAt.getTime() + 26 * 60 * 1000).toISOString()
        : null;
  const baseline = 90 - (index % 5) * 4 - Math.floor(index / 5) * 1.5;
  const overallScore = round(clamp(status === 'failed' ? baseline - 12 : baseline, 58, 95), 1);
  const dimensions = buildJudgeDimensions(overallScore, index);

  return {
    id: `judge_run_${String(index + 1).padStart(3, '0')}`,
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: toFeatureDomain(feature),
    templateId: template.id,
    templateName: template.name,
    templateVersion: template.currentVersion,
    judgeModel: template.judgeModel,
    status,
    triggerMode: (['manual', 'scheduled', 'gate'] as const)[index % 3],
    sampleSize: 240 + (index % 5) * 80,
    overallScore,
    scoreDiffVsPrev: round(((index % 4) - 1.5) * 2.4, 1),
    dimensions,
    summary:
      status === 'failed'
        ? '评判任务在样本回放阶段失败，未产出完整评分。'
        : overallScore >= 85
          ? '语义质量稳定，适合作为健康度正向输入。'
          : overallScore >= 75
            ? '存在边界样本波动，需要继续跟踪 bad case。'
            : '低分样本较多，建议触发人工复核和模板优化。',
    badCaseCount: 0,
    createdAt: createdAt.toISOString(),
    startedAt,
    finishedAt,
    ownerTeamName: getOwner(feature).teamName,
  };
});

const completedLLMJudgeRuns = llmJudgeRunsSeed.filter((run) => run.status === 'completed');
const llmJudgeBadCasesStore: LLMJudgeBadCase[] = Array.from({ length: 20 }, (_, index) => {
  const run = completedLLMJudgeRuns[index % completedLLMJudgeRuns.length];
  const createdAt = new Date(run.finishedAt ?? run.createdAt);
  createdAt.setUTCMinutes(createdAt.getUTCMinutes() - index * 3);
  const statuses: LLMJudgeBadCase['status'][] = ['new', 'manual_review', 'added_to_training', 'resolved'];
  return {
    id: `judge_case_${String(index + 1).padStart(3, '0')}`,
    runId: run.id,
    featureId: run.featureId,
    featureName: run.featureName,
    featureType: run.featureType,
    templateId: run.templateId,
    severity: (['critical', 'high', 'medium', 'low'] as const)[index % 4],
    score: round(clamp(run.overallScore - 18 - (index % 5) * 3, 42, 76), 1),
    question: `样本 ${index + 1}：请判断用户是否存在“高价值复购”倾向，并说明原因。`,
    expectedAnswer: index % 2 === 0 ? '应判定为高价值复购倾向，且解释需引用近 30 天成交与活跃证据。' : '应保持中性结论，不能过度推断高价值意图。',
    actualAnswer:
      index % 3 === 0
        ? '模型直接判定高价值复购，但未给出足够证据，且忽略了降频信号。'
        : '模型给出模糊结论，对边界样本解释不充分。',
    reason:
      index % 4 === 0
        ? '忽略反向信号，导致高意图误判。'
        : index % 4 === 1
          ? '对跨域样本解释链条不足。'
          : index % 4 === 2
            ? '同类输入结论前后不一致。'
            : '安全保守策略没有生效。',
    tags: [run.featureType, index % 2 === 0 ? '边界样本' : '解释缺失', index % 3 === 0 ? '高风险' : '常规'],
    status: statuses[index % statuses.length],
    createdAt: createdAt.toISOString(),
    updatedAt: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
  };
});

const llmJudgeBadCaseCountByRun = new Map<string, number>();
for (const badCase of llmJudgeBadCasesStore) {
  llmJudgeBadCaseCountByRun.set(badCase.runId, (llmJudgeBadCaseCountByRun.get(badCase.runId) ?? 0) + 1);
}

const llmJudgeRunsStore: LLMJudgeRun[] = llmJudgeRunsSeed.map((run) => ({
  ...run,
  badCaseCount: llmJudgeBadCaseCountByRun.get(run.id) ?? 0,
}));

const surveyTemplatesStore: SurveyTemplate[] = [
  {
    id: 'survey_tpl_first_subscription',
    name: '首次订阅体验问卷',
    scenario: 'first_subscription',
    status: 'active',
    version: 'v1.1',
    description: '面向新接入消费方，回收首次订阅后的理解成本、接入体验和结果满意度。',
    targetFeatureTypes: ['rule', 'algo', 'vector', 'llm_intent'],
    audienceRule: '首次订阅后 3 天触达接入人和业务 owner',
    autoTriggerRule: '首次订阅事件成功 + 72 小时',
    questions: [
      { id: 'survey_q_001', type: 'csat', title: '你对当前特征接入体验满意吗？', required: true },
      { id: 'survey_q_002', type: 'single_choice', title: '最大的接入阻力是什么？', required: true, options: [
        { label: '文档不清晰', value: 'doc' },
        { label: '口径难理解', value: 'definition' },
        { label: '效果不稳定', value: 'stability' },
        { label: '系统流程复杂', value: 'process' },
      ] },
      { id: 'survey_q_003', type: 'text', title: '请补充一条最希望改进的点', required: false },
    ],
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-04-22T12:00:00.000Z',
    updatedBy: '平台治理',
  },
  {
    id: 'survey_tpl_experience_change',
    name: '变更体验回访问卷',
    scenario: 'experience_change',
    status: 'active',
    version: 'v1.0',
    description: '面向模板升级、口径变更或质量回退后的消费方体验回访。',
    targetFeatureTypes: ['sequence', 'algo', 'vector', 'llm_intent'],
    audienceRule: '版本升级后 5 天触达近 14 天高频消费团队',
    autoTriggerRule: '版本状态切换为 listed + 5 天',
    questions: [
      { id: 'survey_q_101', type: 'csat', title: '变更后的体验是否优于之前版本？', required: true },
      { id: 'survey_q_102', type: 'multiple_choice', title: '变更后主要问题有哪些？', required: true, options: [
        { label: '效果下降', value: 'effect_drop' },
        { label: '延迟升高', value: 'latency' },
        { label: '解释不足', value: 'explain' },
        { label: '稳定性波动', value: 'stability' },
      ] },
      { id: 'survey_q_103', type: 'text', title: '请描述一个典型问题样本', required: false },
    ],
    createdAt: '2026-04-16T10:00:00.000Z',
    updatedAt: '2026-04-20T15:00:00.000Z',
    updatedBy: '平台治理',
  },
  {
    id: 'survey_tpl_quarterly_nps',
    name: '季度 NPS 反馈问卷',
    scenario: 'quarterly_nps',
    status: 'active',
    version: 'v2.0',
    description: '面向核心消费团队，季度采集推荐意愿、满意度和治理建议。',
    targetFeatureTypes: ['rule', 'sequence', 'algo', 'vector', 'llm_intent'],
    audienceRule: '季度末触达所有核心消费 owner',
    autoTriggerRule: '每季度最后一个工作日 18:00',
    questions: [
      { id: 'survey_q_201', type: 'nps', title: '你愿意向其他团队推荐该特征吗？', required: true },
      { id: 'survey_q_202', type: 'single_choice', title: '你最关注的问题是什么？', required: true, options: [
        { label: '接入复杂度', value: 'integration' },
        { label: '效果稳定性', value: 'stability' },
        { label: '解释可用性', value: 'explainability' },
        { label: '覆盖率', value: 'coverage' },
      ] },
      { id: 'survey_q_203', type: 'text', title: '请给出你最想推动的一条治理建议', required: false },
    ],
    createdAt: '2026-04-10T09:00:00.000Z',
    updatedAt: '2026-04-24T16:00:00.000Z',
    updatedBy: '平台治理',
  },
];

const surveyFeaturePool = qualitySnapshots.slice(0, 8).map((snapshot) => getFeatureOrThrow(snapshot.featureId));
const surveyResponseCounts = [8, 6, 7, 5, 6, 7, 5, 6];
const surveyCsatPatterns = [
  [5, 4, 4, 5, 4, 5, 4, 4],
  [4, 3, 4, 3, 4, 3],
  [4, 2, 3, 2, 4, 3, 2],
  [3, 2, 2, 3, 2],
  [5, 4, 4, 4, 5, 4],
  [3, 4, 2, 3, 4, 2, 3],
  [2, 2, 3, 2, 1],
  [4, 4, 3, 4, 3, 4],
];
const surveyNpsPatterns = [
  [10, 9, 8, 9, 10, 8, 9, 10],
  [8, 7, 8, 7, 6, 8],
  [7, 5, 6, 4, 8, 6, 5],
  [6, 4, 5, 3, 4],
  [9, 10, 8, 9, 9, 8],
  [8, 7, 5, 6, 8, 5, 6],
  [4, 3, 5, 2, 4],
  [8, 7, 8, 7, 6, 8],
];
const surveyIssuePool = [
  ['文档口径不清晰', '字段解释太少'],
  ['接入流程繁琐', '回查链路不顺'],
  ['低分样本解释不足', '边界意图误判'],
  ['效果回退', '规则阈值偏保守'],
  ['接入体验顺畅', '版本说明清晰'],
  ['稳定性波动', '灰度和全量口径不一致'],
  ['满意度较低', 'NPS 持续下滑'],
  ['季度总体可用', '希望补充案例模板'],
];

const surveyDispatchesStore: SurveyDispatch[] = surveyFeaturePool.map((feature, index) => {
  const template = surveyTemplatesStore[index % surveyTemplatesStore.length];
  const scheduledAt = new Date('2026-04-18T10:00:00.000Z');
  scheduledAt.setUTCDate(scheduledAt.getUTCDate() + index);
  const launchedAt = new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const completedAt = new Date(scheduledAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `survey_dispatch_${String(index + 1).padStart(3, '0')}`,
    templateId: template.id,
    templateName: template.name,
    scenario: template.scenario,
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    ownerTeamName: getOwner(feature).teamName,
    channel: (['feishu', 'email', 'console'] as const)[index % 3],
    status: index === 7 ? 'running' : 'completed',
    audienceRule: template.audienceRule,
    sampleSize: surveyResponseCounts[index] + 4,
    responseCount: surveyResponseCounts[index],
    lowScoreAlertCount: 0,
    autoCreateTicket: index % 3 !== 0,
    scheduledAt: scheduledAt.toISOString(),
    launchedAt,
    completedAt: index === 7 ? null : completedAt,
  };
});

const surveyResponsesStore: SurveyResponse[] = surveyDispatchesStore.flatMap((dispatch, dispatchIndex) => {
  const template = surveyTemplatesStore.find((item) => item.id === dispatch.templateId) ?? surveyTemplatesStore[0];
  const csatPattern = surveyCsatPatterns[dispatchIndex];
  const npsPattern = surveyNpsPatterns[dispatchIndex];
  return csatPattern.map((csat, responseIndex) => {
    const nps = npsPattern[responseIndex];
    const submittedAt = new Date(dispatch.launchedAt ?? dispatch.scheduledAt);
    submittedAt.setUTCDate(submittedAt.getUTCDate() + Math.floor(responseIndex / 2));
    submittedAt.setUTCMinutes(submittedAt.getUTCMinutes() + responseIndex * 23);
    const comments = [
      '希望补充更具体的样本解释和失败案例。',
      '整体可用，但边界样本解释不够稳定。',
      '效果有改善，接入体验也比之前顺畅。',
      '文档可以更清楚一些，特别是口径和回退说明。',
      '低分样本治理链路还可以更快。',
    ];
    return {
      id: `survey_response_${String(dispatchIndex * 10 + responseIndex + 1).padStart(3, '0')}`,
      dispatchId: dispatch.id,
      templateId: template.id,
      featureId: dispatch.featureId,
      featureName: dispatch.featureName,
      featureType: dispatch.featureType,
      respondentTeamName: ['增长运营', '电商策略', '内容运营', '本地生活增长', '交易产品'][responseIndex % 5],
      respondentRole: ['运营负责人', '策略 PM', '算法同学', '产品经理'][responseIndex % 4],
      csat,
      nps,
      answers: template.questions.map((question, questionIndex) => ({
        questionId: question.id,
        questionTitle: question.title,
        value:
          question.type === 'csat'
            ? csat
            : question.type === 'nps'
              ? nps
              : question.type === 'text'
                ? comments[(dispatchIndex + responseIndex + questionIndex) % comments.length]
                : question.type === 'multiple_choice'
                  ? [question.options?.[(responseIndex + questionIndex) % (question.options?.length ?? 1)]?.value ?? 'unknown']
                  : question.options?.[(responseIndex + questionIndex) % (question.options?.length ?? 1)]?.value ?? 'unknown',
      })),
      comment: comments[(dispatchIndex + responseIndex) % comments.length],
      sentiment: csat >= 4 && nps >= 8 ? 'positive' : csat <= 2 || nps <= 5 ? 'negative' : 'neutral',
      submittedAt: submittedAt.toISOString(),
      generatedTicketId: null,
    };
  });
});

function calculateSummaryNps(responses: SurveyResponse[]) {
  const promoters = responses.filter((item) => item.nps >= 9).length;
  const detractors = responses.filter((item) => item.nps <= 6).length;
  return round(((promoters - detractors) / Math.max(responses.length, 1)) * 100, 1);
}

function calculateSummaryCsat(responses: SurveyResponse[]) {
  const total = responses.reduce((sum, item) => sum + item.csat, 0);
  return round(total / Math.max(responses.length, 1), 1);
}

const surveySummaryStore: SurveySummary[] = surveyDispatchesStore.map((dispatch, index) => {
  const feature = getFeatureOrThrow(dispatch.featureId);
  const responses = surveyResponsesStore.filter((item) => item.dispatchId === dispatch.id);
  const lowScoreCount = responses.filter((item) => item.csat < 3 || item.nps <= 6).length;
  dispatch.lowScoreAlertCount = lowScoreCount;
  return {
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: toFeatureDomain(feature),
    ownerTeamName: getOwner(feature).teamName,
    templateIds: [dispatch.templateId],
    latestDispatchId: dispatch.id,
    responseCount: responses.length,
    csat: calculateSummaryCsat(responses),
    nps: calculateSummaryNps(responses),
    lowScoreCount,
    summary:
      lowScoreCount === 0
        ? '消费方反馈整体稳定，体验和解释性都维持在健康区间。'
        : lowScoreCount <= 2
          ? '存在少量低分样本，主要集中在解释不清和接入流程问题。'
          : '低分样本占比偏高，需尽快处理语义误判和体验问题。',
    topIssues: surveyIssuePool[index],
    latestAggregatedAt: new Date(Date.UTC(2026, 3, 26, 9 + index, 0, 0)).toISOString(),
    relatedTicketIds:
      lowScoreCount >= 3
        ? [ticketStore[index % ticketStore.length]?.id ?? 'ticket_001']
        : lowScoreCount > 0
          ? [ticketStore[(index + 1) % ticketStore.length]?.id ?? 'ticket_002']
          : [],
  };
});

const surveyWordCloudSeed: Array<[string, number, SurveyWordCloudItem['sentiment']]> = [
  ['解释清晰', 98, 'positive'],
  ['接入顺畅', 92, 'positive'],
  ['效果稳定', 88, 'positive'],
  ['文档完整', 84, 'positive'],
  ['样本丰富', 79, 'positive'],
  ['响应及时', 74, 'positive'],
  ['链路清楚', 71, 'positive'],
  ['版本透明', 69, 'positive'],
  ['召回相关', 66, 'positive'],
  ['可复用', 63, 'positive'],
  ['口径模糊', 61, 'negative'],
  ['边界误判', 58, 'negative'],
  ['低分样本', 56, 'negative'],
  ['解释不足', 54, 'negative'],
  ['接入复杂', 52, 'negative'],
  ['流程偏长', 50, 'negative'],
  ['覆盖不足', 48, 'negative'],
  ['效果回退', 46, 'negative'],
  ['延迟波动', 44, 'negative'],
  ['回溯困难', 43, 'negative'],
  ['规则保守', 41, 'negative'],
  ['灰度不稳', 39, 'negative'],
  ['希望案例', 37, 'neutral'],
  ['补充模板', 35, 'neutral'],
  ['需要 SOP', 34, 'neutral'],
  ['治理闭环', 33, 'neutral'],
  ['回放报告', 32, 'neutral'],
  ['人工复核', 31, 'neutral'],
  ['自动建单', 30, 'neutral'],
  ['持续观察', 29, 'neutral'],
];

const surveyWordCloudTop30: SurveyWordCloudItem[] = surveyWordCloudSeed.map(([term, weight, sentiment]) => ({
  term,
  weight,
  sentiment,
}));

const surveyWordCloudEntries: Array<[string, SurveyWordCloudItem[]]> = [
  ['all', surveyWordCloudTop30],
  ...surveySummaryStore.map((summary, index): [string, SurveyWordCloudItem[]] => [
    summary.featureId,
    surveyWordCloudTop30
      .slice(index, index + 12)
      .map((item, itemIndex) => ({ ...item, weight: Math.max(item.weight - itemIndex * 2, 12) })),
  ]),
];

const surveyWordCloudStore = new Map<string, SurveyWordCloudItem[]>(surveyWordCloudEntries);

function inferSelfReviewScore(feature: Feature) {
  const record = selfReviewRecordsStore.find((item) => item.featureId === feature.id);
  if (record) {
    return round((record.totalScore / Math.max(record.maxScore, 1)) * 100, 1);
  }
  const template = selfReviewTemplateByType.get(feature.type);
  const baseline = template ? (template.passingScore / template.items.reduce((sum, item) => sum + item.maxScore, 0)) * 100 : 78;
  return round(clamp(baseline + 6 - (feature.name.length % 5) * 2, 68, 92), 1);
}

function getLatestCompletedLLMJudgeRun(featureId: string): LLMJudgeRun | null {
  return (
    llmJudgeRunsStore
      .filter((item) => item.featureId === featureId && item.status === 'completed')
      .sort((a, b) => {
        const aTime = new Date(a.finishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.finishedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

function inferSurveyScore(summary: SurveySummary) {
  const csatScore = (summary.csat / 5) * 60;
  const npsScore = ((summary.nps + 100) / 200) * 30;
  const lowScorePenalty = Math.min(summary.lowScoreCount * 2.5, 12);
  return round(clamp(csatScore + npsScore + 10 - lowScorePenalty, 40, 96), 1);
}

function finalizeHealthSources(
  items: Array<
    Pick<HealthScoreBreakdown['sources'][number], 'source' | 'label' | 'score' | 'participatesInScore' | 'summary'> & {
      rawWeight: number;
    }
  >,
): HealthScoreBreakdown['sources'] {
  const totalWeight = items.filter((item) => item.participatesInScore).reduce((sum, item) => sum + item.rawWeight, 0);
  return items.map((item) => {
    const weight = item.participatesInScore && totalWeight > 0 ? round(item.rawWeight / totalWeight, 4) : 0;
    return {
      source: item.source,
      label: item.label,
      score: item.score,
      weight,
      contribution: item.participatesInScore ? round(item.score * weight, 1) : 0,
      participatesInScore: item.participatesInScore,
      summary: item.summary,
    };
  });
}

const healthBreakdownStore: HealthScoreBreakdown[] = qualitySnapshots.slice(0, 10).map((snapshot, index) => {
  const feature = getFeatureOrThrow(snapshot.featureId);
  const weights = healthWeightMatrixByFeatureType[feature.type];
  const latestCompletedJob =
    backtestJobsStore.find((job) => job.featureId === snapshot.featureId && job.status === 'completed' && job.metrics) ?? null;
  const staticScore = snapshot.score;
  const backtestScore = round((latestCompletedJob?.metrics?.accuracy ?? clamp(snapshot.score / 100 - 0.03, 0.62, 0.95)) * 100, 1);
  const selfReviewScore = inferSelfReviewScore(feature);
  const latestLLMJudgeRun = getLatestCompletedLLMJudgeRun(snapshot.featureId);
  const llmJudgeScore = latestLLMJudgeRun?.overallScore ?? 0;
  const surveySummary = surveySummaryStore.find((item) => item.featureId === snapshot.featureId) ?? null;
  const surveyScore = surveySummary ? inferSurveyScore(surveySummary) : 0;
  const sources = finalizeHealthSources([
    {
      source: 'static_evaluation',
      label: '静态评测',
      score: staticScore,
      rawWeight: weights.static_evaluation,
      participatesInScore: true,
      summary: '沿用 Part 4 静态质量快照作为基础分。',
    },
    {
      source: 'auto_backtest',
      label: '自动化回测',
      score: backtestScore,
      rawWeight: weights.auto_backtest,
      participatesInScore: true,
      summary: latestCompletedJob?.driftAlert ? '最近一次回测存在漂移告警。' : '最近一次回测结果稳定。',
    },
    {
      source: 'self_review',
      label: '结构化自评',
      score: selfReviewScore,
      rawWeight: weights.self_review,
      participatesInScore: true,
      summary: selfReviewSuggestionsByFeatureId.has(feature.id) ? '存在最近一次结构化自评记录。' : '当前使用模板基线分。',
    },
    {
      source: 'llm_judgement',
      label: 'LLM 评判',
      score: llmJudgeScore,
      rawWeight: weights.llm_judgement,
      participatesInScore: Boolean(latestLLMJudgeRun && weights.llm_judgement > 0),
      summary: latestLLMJudgeRun
        ? `最近一次完成任务 ${latestLLMJudgeRun.id}，得分 ${llmJudgeScore}，Bad Case ${latestLLMJudgeRun.badCaseCount} 个。`
        : '当前特征暂无完成态 LLM 评判记录。',
    },
    {
      source: 'human_eval',
      label: '人工评估',
      score: 0,
      rawWeight: weights.human_eval,
      participatesInScore: false,
      summary: 'P2 占位来源，P0 不参与计算。',
    },
    {
      source: 'questionnaire',
      label: '问卷反馈',
      score: surveyScore,
      rawWeight: weights.questionnaire,
      participatesInScore: Boolean(surveySummary && weights.questionnaire > 0),
      summary: surveySummary
        ? `基于 ${surveySummary.responseCount} 份答卷聚合，低分样本 ${surveySummary.lowScoreCount} 份。`
        : '当前特征暂无问卷反馈聚合数据。',
    },
  ]);
  const overallScore = round(
    sources.filter((item) => item.participatesInScore).reduce((sum, item) => sum + item.contribution, 0),
    1,
  );
  const degraded = sources.some((item) => item.participatesInScore && item.score < 70);

  return {
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: toFeatureDomain(feature),
    ownerTeamName: getOwner(feature).teamName,
    overallScore,
    status: toHealthStatus(overallScore),
    updatedAt: new Date(Date.UTC(2026, 3, 26, 10 + index, 0, 0)).toISOString(),
    degraded,
    sources,
    radar: [
      { label: '静态评测', score: staticScore },
      { label: '自动回测', score: backtestScore },
      { label: '结构化自评', score: selfReviewScore },
      ...(latestLLMJudgeRun ? [{ label: 'LLM 评判', score: llmJudgeScore }] : []),
      ...(surveySummary ? [{ label: '问卷反馈', score: surveyScore }] : []),
    ],
  };
});

const healthTrendStore = new Map<string, HealthScoreTrendPoint[]>(
  healthBreakdownStore.map((breakdown, index) => {
    const staticScore = breakdown.sources.find((item) => item.source === 'static_evaluation')?.score ?? breakdown.overallScore;
    const backtestScore = breakdown.sources.find((item) => item.source === 'auto_backtest')?.score ?? breakdown.overallScore;
    const selfReviewScore = breakdown.sources.find((item) => item.source === 'self_review')?.score ?? breakdown.overallScore;
    const llmJudgeSource = breakdown.sources.find((item) => item.source === 'llm_judgement');
    const questionnaireSource = breakdown.sources.find((item) => item.source === 'questionnaire');
    const trend = Array.from({ length: 8 }, (_, pointIndex) => {
      const date = new Date('2026-04-26T00:00:00.000Z');
      date.setUTCDate(date.getUTCDate() - (7 - pointIndex) * 3);
      const bias = ((pointIndex + index) % 5) - 2;
      const pointStatic = round(clamp(staticScore + bias * 1.2 - 2, 58, 98), 1);
      const pointBacktest = round(clamp(backtestScore + bias * 1.6 - 3, 55, 98), 1);
      const pointReview = round(clamp(selfReviewScore + bias * 0.8 - 1, 60, 98), 1);
      const pointLLMJudge =
        llmJudgeSource?.participatesInScore ? round(clamp(llmJudgeSource.score + bias * 1.1 - 1, 48, 98), 1) : 0;
      const pointQuestionnaire =
        questionnaireSource?.participatesInScore
          ? round(clamp(questionnaireSource.score + bias * 0.9 - 1, 42, 96), 1)
          : 0;
      const pointScoreMap: Partial<Record<HealthScoreSource, number>> = {
        static_evaluation: pointStatic,
        auto_backtest: pointBacktest,
        self_review: pointReview,
        llm_judgement: pointLLMJudge,
        questionnaire: pointQuestionnaire,
      };
      const pointOverall = round(
        breakdown.sources
          .filter((item) => item.participatesInScore)
          .reduce((sum, item) => sum + (pointScoreMap[item.source] ?? 0) * item.weight, 0),
        1,
      );
      return {
        date: date.toISOString().slice(0, 10),
        overallScore: pointOverall,
        staticScore: pointStatic,
        backtestScore: pointBacktest,
        selfReviewScore: pointReview,
        degraded: breakdown.sources
          .filter((item) => item.participatesInScore)
          .some((item) => (pointScoreMap[item.source] ?? 100) < 70),
      };
    });
    return [breakdown.featureId, trend];
  }),
);

const degradationEventsStore: QualityDegradationEvent[] = healthBreakdownStore
  .filter((breakdown) => breakdown.degraded)
  .map((breakdown, index) => {
    const lowestSource = breakdown.sources
      .filter((item) => item.participatesInScore)
      .sort((a, b) => a.score - b.score)[0];
    const relatedJob = backtestJobsStore.find((job) => job.featureId === breakdown.featureId && job.relatedTicketId);
    const relatedSurveySummary = surveySummaryStore.find((item) => item.featureId === breakdown.featureId);
    const relatedFeatureTicket = ticketStore.find((ticket) => ticket.featureId === breakdown.featureId);
    return {
      id: `degrade_evt_${String(index + 1).padStart(3, '0')}`,
      featureId: breakdown.featureId,
      featureName: breakdown.featureName,
      source: lowestSource.source,
      severity: breakdown.overallScore < 65 ? 'critical' : 'high',
      reason:
        lowestSource.source === 'auto_backtest'
          ? '自动化回测结果低于门禁阈值，触发自动降级。'
          : lowestSource.source === 'llm_judgement'
            ? 'LLM 评判得分持续偏低，语义质量进入降级观察。'
            : lowestSource.source === 'questionnaire'
              ? '问卷反馈低分样本占比偏高，触发体验降级与治理联动。'
          : lowestSource.source === 'self_review'
            ? '结构化自评未达标，发布流程回退到 draft。'
            : '静态评测基础分过低，进入降级观察。',
      fromScore: round(breakdown.overallScore + 6, 1),
      toScore: breakdown.overallScore,
      triggeredAt: new Date(Date.UTC(2026, 3, 25, 9 + index, 20, 0)).toISOString(),
      relatedTicketId:
        lowestSource.source === 'questionnaire'
          ? relatedSurveySummary?.relatedTicketIds[0] ?? relatedFeatureTicket?.id ?? null
          : lowestSource.source === 'llm_judgement'
            ? relatedFeatureTicket?.id ?? null
            : relatedJob?.relatedTicketId ?? relatedFeatureTicket?.id ?? ticketStore[index % ticketStore.length]?.id ?? null,
      resolvedAt: index % 3 === 0 ? new Date(Date.UTC(2026, 3, 26, 12 + index, 0, 0)).toISOString() : null,
    };
  });

const placeholderEntries: QualityPlaceholderEntry[] = [
  {
    key: 'human_eval',
    title: 'CQC 人工评估',
    routePath: '/quality/human-eval',
    description: '人工评估结果面板占位入口，P0 仅透出路由和说明。',
    available: true,
  },
  {
    key: 'eval_orchestrator',
    title: '评测任务编排',
    routePath: '/quality/eval-orchestrator',
    description: '评测任务编排器占位入口，P0 仅透出路由和说明。',
    available: true,
  },
];

export function getBacktestOverview() {
  const completedJobs = backtestJobsStore.filter((job) => job.status === 'completed' && job.metrics);
  const avgAccuracy =
    completedJobs.reduce((sum, job) => sum + (job.metrics?.accuracy ?? 0), 0) / Math.max(completedJobs.length, 1);

  return {
    totalJobs: backtestJobsStore.length,
    pendingCount: backtestJobsStore.filter((job) => job.status === 'pending').length,
    runningCount: backtestJobsStore.filter((job) => job.status === 'running').length,
    completedCount: backtestJobsStore.filter((job) => job.status === 'completed').length,
    failedCount: backtestJobsStore.filter((job) => job.status === 'failed').length,
    driftAlertCount: backtestJobsStore.filter((job) => job.driftAlert).length,
    featureCoverageCount: new Set(backtestJobsStore.map((job) => job.featureId)).size,
    avgAccuracy: round(avgAccuracy, 3),
  };
}

export function getBacktestJobs(): BacktestJob[] {
  return backtestJobsStore.map(clone);
}

export function getBacktestJobDetail(jobId: string): BacktestJob | null {
  const job = backtestJobsStore.find((item) => item.id === jobId);
  return job ? clone(job) : null;
}

export function getSelfReviewTemplates(featureType?: FeatureType): SelfReviewTemplate[] {
  const templates = featureType ? selfReviewTemplates.filter((item) => item.featureType === featureType) : selfReviewTemplates;
  return templates.map(clone);
}

export function getSelfReviewTemplateByFeatureType(featureType: FeatureType): SelfReviewTemplate | null {
  const template = selfReviewTemplateByType.get(featureType);
  return template ? clone(template) : null;
}

export function getSelfReviewRecords(featureId?: string): SelfReviewRecord[] {
  const records = featureId ? selfReviewRecordsStore.filter((item) => item.featureId === featureId) : selfReviewRecordsStore;
  return records.map(clone);
}

export function getSelfReviewAiSuggestions(featureId: string): string[] {
  return [...(selfReviewSuggestionsByFeatureId.get(featureId) ?? ['建议补充模板示例、回测样本和回退预案。'])];
}

export function getHealthScoreBreakdown(featureId: string): HealthScoreBreakdown | null {
  const breakdown = healthBreakdownStore.find((item) => item.featureId === featureId);
  return breakdown ? clone(breakdown) : null;
}

export function getHealthScoreTrend(featureId: string): HealthScoreTrendPoint[] {
  return (healthTrendStore.get(featureId) ?? []).map(clone);
}

export function getQualityDegradationEvents(featureId?: string): QualityDegradationEvent[] {
  const events = featureId ? degradationEventsStore.filter((item) => item.featureId === featureId) : degradationEventsStore;
  return events.map(clone);
}

export function getQualityPlaceholderEntries(): QualityPlaceholderEntry[] {
  return placeholderEntries.map(clone);
}

export function getQualityAlertOverview(): QualityAlertOverview {
  const healthyCount = qualitySnapshots.filter((snapshot) => snapshot.status === 'healthy').length;
  const warningCount = qualitySnapshots.filter((snapshot) => snapshot.status === 'warning').length;
  const criticalCount = qualitySnapshots.filter((snapshot) => snapshot.status === 'critical').length;
  const avgScore =
    qualitySnapshots.reduce((sum, snapshot) => sum + snapshot.score, 0) / Math.max(qualitySnapshots.length, 1);

  return {
    totalFeatures: qualitySnapshots.length,
    healthyCount,
    warningCount,
    criticalCount,
    openAlertCount: alertsSeed.filter((alert) => alert.status === 'open').length,
    openTicketCount: ticketStore.filter((ticket) => ticket.status === 'open' || ticket.status === 'processing').length,
    enabledRuleCount: alertRulesSeed.filter((rule) => rule.status === 'enabled').length,
    avgScore: Number(avgScore.toFixed(1)),
  };
}

export function getQualityHealthList(): QualityHealthListItem[] {
  return qualitySnapshots
    .map((snapshot) => {
      const feature = getFeatureOrThrow(snapshot.featureId);
      const owner = getOwner(feature);
      const activeAlerts = alertsSeed.filter(
        (alert) =>
          alert.featureId === snapshot.featureId && (alert.status === 'open' || alert.status === 'acknowledged'),
      );
      const activeTickets = ticketStore.filter(
        (ticket) =>
          ticket.featureId === snapshot.featureId && (ticket.status === 'open' || ticket.status === 'processing'),
      );

      return {
        featureId: snapshot.featureId,
        featureName: feature.name,
        featureType: feature.type,
        featureDomain: toFeatureDomain(feature),
        ownerTeamId: owner.teamId,
        ownerTeamName: owner.teamName,
        updateFrequency: toUpdateFrequency(feature),
        status: snapshot.status ?? toHealthStatus(snapshot.score),
        latestSnapshot: clone(snapshot),
        latestAlertTitle: activeAlerts[0]?.title ?? null,
        activeAlertCount: activeAlerts.length,
        activeTicketCount: activeTickets.length,
      } satisfies QualityHealthListItem;
    })
    .sort((a, b) => a.latestSnapshot.score - b.latestSnapshot.score);
}

export function getQualityHeatmapPoints(): QualityHealthHeatmapPoint[] {
  return getQualityHealthList().map((item) => ({
    featureId: item.featureId,
    featureName: item.featureName,
    featureType: item.featureType,
    featureDomain: item.featureDomain,
    ownerTeamName: item.ownerTeamName,
    status: item.status,
    score: item.latestSnapshot.score,
    freshnessHours: item.latestSnapshot.freshnessHours,
    coverageRate: item.latestSnapshot.coverageRate,
    stabilityRate: item.latestSnapshot.stabilityRate,
  }));
}

export function getQualityTrend(featureId: string, windowDays: 30 | 60 | 90 = 30): QualityTrendPoint[] {
  return buildTrend(featureId, windowDays).map(clone);
}

export function getQualityAlerts(): QualityAlert[] {
  return alertsSeed.map(clone);
}

export function getQualityAlertRules(): QualityAlertRule[] {
  return alertRulesSeed.map(clone);
}

export function getQualityHealthReport(): QualityHealthReport {
  const overview = getQualityAlertOverview();
  const topRisks = getQualityHealthList()
    .filter((item) => item.status !== 'healthy')
    .slice(0, 4)
    .map((item) => ({
      featureId: item.featureId,
      featureName: item.featureName,
      ownerTeamName: item.ownerTeamName,
      status: item.status,
      reason: item.latestSnapshot.latestAlertMessage ?? '存在待关注的质量波动。',
    }));

  return {
    id: 'quality_report_20260425',
    generatedAt: '2026-04-25T10:30:00.000Z',
    windowDays: 30,
    totalFeatures: overview.totalFeatures,
    avgScore: overview.avgScore,
    healthyCount: overview.healthyCount,
    warningCount: overview.warningCount,
    criticalCount: overview.criticalCount,
    topRisks,
    recommendations: [
      '优先处理 freshness 与 schema_change 告警，避免影响后续归因口径。',
      '对 warning 特征补充阈值回放，减少大促场景下的误报。',
      '对 critical 特征建立发布前检查，阻止异常版本继续扩散。',
    ],
  };
}

export function getGovernanceTickets(): GovernanceTicket[] {
  return ticketStore.map(clone);
}

export function getGovernanceTicketComments(ticketId: string): GovernanceTicketComment[] {
  return (ticketCommentsStore.get(ticketId) ?? []).map(clone);
}

export function appendGovernanceTicketComment(ticketId: string, input: CommentInput): GovernanceTicketComment | null {
  const ticket = ticketStore.find((item) => item.id === ticketId);
  if (!ticket) return null;

  commentSequence += 1;
  const comment: GovernanceTicketComment = {
    id: `${ticketId}_comment_${commentSequence}`,
    ticketId,
    authorUserId: input.authorUserId,
    authorUserName: input.authorUserName,
    authorTeamName: input.authorTeamName,
    content: input.content,
    createdAt: '2026-04-25T14:00:00.000Z',
  };

  const nextComments = [...(ticketCommentsStore.get(ticketId) ?? []), comment];
  ticketCommentsStore.set(ticketId, nextComments);

  const nextTimeline = [
    ...(ticketTimelineStore.get(ticketId) ?? []),
    {
      id: `${ticketId}_timeline_${commentSequence}`,
      ticketId,
      type: 'commented',
      operatorName: input.authorUserName,
      summary: `新增处理记录：${input.content}`,
      createdAt: comment.createdAt,
    } satisfies GovernanceTicketTimelineEntry,
  ];
  ticketTimelineStore.set(ticketId, nextTimeline);

  ticket.latestCommentAt = comment.createdAt;
  return clone(comment);
}

export function updateGovernanceTicketStatus(
  ticketId: string,
  input: TicketStatusUpdateInput,
): GovernanceTicket | null {
  const ticket = ticketStore.find((item) => item.id === ticketId);
  if (!ticket) return null;

  commentSequence += 1;
  const operatedAt = nextMutationTime(commentSequence);
  const nextType =
    input.status === 'resolved' ? 'resolved' : input.status === 'closed' ? 'closed' : 'status_changed';
  const nextSummary =
    input.status === 'processing'
      ? `${input.operatorUserName} 开始处理该工单。`
      : input.status === 'resolved'
        ? `${input.operatorUserName} 标记工单已解决。`
        : `${input.operatorUserName} 关闭工单并完成回归确认。`;

  ticket.status = input.status;
  ticket.latestCommentAt = operatedAt;
  if (input.status === 'resolved' || input.status === 'closed') {
    ticket.resolvedAt = operatedAt;
  }

  const nextTimeline = [
    ...(ticketTimelineStore.get(ticketId) ?? []),
    {
      id: `${ticketId}_timeline_${commentSequence}`,
      ticketId,
      type: nextType,
      operatorName: input.operatorUserName,
      summary: nextSummary,
      createdAt: operatedAt,
      toStatus: input.status,
    } satisfies GovernanceTicketTimelineEntry,
  ];
  ticketTimelineStore.set(ticketId, nextTimeline);

  return clone(ticket);
}

export function getGovernanceTicketDetail(ticketId: string): GovernanceTicketDetail | null {
  const ticket = ticketStore.find((item) => item.id === ticketId);
  if (!ticket) return null;

  const seed = ticketDetailSeeds.get(ticketId);
  if (!seed) return null;

  const relatedAlerts = alertsSeed.filter((alert) => ticket.relatedAlertIds?.includes(alert.id));
  return {
    ticket: clone(ticket),
    impactSummary: seed.impactSummary,
    rootCauses: [...seed.rootCauses],
    suggestedActions: [...seed.suggestedActions],
    relatedAlerts: relatedAlerts.map(clone),
    timeline: (ticketTimelineStore.get(ticketId) ?? []).map(clone),
    comments: getGovernanceTicketComments(ticketId),
  };
}

export function getQualityAttributionKpis(): QualityAttributionKpi[] {
  const totalRevenue = attributionStore.reduce((sum, record) => sum + record.attributedRevenue, 0);
  const averageMac = sumMetric(attributionStore, 'MAC');
  const totalAbEffect = attributionStore.reduce((sum, record) => sum + (record.metricBreakdown?.['AB收益'] ?? 0), 0);

  return [
    {
      key: 'MAC',
      label: 'MAC 降幅',
      value: Math.abs(averageMac),
      unit: 'bp',
      delta: 3.2,
      description: '近 30 天由供给方特征贡献的平均 MAC 改善。',
    },
    {
      key: 'GMV',
      label: 'GMV 增量',
      value: Number((totalRevenue / 10000).toFixed(1)),
      unit: '万元',
      delta: 12.8,
      description: '近 30 天归因到核心供给特征的 GMV 增量。',
    },
    {
      key: 'AB收益',
      label: 'AB 累计收益',
      value: Number(totalAbEffect.toFixed(1)),
      unit: '万元',
      delta: 8.4,
      description: '归因实验累计收益，已屏蔽个人级身份信息。',
    },
  ];
}

export function getQualityValueRanking(): QualityValueRankingItem[] {
  return buildRankingItems().map(clone);
}

export function getQualityFeatureAttributionDetail(featureId: string): QualityFeatureAttributionDetail | null {
  const ranking = buildRankingItems().find((item) => item.featureId === featureId);
  if (!ranking) return null;

  const feature = getFeatureOrThrow(featureId);
  const trends = attributionTrendSeed.get(featureId) ?? [
    { period: '2026-W14', metricValues: ranking.metricBreakdown },
    { period: '2026-W15', metricValues: ranking.metricBreakdown },
    { period: '2026-W16', metricValues: ranking.metricBreakdown },
    { period: '2026-W17', metricValues: ranking.metricBreakdown },
  ];

  return {
    featureId,
    featureName: ranking.featureName,
    featureType: ranking.featureType,
    featureDomain: ranking.featureDomain,
    ownerTeamName: ranking.ownerTeamName,
    rankInDomain: ranking.rank,
    summary: `${feature.name} 在 ${ranking.featureDomain} 域内贡献稳定，已被 ${ranking.totalConsumptionTeams} 个消费团队复用。`,
    metrics: [
      { key: 'CTR', label: 'CTR', value: ranking.metricBreakdown.CTR ?? 0, unit: '%', rankText: `域内第 ${ranking.rank}` },
      { key: 'CVR', label: 'CVR', value: ranking.metricBreakdown.CVR ?? 0, unit: '%', rankText: `域内第 ${ranking.rank}` },
      { key: 'ROI', label: 'ROI', value: ranking.metricBreakdown.ROI ?? 0, unit: 'x', rankText: `域内第 ${ranking.rank}` },
      { key: 'MAC', label: 'MAC', value: ranking.metricBreakdown.MAC ?? 0, unit: 'bp', rankText: `域内第 ${ranking.rank}` },
      { key: 'GMV', label: 'GMV', value: ranking.metricBreakdown.GMV ?? 0, unit: '万元', rankText: `域内第 ${ranking.rank}` },
      { key: 'AB收益', label: 'AB收益', value: ranking.metricBreakdown['AB收益'] ?? 0, unit: '万元', rankText: `域内第 ${ranking.rank}` },
    ],
    trends: trends.map(clone),
  };
}

export function getQualityConsumptionRecords(featureId: string): ConsumptionRecord[] {
  return consumptionStore.filter((item) => item.featureId === featureId).map(clone);
}

export function getQualityExportEntry(scope: 'governance' | 'tickets' | 'attribution', format?: QualityExportFormat) {
  const resolvedFormat = normalizeFormat(format);
  const suffix = resolvedFormat === 'csv' ? 'csv' : 'xlsx';

  return {
    id: `quality_export_${scope}_${suffix}`,
    scope,
    format: resolvedFormat,
    fileName: `quality-${scope}-20260425.${suffix}`,
    downloadUrl: `/mock-downloads/quality-${scope}-20260425.${suffix}`,
    expiresAt: '2026-04-26T10:30:00.000Z',
  } satisfies QualityExportEntry;
}

function nextJudgeTemplateVersion(currentVersion: string) {
  const matched = /^v(\d+)$/.exec(currentVersion);
  return `v${(Number(matched?.[1] ?? 0) + 1).toString()}`;
}

function cloneTemplateVersions(
  versions: LLMJudgePromptTemplateVersion[],
  nextCurrentVersion?: string,
): LLMJudgePromptTemplateVersion[] {
  return versions.map((version) => ({
    ...clone(version),
    isCurrent: nextCurrentVersion ? version.version === nextCurrentVersion : version.isCurrent,
  }));
}

export function getLLMJudgeOverview() {
  const completed = llmJudgeRunsStore.filter((item) => item.status === 'completed');
  const avgOverallScore = round(
    completed.reduce((sum, item) => sum + item.overallScore, 0) / Math.max(completed.length, 1),
    1,
  );
  const avgSampleSize = Math.round(
    llmJudgeRunsStore.reduce((sum, item) => sum + item.sampleSize, 0) / Math.max(llmJudgeRunsStore.length, 1),
  );

  return {
    totalRuns: llmJudgeRunsStore.length,
    queuedCount: llmJudgeRunsStore.filter((item) => item.status === 'queued').length,
    runningCount: llmJudgeRunsStore.filter((item) => item.status === 'running').length,
    completedCount: completed.length,
    failedCount: llmJudgeRunsStore.filter((item) => item.status === 'failed').length,
    avgOverallScore,
    avgSampleSize,
    badCaseCount: llmJudgeBadCasesStore.length,
    featureCoverageCount: new Set(llmJudgeRunsStore.map((item) => item.featureId)).size,
  };
}

export function getLLMJudgeRuns(featureType?: FeatureType, status?: LLMJudgeRun['status']): LLMJudgeRun[] {
  return llmJudgeRunsStore
    .filter((item) => (featureType ? item.featureType === featureType : true))
    .filter((item) => (status ? item.status === status : true))
    .map(clone);
}

export function getLLMJudgeRunDetail(runId: string): LLMJudgeRun | null {
  const run = llmJudgeRunsStore.find((item) => item.id === runId);
  return run ? clone(run) : null;
}

export function createLLMJudgeRun(input: LLMJudgeRunCreateInput): LLMJudgeRun | null {
  const feature = featureById.get(input.featureId);
  const template = llmJudgeTemplateById.get(input.templateId);
  if (!feature || !template) return null;

  const createdAt = new Date('2026-04-26T18:00:00.000Z');
  createdAt.setUTCMinutes(createdAt.getUTCMinutes() + llmJudgeRunsStore.length);
  const predictedScore = round(clamp(83 - (llmJudgeRunsStore.length % 4) * 2.5, 72, 90), 1);
  const run: LLMJudgeRun = {
    id: `judge_run_${String(llmJudgeRunsStore.length + 1).padStart(3, '0')}`,
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    featureDomain: toFeatureDomain(feature),
    templateId: template.id,
    templateName: template.name,
    templateVersion: template.currentVersion,
    judgeModel: input.judgeModel,
    status: 'queued',
    triggerMode: input.triggerMode,
    sampleSize: input.sampleSize,
    overallScore: predictedScore,
    scoreDiffVsPrev: 0,
    dimensions: buildJudgeDimensions(predictedScore, llmJudgeRunsStore.length),
    summary: '新任务已创建，等待进入评判队列。',
    badCaseCount: 0,
    createdAt: createdAt.toISOString(),
    startedAt: null,
    finishedAt: null,
    ownerTeamName: getOwner(feature).teamName,
  };
  llmJudgeRunsStore.unshift(run);
  return clone(run);
}

export function getLLMJudgeScoreDistribution(featureType?: FeatureType) {
  const bins = [
    { label: '<60', min: 0, max: 60, count: 0 },
    { label: '60-69', min: 60, max: 70, count: 0 },
    { label: '70-79', min: 70, max: 80, count: 0 },
    { label: '80-89', min: 80, max: 90, count: 0 },
    { label: '90+', min: 90, max: 101, count: 0 },
  ];
  const filtered = llmJudgeRunsStore.filter((item) => item.status === 'completed' && (featureType ? item.featureType === featureType : true));
  for (const run of filtered) {
    const target = bins.find((bin) => run.overallScore >= bin.min && run.overallScore < bin.max);
    if (target) target.count += 1;
  }
  return {
    total: filtered.length,
    items: bins,
  };
}

export function getLLMJudgePromptTemplates(featureType?: FeatureType): LLMJudgePromptTemplate[] {
  return llmJudgeTemplatesStore
    .filter((item) => (featureType ? item.featureType === featureType : true))
    .map(clone);
}

export function getLLMJudgePromptTemplate(templateId: string): LLMJudgePromptTemplate | null {
  const template = llmJudgeTemplateById.get(templateId);
  return template ? clone(template) : null;
}

export function createLLMJudgePromptTemplate(input: Required<Pick<LLMJudgePromptTemplateSaveInput, 'prompt' | 'rubric' | 'fewShots' | 'operator' | 'changeNote'>> & Pick<LLMJudgePromptTemplateSaveInput, 'name' | 'featureType' | 'featureDomain' | 'description' | 'judgeModel' | 'tags'>): LLMJudgePromptTemplate {
  const createdAt = new Date('2026-04-26T18:30:00.000Z');
  createdAt.setUTCMinutes(createdAt.getUTCMinutes() + llmJudgeTemplatesStore.length * 5);
  const template: LLMJudgePromptTemplate = {
    id: `judge_tpl_custom_${String(llmJudgeTemplatesStore.length + 1).padStart(3, '0')}`,
    name: input.name ?? '未命名模板',
    featureType: input.featureType ?? 'llm_intent',
    featureDomain: input.featureDomain ?? 'transaction',
    description: input.description ?? '新增语义评判模板。',
    judgeModel: input.judgeModel ?? 'gpt-4.1',
    status: 'draft',
    tags: input.tags ?? [],
    currentVersion: 'v1',
    prompt: input.prompt,
    rubric: [...input.rubric],
    fewShots: clone(input.fewShots),
    versions: [
      {
        version: 'v1',
        prompt: input.prompt,
        rubric: [...input.rubric],
        fewShots: clone(input.fewShots),
        changeNote: input.changeNote,
        createdAt: createdAt.toISOString(),
        createdBy: input.operator,
        isCurrent: true,
      },
    ],
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    updatedBy: input.operator,
  };
  llmJudgeTemplatesStore.unshift(template);
  llmJudgeTemplateById.set(template.id, template);
  return clone(template);
}

export function updateLLMJudgePromptTemplate(
  templateId: string,
  input: LLMJudgePromptTemplateSaveInput,
): LLMJudgePromptTemplate | null {
  const template = llmJudgeTemplateById.get(templateId);
  if (!template) return null;

  const nextVersion = nextJudgeTemplateVersion(template.currentVersion);
  const updatedAt = new Date('2026-04-26T19:00:00.000Z');
  updatedAt.setUTCMinutes(updatedAt.getUTCMinutes() + template.versions.length * 3);

  template.name = input.name ?? template.name;
  template.featureType = input.featureType ?? template.featureType;
  template.featureDomain = input.featureDomain ?? template.featureDomain;
  template.description = input.description ?? template.description;
  template.judgeModel = input.judgeModel ?? template.judgeModel;
  template.tags = input.tags ?? template.tags;
  template.currentVersion = nextVersion;
  template.prompt = input.prompt;
  template.rubric = [...input.rubric];
  template.fewShots = clone(input.fewShots);
  template.updatedAt = updatedAt.toISOString();
  template.updatedBy = input.operator;
  template.versions = [
    ...cloneTemplateVersions(template.versions, nextVersion),
    {
      version: nextVersion,
      prompt: input.prompt,
      rubric: [...input.rubric],
      fewShots: clone(input.fewShots),
      changeNote: input.changeNote,
      createdAt: updatedAt.toISOString(),
      createdBy: input.operator,
      isCurrent: true,
    },
  ];

  return clone(template);
}

export function rollbackLLMJudgePromptTemplate(templateId: string, version: string, operator: string): LLMJudgePromptTemplate | null {
  const template = llmJudgeTemplateById.get(templateId);
  if (!template) return null;
  const targetVersion = template.versions.find((item) => item.version === version);
  if (!targetVersion) return null;

  return updateLLMJudgePromptTemplate(templateId, {
    prompt: targetVersion.prompt,
    rubric: [...targetVersion.rubric],
    fewShots: clone(targetVersion.fewShots),
    operator,
    changeNote: `回滚到 ${version}`,
    name: template.name,
    featureType: template.featureType,
    featureDomain: template.featureDomain,
    description: template.description,
    judgeModel: template.judgeModel,
    tags: template.tags,
  });
}

export function deleteLLMJudgePromptTemplate(templateId: string): boolean {
  const index = llmJudgeTemplatesStore.findIndex((item) => item.id === templateId);
  if (index < 0) return false;
  const [removed] = llmJudgeTemplatesStore.splice(index, 1);
  llmJudgeTemplateById.delete(removed.id);
  return true;
}

export function getLLMJudgeBadCases(
  options: {
    runId?: string;
    featureType?: FeatureType;
    status?: LLMJudgeBadCase['status'];
  } = {},
): LLMJudgeBadCase[] {
  return llmJudgeBadCasesStore
    .filter((item) => (options.runId ? item.runId === options.runId : true))
    .filter((item) => (options.featureType ? item.featureType === options.featureType : true))
    .filter((item) => (options.status ? item.status === options.status : true))
    .map(clone);
}

export function updateLLMJudgeBadCaseAction(caseId: string, action: LLMJudgeBadCaseAction): LLMJudgeBadCase | null {
  const badCase = llmJudgeBadCasesStore.find((item) => item.id === caseId);
  if (!badCase) return null;
  badCase.status =
    action === 'add_to_training'
      ? 'added_to_training'
      : action === 'push_manual_review'
        ? 'manual_review'
        : 'resolved';
  badCase.updatedAt = nextMutationTime(++commentSequence);
  return clone(badCase);
}

export function getSurveyTemplates(scenario?: SurveyTemplate['scenario']): SurveyTemplate[] {
  return surveyTemplatesStore
    .filter((item) => (scenario ? item.scenario === scenario : true))
    .map(clone);
}

export function getSurveyDispatches(options: { status?: SurveyDispatch['status']; templateId?: string; featureId?: string } = {}): SurveyDispatch[] {
  return surveyDispatchesStore
    .filter((item) => (options.status ? item.status === options.status : true))
    .filter((item) => (options.templateId ? item.templateId === options.templateId : true))
    .filter((item) => (options.featureId ? item.featureId === options.featureId : true))
    .map(clone);
}

export function createSurveyDispatch(input: SurveyDispatchCreateInput): SurveyDispatch | null {
  const template = surveyTemplatesStore.find((item) => item.id === input.templateId);
  const feature = featureById.get(input.featureId);
  if (!template || !feature) return null;

  const dispatch: SurveyDispatch = {
    id: `survey_dispatch_${String(surveyDispatchesStore.length + 1).padStart(3, '0')}`,
    templateId: template.id,
    templateName: template.name,
    scenario: template.scenario,
    featureId: feature.id,
    featureName: feature.name,
    featureType: feature.type,
    ownerTeamName: getOwner(feature).teamName,
    channel: input.channel,
    status: 'scheduled',
    audienceRule: template.audienceRule,
    sampleSize: input.sampleSize,
    responseCount: 0,
    lowScoreAlertCount: 0,
    autoCreateTicket: input.autoCreateTicket,
    scheduledAt: input.scheduledAt,
    launchedAt: null,
    completedAt: null,
  };
  surveyDispatchesStore.unshift(dispatch);
  return clone(dispatch);
}

export function getSurveyResponses(options: { featureId?: string; dispatchId?: string } = {}): SurveyResponse[] {
  return surveyResponsesStore
    .filter((item) => (options.featureId ? item.featureId === options.featureId : true))
    .filter((item) => (options.dispatchId ? item.dispatchId === options.dispatchId : true))
    .map(clone);
}

export function getSurveySummaries(featureType?: FeatureType): SurveySummary[] {
  return surveySummaryStore
    .filter((item) => (featureType ? item.featureType === featureType : true))
    .map(clone);
}

export function getSurveySummary(featureId: string): SurveySummary | null {
  const summary = surveySummaryStore.find((item) => item.featureId === featureId);
  return summary ? clone(summary) : null;
}

export function getSurveyWordCloud(featureId?: string): SurveyWordCloudItem[] {
  return (surveyWordCloudStore.get(featureId ?? 'all') ?? surveyWordCloudTop30).map(clone);
}

export function createSurveyLowScoreTicket(input: SurveyLowScoreTicketCreateInput): GovernanceTicket | null {
  const summary = surveySummaryStore.find((item) => item.featureId === input.featureId);
  const feature = featureById.get(input.featureId);
  if (!summary || !feature) return null;

  const ticketId = `ticket_${String(ticketStore.length + 1).padStart(3, '0')}`;
  const createdAt = nextMutationTime(++commentSequence);
  const owner = getOwner(feature);
  const ticket: GovernanceTicket = {
    id: ticketId,
    ticketNo: `QG-20260426-${String(ticketStore.length + 1).padStart(3, '0')}`,
    type: 'quality_fix',
    featureId: feature.id,
    title: `处理 ${feature.name} 的低分问卷反馈`,
    status: 'open',
    severity: summary.csat < 3 || summary.nps < 0 ? 'high' : 'medium',
    description: input.summary ?? `${summary.summary} 当前 CSAT=${summary.csat}，NPS=${summary.nps}。`,
    assigneeUserId: null,
    assigneeTeamId: owner.teamId,
    assigneeUserName: null,
    assigneeTeamName: owner.teamName,
    reporterUserId: input.reporterUserId,
    reporterUserName: input.reporterUserName,
    reporterTeamId: 'team_platform',
    reporterTeamName: input.reporterTeamName,
    createdAt,
    resolvedAt: null,
    latestCommentAt: createdAt,
    relatedAlertIds: [],
  };
  ticketStore.unshift(ticket);
  ticketDetailSeeds.set(ticketId, {
    impactSummary: '低分问卷反馈已触发治理工单，需要跟进消费方体验与语义质量问题。',
    rootCauses: [...summary.topIssues],
    suggestedActions: ['核查低分样本明细', '补充解释与案例模板', '必要时回滚模板或规则配置'],
    timeline: [
      {
        id: `${ticketId}_timeline_001`,
        ticketId,
        type: 'created',
        operatorName: input.reporterUserName,
        summary: '根据低分问卷摘要自动创建治理工单。',
        createdAt,
      },
    ],
  });
  ticketCommentsStore.set(ticketId, []);
  ticketTimelineStore.set(ticketId, ticketDetailSeeds.get(ticketId)?.timeline.map(clone) ?? []);
  summary.relatedTicketIds = Array.from(new Set([ticketId, ...summary.relatedTicketIds]));
  summary.latestAggregatedAt = createdAt;
  surveyResponsesStore
    .filter((item) => item.featureId === feature.id && (item.csat < 3 || item.nps <= 6) && !item.generatedTicketId)
    .slice(0, Math.max(summary.lowScoreCount, 1))
    .forEach((item) => {
      item.generatedTicketId = ticketId;
    });
  degradationEventsStore
    .filter((item) => item.featureId === feature.id && item.source === 'questionnaire')
    .forEach((item) => {
      item.relatedTicketId = ticketId;
    });
  return clone(ticket);
}

export function getQualityMeta() {
  return {
    healthSnapshotCount: qualitySnapshots.length,
    ticketCount: ticketStore.length,
    attributionCount: attributionStore.length,
    backtestJobCount: backtestJobsStore.length,
    selfReviewTemplateCount: selfReviewTemplates.length,
    selfReviewRecordCount: selfReviewRecordsStore.length,
    healthBreakdownSampleCount: healthBreakdownStore.length,
    llmJudgeRunCount: llmJudgeRunsStore.length,
    llmJudgeTemplateCount: llmJudgeTemplatesStore.length,
    llmJudgeBadCaseCount: llmJudgeBadCasesStore.length,
    surveyTemplateCount: surveyTemplatesStore.length,
    surveyDispatchCount: surveyDispatchesStore.length,
    surveyResponseCount: surveyResponsesStore.length,
    surveySummaryCount: surveySummaryStore.length,
    surveyWordCloudCount: surveyWordCloudTop30.length,
  };
}
