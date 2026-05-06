// ========== 通用 ==========
export type Role = 'business' | 'algo';
export type Domain = 'ecommerce' | 'lifestyle' | 'cross' | 'ecom' | 'local';
export type LifeCycle = 'new' | 'active' | 'hot' | 'deprecated';
export type Namespace =
  | 'trade.common.*'
  | 'trade.ecommerce.*'
  | 'trade.lifestyle.*'
  | 'trade.cross.*';
export type HealthLevel =
  | 'excellent'
  | 'good'
  | 'qualified'
  | 'needs_improvement'
  | 'risk'
  | 'green'
  | 'yellow'
  | 'red';
export type HealthDotLevel = 'green' | 'yellow' | 'red';

// 健康度维度
export interface HealthDimensions {
  freshness: 'good' | 'warn' | 'risk';     // 数据新鲜度
  coverage: 'good' | 'warn' | 'risk';      // 覆盖率
  stability: 'good' | 'warn' | 'risk';     // 稳定性
}

// 资产健康度（带三维度）
export interface AssetHealth {
  overall: 'good' | 'warn' | 'risk';
  dimensions: HealthDimensions;
}

export interface Health {
  score: number;
  level: HealthLevel;
  accuracy: number | HealthDotLevel;
  coverage: number | HealthDotLevel;
  freshness: 'realtime' | 'T+1' | 'T+7' | HealthDotLevel;
  lift: number;
}

// 业务指标提升徽章
export interface UpliftBadge {
  metric: 'GMV' | 'ROI' | 'MAC' | '订单量' | '复购率' | '券转化' | string;
  value: number;           // 正数，已按 % 语义归一（如 18 表示 +18%）
  unit?: '%' | 'x';        // ROI 用 'x'，其他默认 '%'
}

// ========== 资产(标签/人群模板/特征包) ==========
export type AssetType = 'tag' | 'crowd_template' | 'feature_pack' | 'model';
export type AssetIcon = 'crowd' | 'tag' | 'pack' | 'model';

export interface Asset {
  id: string;
  name: string;
  nameBiz?: string;
  nameAlgo?: string;
  namespace: Namespace;
  icon?: AssetIcon;
  type: AssetType;
  domain: Domain;
  lifecycle?: LifeCycle;
  desc: string;
  description?: string;
  health: Health;
  subs: number;
  heat?: number;
  heatDelta?: number;
  roi_hint: string;
  scenarios: string[];
  chipsBiz?: string[];
  chipsAlgo?: string[];
  consumer?: string[];
  consumers?: string[];
  category?: string;
  historicalRevenue?: number;
  uplift?: UpliftBadge;           // 业务指标提升徽章（仅正向）
  assetHealth?: AssetHealth;      // 三维度健康度
  isAIRecommended?: boolean;      // 是否为AI推荐
  dataSourceType?: 'btm_plus' | 'external' | 'cross_domain' | 'private_end'; // 数据源类型：BTM+ / 外采 / 跨域 / 私域
}

// ========== 人群 ==========
export interface CrowdRadar {
  consume: number;
  active: number;
  category: number;
  marketing: number;
  lifecycle: number;
}

export interface CrowdContribItem {
  tag_name: string;
  weight: number;
}

export interface Crowd {
  id: string;
  asset_id: string;
  size: number;
  overlap: number;
  radar_ecommerce: CrowdRadar;
  radar_lifestyle: CrowdRadar;
  contrib: CrowdContribItem[];
  demo: {
    gender: Record<string, number>;
    age: Record<string, number>;
    city: Record<string, number>;
    consume_level: Record<string, number>;
  };
  history_roi: number;
}

// ========== 特征与 Pack ==========
export type FeatureType = 'rule' | 'sequence' | 'algo' | 'vector' | 'llm_intent';

export interface Feature {
  id: string;
  name: string;
  namespace: Namespace;
  type: FeatureType;
  description: string;
  health: Health;
  lineage: { upstream: string[]; downstream: string[] };
  trend_30d: { date: string; accuracy: number; coverage: number }[];
}

export interface FeaturePack {
  id: string;
  name: string;
  features?: string[];
  feature_ids: string[];
  auc?: number;
  lift?: number;
  ks?: number;
  est_lift: { metric: 'CTR' | 'CVR' | 'MAC' | 'CAC' | 'advv'; value: number }[];
  ab_history: {
    ab_name: string;
    metric: string;
    result: number;
    adopted: boolean;
  }[];
}

// ========== 运营动作 ==========
export interface ActionConfig {
  id?: string;
  crowd_id: string;
  channel?: 'push' | 'sms' | 'coupon';
  estimatedGmv?: number;
  estimatedMac?: number;
  touchpoints: ('push' | 'lifestyle_home' | 'ecommerce_coupon')[];
  subsidy_level: 'low' | 'mid' | 'high';
  budget: number;
  copywriting_choice: string;
  channels: ('ldmp' | 'ecommerce_dmp' | 'policy_platform' | 'money_eff' | 'api')[];
}

export interface DispatchTask {
  id: string;
  crowdId?: string;
  actionId?: string;
  title: string;
  created_at: string;
  crowd_size: number;
  channels: string[];
  status: 'queued' | 'running' | 'done' | 'completed';
  result?: { gmv_lift?: number; mac_change?: number; cvr?: number };
}

// ========== 大盘 ==========
export interface KpiPoint {
  date: string;
  asset_count: number;
  cross_ratio: number;
  avg_health: number;
  subs_active: number;
  ab_running: number;
  domain_covered: number;
  mac_change: number;
  gmv_change: number;
  order_change: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'mid' | 'low';
  gap?: number;
  rootCause?: string[];
  suggestedAssets?: string[];
  estimatedLift?: number;
  crowd_size: number;
  expected: { gmv?: number; mac?: number; order?: number };
  owner_suggest: string;
  related_tags: string[];
  preset_action?: Partial<ActionConfig>;
  // 新增字段，兼容未来更长文案
  priority: 'high' | 'mid' | 'low';
  recommender: { name: string; role: string };
  estimatedRevenue?: number;
  validUntil?: string;
}

// ========== Agent 工具 ==========
export interface AgentToolInput { [k: string]: unknown; }

export interface AgentToolOutput {
  text: string;
  cards?: Array<{ type: string; payload: unknown }>;
  followup?: string[];
}

// ========== 其他 ==========
export interface AgentMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  cards?: AgentCard[];
  timestamp: string;
}

export interface AgentCard {
  type: 'asset' | 'chart' | 'list' | 'action' | 'crowd' | 'pack' | 'eval' | 'opp';
  data: any;
}

export type AgentToolStatus = 'loading' | 'done' | 'error';

export interface AgentCta {
  label: string;
  to: string;
}

export interface AgentStep {
  step: number;
  user?: string;
  assistant?: string;
  tool?: string;
  toolStatus?: AgentToolStatus;
  toolText?: string;
  toolOutput?: Record<string, unknown>;
  recommendAssetIds?: string[];
  cta?: AgentCta;
}

export interface RecommendMeta {
  sceneSimilarity: number; // 0-1
  goalLift: number; // 0-1
  scene: string; // 电商/生服/跨域
  goal: string; // 促复购/拉新客/...
}

// 健康度徽章的类型
export interface HealthBadgeProps {
  level: HealthLevel;
  score: number;
}

// 资产卡片的类型（为了兼容性）
export interface SimpleAsset {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'scene' | 'crowd';
  health: HealthLevel;
  score: number;
  category: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ========== 人群诊断 ==========
export interface Channel {
  name: string;
  available: boolean;
}

export interface SceneMatch {
  scene: string;
  matchLevel: 'high' | 'mid' | 'low';
  score: number;
  reasons: string[];
  expectedLift: { gmv: number; roi: number };
}

export interface CoreMetric {
  name: string;
  current: number;
  benchmark: number;
  delta: number;
}

export interface StructureItem {
  name: string;
  value: number;
  benchmark: number;
}

export interface EfficiencyKpi {
  name: string;
  value: number;
  vsMarket: number;
  vsIndustry: number;
}

export interface DualRadarData {
  ecommerce: number[];
  lifestyle: number[];
  indicators: string[];
}

export interface SignalFeature {
  name: string;
  value: number;
  weight: number;
}

export interface SignalDomain {
  name: string;
  coverage: number;
  lift: number;
  features?: SignalFeature[];
  heatmap?: number[][];
}

export interface MatchingSuggestion {
  type: string;
  title: string;
  details: { label: string; value: string }[];
}

export interface LookalikeTier {
  tier: string;
  scale: number;
  roi: number;
  roiDelta: number;
}

export interface SimilarCrowd {
  id: string;
  name: string;
  scale: number;
  overlap: number;
  lift: number;
}

export interface OverlapMatrixItem {
  crowdA: string;
  crowdB: string;
  value: number;
}

export interface UsageRecord {
  id: string;
  date: string;
  scene: string;
  gmv: number;
  roi: number;
  reach: number;
}

export interface HoldoutData {
  test: { gmv: number; conversion: number };
  control: { gmv: number; conversion: number };
  delta: { gmv: number; conversion: number };
}

export interface AttributionNode {
  id: string;
  name: string;
  value: number;
}

export interface AttributionLink {
  source: string;
  target: string;
  value: number;
}

export interface AttributionData {
  nodes: AttributionNode[];
  links: AttributionLink[];
}

export interface EffectReviewData {
  usage: UsageRecord[];
  holdout: HoldoutData;
  attribution: AttributionData;
}

export interface LineageSource {
  table: string;
  fields: string[];
  confidence: number;
  coverage: number;
}

export interface LineageData {
  sources: LineageSource[];
  confidence: number;
  coverage: number;
  forbiddenScenes: string[];
}

export interface CrowdDiagnosisData {
  id: string;
  name: string;
  version: string;
  industry: string;
  updatedAt: string;
  dsl: string;
  scale: number;
  overlap: number;
  historyRoi: number;
  roiDelta: number;
  channels: Channel[];
  scaleSparkline: number[];
  sceneMatches: SceneMatch[];
  coreMetrics: CoreMetric[];
  structure5a: StructureItem[];
  structure6c: StructureItem[];
  efficiencyKpis: EfficiencyKpi[];
  dualRadar: DualRadarData;
  signalDomains: SignalDomain[];
  matchingSuggestions: MatchingSuggestion[];
  lookalike: LookalikeTier[];
  similarCrowds: SimilarCrowd[];
  overlapMatrix: OverlapMatrixItem[];
  effectReview: EffectReviewData;
  lineage: LineageData;
}

// ========== 人群诊断单屏页 ==========
export type CrowdMetricTrend = 'up' | 'down' | 'flat';
export type CrowdDecisionStatus = 'ready' | 'paused' | 'draft';
export type CrowdDistributionSystem = 'ecommerce' | 'lifestyle';
export type CrowdRuleNodeType = 'group' | 'leaf';
export type CrowdRuleOperator = 'AND' | 'OR';
export type CrowdConsumerStatus = 'active' | 'paused';
export type CrowdSceneStatus = 'recommended' | 'review' | 'blocked';
export type CrowdBasisCategoryKey =
  | 'demographic'
  | 'behavior'
  | 'merchant'
  | 'product'
  | 'channel'
  | 'time'
  | 'risk';
export type CrowdComplianceDimensionKey =
  | 'data'
  | 'channel'
  | 'content'
  | 'delivery';
export type CrowdComplianceAdviceBucket =
  | 'recommended'
  | 'review'
  | 'forbidden';

export interface CrowdOwnerInfo {
  name: string;
  role: string;
  team: string;
}

export interface CrowdDetailKpi {
  key: string;
  label: string;
  value: string;
  trend?: CrowdMetricTrend;
  changeText?: string;
  hint?: string;
}

export interface CrowdPortraitSource {
  label: string;
  value: string;
}

export interface CrowdPortraitInfo {
  summary: string;
  confidence: number;
  regeneratedNote?: string;
  sources: CrowdPortraitSource[];
}

export interface CrowdSegmentItem {
  key: string;
  label: string;
  ratio: number;
  tgi: number;
  samplePath: string;
}

export interface CrowdDistributionGroup {
  system: CrowdDistributionSystem;
  title: string;
  segments: CrowdSegmentItem[];
}

export interface CrowdQuadrantCard {
  key: 'people' | 'product' | 'scene' | 'time';
  title: string;
  summary: string;
  tags: string[];
}

export interface CrowdTimeHeatmap {
  days: string[];
  hours: number[];
  values: number[][];
}

export interface CrowdConsumerRow {
  id: string;
  consumer: string;
  channel: string;
  status: CrowdConsumerStatus;
  gmv: number;
  roi: number;
  ctrDelta: number | null;
  note?: string;
}

export interface CrowdConsumerMatrix {
  columns: string[];
  rows: CrowdConsumerRow[];
}

export interface CrowdSceneCard {
  id: string;
  title: string;
  summary: string;
  channel: string;
  expectedGmv: number;
  roi: number;
  status: CrowdSceneStatus;
}

export interface CrowdRevenuePoint {
  date: string;
  gmv: number;
  roi: number;
}

export interface CrowdRuleNode {
  id: string;
  type: CrowdRuleNodeType;
  label: string;
  operator?: CrowdRuleOperator;
  field?: string;
  comparator?: string;
  value?: string;
  contribution?: number;
  children?: CrowdRuleNode[];
}

export interface CrowdRuleViews {
  tree: CrowdRuleNode;
  sql: string;
  naturalLanguage: string;
  foundryPath: string;
}

export interface CrowdBasisItem {
  id: string;
  label: string;
  description: string;
  contribution: number;
}

export interface CrowdBasisCategory {
  key: CrowdBasisCategoryKey;
  label: string;
  enabled: boolean;
  items: CrowdBasisItem[];
}

export interface CrowdLineageNode {
  id: string;
  table: string;
  description: string;
  confidence: number;
  coverage: number;
  fields: string[];
  upstream: string[];
}

export interface CrowdComplianceDimension {
  key: CrowdComplianceDimensionKey;
  label: string;
  status: HealthDotLevel;
  reason: string;
  suggestion: string;
}

export interface CrowdComplianceAdvice {
  id: string;
  title: string;
  description: string;
  bucket: CrowdComplianceAdviceBucket;
}

export interface CrowdComplianceRisk {
  id: string;
  point: string;
  regulation: string;
  level: 'high' | 'mid' | 'low';
}

export interface CrowdAssistantReply {
  id: string;
  question: string;
  answer: string;
  chart?: boolean;
}

export interface CrowdAssistantConfig {
  prompts: string[];
  replies: CrowdAssistantReply[];
}

export interface CrowdDetail {
  id: string;
  crowdName: string;
  crowdCode: string;
  description: string;
  version: string;
  owner: CrowdOwnerInfo;
  updatedAt: string;
  status: CrowdDecisionStatus;
  scale: number;
  estimatedRevenue: number;
  healthScore: number;
  kpis: CrowdDetailKpi[];
  portrait: CrowdPortraitInfo;
  distributions: CrowdDistributionGroup[];
  quadrants: CrowdQuadrantCard[];
  timeHeatmap: CrowdTimeHeatmap;
  consumers: CrowdConsumerMatrix;
  topScenes: CrowdSceneCard[];
  revenueTimeline90d: CrowdRevenuePoint[];
  rule: CrowdRuleViews;
  basisTabs: CrowdBasisCategory[];
  lineage: CrowdLineageNode[];
  compliance: {
    dimensions: CrowdComplianceDimension[];
    advices: CrowdComplianceAdvice[];
    risks: CrowdComplianceRisk[];
  };
  assistant: CrowdAssistantConfig;
}

// ========== Cross-Profile Part 1 基础能力 ==========
export const APP_VIEWS = ['consumer', 'producer', 'operator'] as const;
export type AppView = (typeof APP_VIEWS)[number];

export const USER_ROLES = ['consumer', 'producer', 'producer_admin', 'platform_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const FEATURE_DOMAINS = [
  'user_profile',
  'merchant_profile',
  'product_profile',
  'content_profile',
  'transaction',
  'cross_domain',
] as const;
export type FeatureDomain = (typeof FEATURE_DOMAINS)[number];

export const TAG_LAYERS = ['l0', 'l1', 'l2', 'l3'] as const;
export type TagLayer = (typeof TAG_LAYERS)[number];

export const UPDATE_FREQUENCIES = ['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual'] as const;
export type UpdateFrequency = (typeof UPDATE_FREQUENCIES)[number];

export const DISTRIBUTION_CHANNELS = ['marketplace', 'api', 'batch', 'foundry', 'internal'] as const;
export type DistributionChannel = (typeof DISTRIBUTION_CHANNELS)[number];

export const FEATURE_LIFECYCLE_STAGES = ['draft', 'developing', 'testing', 'listed', 'deprecated', 'archived'] as const;
export type FeatureLifecycleStage = (typeof FEATURE_LIFECYCLE_STAGES)[number];

export const EVALUATION_RESULTS = ['pass', 'warn', 'fail', 'pending'] as const;
export type EvaluationResult = (typeof EVALUATION_RESULTS)[number];

export const EVALUATION_DIMENSIONS = ['accuracy', 'coverage', 'stability', 'freshness', 'latency', 'cost'] as const;
export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];

export const ALERT_TYPES = ['freshness', 'coverage', 'drift', 'latency', 'schema_change', 'cost'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const QUALITY_HEALTH_STATUSES = ['critical', 'warning', 'healthy'] as const;
export type QualityHealthStatus = (typeof QUALITY_HEALTH_STATUSES)[number];

export const GOVERNANCE_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type GovernanceSeverity = (typeof GOVERNANCE_SEVERITIES)[number];

export const QUALITY_ALERT_STATUSES = ['open', 'acknowledged', 'resolved'] as const;
export type QualityAlertStatus = (typeof QUALITY_ALERT_STATUSES)[number];

export const QUALITY_ALERT_RULE_STATUSES = ['enabled', 'disabled'] as const;
export type QualityAlertRuleStatus = (typeof QUALITY_ALERT_RULE_STATUSES)[number];

export const QUALITY_METRIC_KEYS = ['CTR', 'CVR', 'ROI', 'MAC', 'GMV', 'AB收益'] as const;
export type QualityMetricKey = (typeof QUALITY_METRIC_KEYS)[number];

export const QUALITY_EXPORT_FORMATS = ['csv', 'xlsx'] as const;
export type QualityExportFormat = (typeof QUALITY_EXPORT_FORMATS)[number];

export const BACKTEST_JOB_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
export type BacktestJobStatus = (typeof BACKTEST_JOB_STATUSES)[number];

export const BACKTEST_SCENARIOS = ['future_behavior', 'mask_interest'] as const;
export type BacktestScenario = (typeof BACKTEST_SCENARIOS)[number];

export const BACKTEST_TRIGGER_TYPES = ['scheduled', 'manual', 'gate'] as const;
export type BacktestTriggerType = (typeof BACKTEST_TRIGGER_TYPES)[number];

export const SELF_REVIEW_RECORD_STATUSES = ['draft', 'submitted', 'passed', 'failed'] as const;
export type SelfReviewRecordStatus = (typeof SELF_REVIEW_RECORD_STATUSES)[number];

export const HEALTH_SCORE_SOURCES = [
  'static_evaluation',
  'auto_backtest',
  'self_review',
  'llm_judgement',
  'human_eval',
  'questionnaire',
] as const;
export type HealthScoreSource = (typeof HEALTH_SCORE_SOURCES)[number];

export const PLACEHOLDER_ENTRY_KEYS = ['human_eval', 'eval_orchestrator'] as const;
export type PlaceholderEntryKey = (typeof PLACEHOLDER_ENTRY_KEYS)[number];

export const DEMAND_SOURCES = ['consumer_feedback', 'sales_request', 'strategy_project', 'governance', 'ai_discovery'] as const;
export type DemandSource = (typeof DEMAND_SOURCES)[number];

export const DEMAND_STATUSES = ['open', 'claimed', 'planning', 'in_progress', 'completed', 'rejected'] as const;
export type DemandStatus = (typeof DEMAND_STATUSES)[number];

export const DEMAND_SCENARIOS = [
  '拉新',
  '促活',
  '召回',
  '转化',
  '会员运营',
  '内容推荐',
  '商家经营',
] as const;
export type DemandScenario = (typeof DEMAND_SCENARIOS)[number];

export const GOVERNANCE_TICKET_TYPES = ['quality_fix', 'schema_review', 'publish_review', 'appeal', 'compliance'] as const;
export type GovernanceTicketType = (typeof GOVERNANCE_TICKET_TYPES)[number];

export const PIPELINE_STAGES = ['queued', 'extract', 'transform', 'validate', 'publish', 'done', 'failed'] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const FACTORY_EDITOR_TYPES = ['rule', 'sql', 'model', 'dsl', 'prompt'] as const;
export type FactoryEditorType = (typeof FACTORY_EDITOR_TYPES)[number];

export const FACTORY_STAGE_NAMES = ['collect', 'process', 'evaluate', 'distribute'] as const;
export type FactoryStageName = (typeof FACTORY_STAGE_NAMES)[number];

export const FACTORY_STAGE_STATUSES = ['completed', 'running', 'failed', 'pending'] as const;
export type FactoryStageStatus = (typeof FACTORY_STAGE_STATUSES)[number];

export const FACTORY_PIPELINE_RUN_STATUSES = ['completed', 'running', 'failed', 'pending'] as const;
export type FactoryPipelineRunStatus = (typeof FACTORY_PIPELINE_RUN_STATUSES)[number];

export const FEATURE_TYPE_TO_FACTORY_LABEL_MAP: Record<FeatureType, string> = {
  rule: '规则',
  sequence: '序列',
  algo: '推理',
  vector: '向量',
  llm_intent: 'LLM',
};

export const FEATURE_TYPE_TO_FACTORY_EDITOR_MAP: Record<FeatureType, FactoryEditorType> = {
  rule: 'rule',
  sequence: 'sql',
  algo: 'model',
  vector: 'dsl',
  llm_intent: 'prompt',
};

export const PIPELINE_STAGE_TO_FACTORY_STAGE_MAP: Record<PipelineStage, FactoryStageName> = {
  queued: 'collect',
  extract: 'collect',
  transform: 'process',
  validate: 'evaluate',
  publish: 'distribute',
  done: 'distribute',
  failed: 'evaluate',
};

export const DATA_SCOPE_MODES = ['self', 'team', 'global'] as const;
export type DataScopeMode = (typeof DATA_SCOPE_MODES)[number];

export type Nullable<T> = T | null;

export interface CaliberVariant {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  metricDefinition: string;
  sampleValue: Nullable<string>;
}

export interface LineageInfo {
  upstreamFeatureIds: string[];
  upstreamTableNames: string[];
  downstreamConsumerTeams: string[];
  dependencyDepth: number;
  lastVerifiedAt: Nullable<string>;
}

export interface AttributionSummary {
  totalConsumptionTeams: number;
  totalTriggeredRevenue: number;
  topConsumerTeamName: Nullable<string>;
  lastConsumptionAt: Nullable<string>;
}

export interface FeatureVersion {
  id: string;
  version: string;
  versionLabel: string;
  changelog: string;
  createdAt: string;
  createdBy: string;
  isLatest: boolean;
  status: FeatureLifecycleStage;
  caliberVariantIds: string[];
  evaluationReportId: Nullable<string>;
  pipelineRunId: Nullable<string>;
  publishedAt: Nullable<string>;
}

export interface EvaluationMetric {
  dimension: EvaluationDimension;
  score: number;
  baselineScore: Nullable<number>;
  result: EvaluationResult;
  summary: string;
}

export interface EvaluationReport {
  id: string;
  featureId: string;
  featureVersionId: string;
  reportNo: string;
  overallResult: EvaluationResult;
  metrics: EvaluationMetric[];
  evaluator: string;
  evaluatedAt: string;
  recommendation: string;
  blockedReason: Nullable<string>;
}

export interface QualitySnapshot {
  id: string;
  featureId: string;
  snapshotAt: string;
  score: number;
  freshnessHours: number;
  coverageRate: number;
  stabilityRate: number;
  latestAlertType: Nullable<AlertType>;
  latestAlertMessage: Nullable<string>;
  status?: QualityHealthStatus;
  featureName?: string;
  featureType?: FeatureType;
  featureDomain?: FeatureDomain;
  ownerTeamId?: Nullable<string>;
  ownerTeamName?: Nullable<string>;
  affectedDimensions?: EvaluationDimension[];
}

export interface ConsumptionRecord {
  id: string;
  featureId: string;
  consumerTeamId: string;
  consumerTeamName: string;
  sceneName: string;
  channel: DistributionChannel;
  consumedAt: string;
  requestCount: number;
  successRate: number;
  consumerUserId: null;
  consumerUserName: null;
  abEffect?: Nullable<number>;
  gmvContribution?: Nullable<number>;
  roiLift?: Nullable<number>;
}

export interface AttributionRecord {
  id: string;
  featureId: string;
  consumerTeamId?: Nullable<string>;
  consumerTeamName: string;
  sourceChannel: DistributionChannel;
  attributedRevenue: number;
  attributedOrders: number;
  windowDays: number;
  calculatedAt: string;
  ownerUserId: Nullable<string>;
  metricBreakdown?: Partial<Record<QualityMetricKey, number>>;
  rankInDomain?: Nullable<number>;
}

export interface DemandGap {
  id: string;
  title: string;
  source: DemandSource;
  status: DemandStatus;
  priority: 'high' | 'mid' | 'low';
  requestedByTeam: string;
  relatedDomain: FeatureDomain;
  expectedBusinessValue: number;
  claimedByUserId: Nullable<string>;
  dueAt: Nullable<string>;
  scenario?: Nullable<DemandScenario>;
  queryText?: Nullable<string>;
  unmetQueryCount?: Nullable<number>;
  relatedFeatureIds?: string[];
  claimedByUserName?: Nullable<string>;
  claimedByTeamName?: Nullable<string>;
  rootCauseType?: Nullable<'missing_feature' | 'quality' | 'pipeline' | 'fusion'>;
}

export interface PipelineRun {
  id: string;
  featureId: string;
  featureVersionId: Nullable<string>;
  stage: PipelineStage;
  status: 'queued' | 'running' | 'success' | 'failed';
  startedAt: string;
  finishedAt: Nullable<string>;
  durationSeconds: Nullable<number>;
  triggerType: 'manual' | 'scheduled' | 'publish_flow';
  errorMessage: Nullable<string>;
}

export interface FactoryPipelineStageProgress {
  name: FactoryStageName;
  label: string;
  status: FactoryStageStatus;
  ownerTeamName: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
}

export interface FactoryPipelineRunWithFeature extends PipelineRun {
  feature: Feature;
  pipelineType: FeatureType;
  pipelineLabel: string;
  runStatus: FactoryPipelineRunStatus;
  currentStageName: FactoryStageName;
  stages: FactoryPipelineStageProgress[];
}

export interface FactoryOverviewCard {
  featureType: FeatureType;
  label: string;
  total: number;
  runStatusCounts: Record<FactoryPipelineRunStatus, number>;
  medianLaunchDays: number;
}

export interface FactoryLaunchCycleSample {
  featureId: string;
  featureName: string;
  pipelineType: FeatureType;
  launchDays: number;
  releasedAt: string;
}

export interface FactoryLaunchCycleStats {
  baselineDays: number;
  medianDays: number;
  targetDays: number;
  samples: FactoryLaunchCycleSample[];
}

export interface FactoryFeatureConfigMetricTarget {
  dimension: EvaluationDimension;
  baselineScore: number;
  targetScore: number;
}

export interface FactoryFeatureConfig {
  featureId: string;
  featureName: string;
  pipelineType: FeatureType;
  editorType: FactoryEditorType;
  versionId: string;
  isDraft: boolean;
  updatedAt: string;
  dataSource: {
    primaryTable: string;
    joinTables: string[];
    partitionKey: string;
    updateFrequency: UpdateFrequency;
    filters: string[];
  };
  idMapping: {
    primaryIdType: string;
    mappingPolicy: string;
    bridgeTable: string;
    ttlDays: number;
  };
  processingLogic: {
    summary: string;
    content: string;
    inputFields: string[];
    outputField: string;
  };
  outputConfig: {
    namespace: string;
    channel: DistributionChannel;
    topicName: string;
    ownerTeamName: string;
    slaMinutes: number;
  };
  evaluationBaseline: {
    sampleSize: number;
    reportId: string;
    metrics: FactoryFeatureConfigMetricTarget[];
  };
}

export interface FactorySimilaritySearchResult {
  featureId: string;
  featureName: string;
  type: FeatureType;
  domain: FeatureDomain;
  lifecycleStage: FeatureLifecycleStage;
  similarityScore: number;
  accuracy: number;
  coverage: number;
  updateFrequency: UpdateFrequency;
  reuseSuggestion: string;
  hitReasons: string[];
}

export interface FactoryCaliberCompareRow {
  featureId: string;
  featureName: string;
  caliber: string;
  dataSource: string;
  coverageRate: number;
  accuracyRate: number;
  updateFrequency: UpdateFrequency;
  ownerTeamName: string;
}

export interface FactorySubmitPipelineResponse {
  featureId: string;
  pipelineRun: FactoryPipelineRunWithFeature;
  message: string;
}

export interface GovernanceTicket {
  id: string;
  ticketNo: string;
  type: GovernanceTicketType;
  featureId: Nullable<string>;
  title: string;
  status: 'open' | 'processing' | 'resolved' | 'closed';
  severity?: GovernanceSeverity;
  description?: string;
  assigneeUserId: Nullable<string>;
  assigneeTeamId: Nullable<string>;
  assigneeUserName?: Nullable<string>;
  assigneeTeamName?: Nullable<string>;
  reporterUserId?: Nullable<string>;
  reporterUserName?: Nullable<string>;
  reporterTeamId?: Nullable<string>;
  reporterTeamName?: Nullable<string>;
  createdAt: string;
  resolvedAt: Nullable<string>;
  latestCommentAt?: Nullable<string>;
  relatedAlertIds?: string[];
}

export interface QualityAlertOverview {
  totalFeatures: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  openAlertCount: number;
  openTicketCount: number;
  enabledRuleCount: number;
  avgScore: number;
}

export interface QualityHealthListItem {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamId: string;
  ownerTeamName: string;
  updateFrequency: UpdateFrequency;
  status: QualityHealthStatus;
  latestSnapshot: QualitySnapshot;
  latestAlertTitle: Nullable<string>;
  activeAlertCount: number;
  activeTicketCount: number;
}

export interface QualityHealthHeatmapPoint {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  status: QualityHealthStatus;
  score: number;
  freshnessHours: number;
  coverageRate: number;
  stabilityRate: number;
}

export interface QualityTrendPoint {
  date: string;
  score: number;
  accuracyRate: number;
  coverageRate: number;
  stabilityRate: number;
  freshnessHours: number;
  alertCount: number;
}

export interface BacktestMetrics {
  sampleSize: number;
  accuracy: number;
  recallAtK: number;
  auc: number;
  lift: number;
  precision: number;
  baselineAccuracy: number;
  staticAccuracy: number;
  driftScore: number;
  accuracyDelta: number;
  gateThreshold: number;
}

export interface BacktestTrendPoint {
  date: string;
  accuracy: number;
  recallAtK: number;
  auc: number;
  lift: number;
  sampleSize: number;
  driftScore: number;
}

export interface BacktestJob {
  id: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  scenario: BacktestScenario;
  status: BacktestJobStatus;
  triggerType: BacktestTriggerType;
  createdAt: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
  sampleWindowDays: 7 | 14 | 30;
  metrics: Nullable<BacktestMetrics>;
  recentTrend: BacktestTrendPoint[];
  driftAlert: boolean;
  relatedTicketId: Nullable<string>;
  failureReason: Nullable<string>;
}

export interface QualityAlert {
  id: string;
  ruleId: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  alertType: AlertType;
  status: QualityAlertStatus;
  healthStatus: QualityHealthStatus;
  title: string;
  summary: string;
  triggeredAt: string;
  currentValue: number;
  thresholdValue: number;
  relatedTicketId: Nullable<string>;
}

export interface QualityAlertRule {
  id: string;
  name: string;
  alertType: AlertType;
  ownerTeamId: string;
  ownerTeamName: string;
  metricLabel: string;
  comparator: '<' | '<=' | '>' | '>=';
  thresholdValue: number;
  status: QualityAlertRuleStatus;
  latestTriggeredAt: Nullable<string>;
}

export interface QualityHealthReport {
  id: string;
  generatedAt: string;
  windowDays: number;
  totalFeatures: number;
  avgScore: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  topRisks: Array<{
    featureId: string;
    featureName: string;
    ownerTeamName: string;
    status: QualityHealthStatus;
    reason: string;
  }>;
  recommendations: string[];
}

export interface GovernanceTicketComment {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorUserName: string;
  authorTeamName: string;
  content: string;
  createdAt: string;
}

export interface GovernanceTicketTimelineEntry {
  id: string;
  ticketId: string;
  type: 'created' | 'assigned' | 'commented' | 'status_changed' | 'resolved' | 'closed';
  operatorName: string;
  summary: string;
  createdAt: string;
  toStatus?: GovernanceTicket['status'];
}

export interface GovernanceTicketDetail {
  ticket: GovernanceTicket;
  impactSummary: string;
  rootCauses: string[];
  suggestedActions: string[];
  relatedAlerts: QualityAlert[];
  timeline: GovernanceTicketTimelineEntry[];
  comments: GovernanceTicketComment[];
}

export interface SelfReviewItem {
  id: string;
  group: string;
  title: string;
  description: string;
  required: boolean;
  maxScore: number;
  autoCheckRule: string;
  autoCheckStatus: 'pass' | 'warn' | 'fail';
  autoCheckSummary: string;
  guidance: string;
  score?: Nullable<number>;
  comment?: Nullable<string>;
}

export interface SelfReviewTemplate {
  id: string;
  featureType: FeatureType;
  name: string;
  version: string;
  passingScore: number;
  description: string;
  items: SelfReviewItem[];
}

export interface SelfReviewRecord {
  id: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  templateId: string;
  templateName: string;
  reviewerUserName: string;
  reviewerTeamName: string;
  status: SelfReviewRecordStatus;
  totalScore: number;
  maxScore: number;
  progressRate: number;
  submittedAt: Nullable<string>;
  createdAt: string;
  updatedAt: string;
  recommendation: string;
  nextLifecycleStage: 'draft' | 'evaluating';
  aiSuggestions: string[];
  items: SelfReviewItem[];
}

export const LLM_JUDGE_RUN_STATUSES = ['queued', 'running', 'completed', 'failed'] as const;
export type LLMJudgeRunStatus = (typeof LLM_JUDGE_RUN_STATUSES)[number];

export const LLM_JUDGE_TRIGGER_MODES = ['manual', 'scheduled', 'gate'] as const;
export type LLMJudgeTriggerMode = (typeof LLM_JUDGE_TRIGGER_MODES)[number];

export const LLM_JUDGE_BAD_CASE_STATUSES = ['new', 'added_to_training', 'manual_review', 'resolved'] as const;
export type LLMJudgeBadCaseStatus = (typeof LLM_JUDGE_BAD_CASE_STATUSES)[number];

export const LLM_JUDGE_BAD_CASE_ACTIONS = ['add_to_training', 'push_manual_review', 'resolve'] as const;
export type LLMJudgeBadCaseAction = (typeof LLM_JUDGE_BAD_CASE_ACTIONS)[number];

export const SURVEY_TEMPLATE_SCENARIOS = ['first_subscription', 'experience_change', 'quarterly_nps'] as const;
export type SurveyTemplateScenario = (typeof SURVEY_TEMPLATE_SCENARIOS)[number];

export const SURVEY_TEMPLATE_STATUSES = ['draft', 'active', 'archived'] as const;
export type SurveyTemplateStatus = (typeof SURVEY_TEMPLATE_STATUSES)[number];

export const SURVEY_DISPATCH_STATUSES = ['draft', 'scheduled', 'running', 'completed'] as const;
export type SurveyDispatchStatus = (typeof SURVEY_DISPATCH_STATUSES)[number];

export const SURVEY_QUESTION_TYPES = ['csat', 'nps', 'single_choice', 'multiple_choice', 'text'] as const;
export type SurveyQuestionType = (typeof SURVEY_QUESTION_TYPES)[number];

export const SURVEY_RESPONSE_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type SurveyResponseSentiment = (typeof SURVEY_RESPONSE_SENTIMENTS)[number];

export interface LLMJudgeDimensionScore {
  key: 'semantic_accuracy' | 'instruction_following' | 'consistency' | 'safety';
  label: string;
  score: number;
  summary: string;
}

export interface LLMJudgeFewShotExample {
  id: string;
  input: string;
  expectedOutput: string;
  note?: string;
}

export interface LLMJudgePromptTemplateVersion {
  version: string;
  prompt: string;
  rubric: string[];
  fewShots: LLMJudgeFewShotExample[];
  changeNote: string;
  createdAt: string;
  createdBy: string;
  isCurrent: boolean;
}

export interface LLMJudgePromptTemplate {
  id: string;
  name: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  description: string;
  judgeModel: string;
  status: 'draft' | 'active';
  tags: string[];
  currentVersion: string;
  prompt: string;
  rubric: string[];
  fewShots: LLMJudgeFewShotExample[];
  versions: LLMJudgePromptTemplateVersion[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LLMJudgeRun {
  id: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  templateId: string;
  templateName: string;
  templateVersion: string;
  judgeModel: string;
  status: LLMJudgeRunStatus;
  triggerMode: LLMJudgeTriggerMode;
  sampleSize: number;
  overallScore: number;
  scoreDiffVsPrev: number;
  dimensions: LLMJudgeDimensionScore[];
  summary: string;
  badCaseCount: number;
  createdAt: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
  ownerTeamName: string;
}

export interface LLMJudgeBadCase {
  id: string;
  runId: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  templateId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  reason: string;
  tags: string[];
  status: LLMJudgeBadCaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestionOption {
  label: string;
  value: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: SurveyQuestionOption[];
}

export interface SurveyTemplate {
  id: string;
  name: string;
  scenario: SurveyTemplateScenario;
  status: SurveyTemplateStatus;
  version: string;
  description: string;
  targetFeatureTypes: FeatureType[];
  audienceRule: string;
  autoTriggerRule: string;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SurveyDispatch {
  id: string;
  templateId: string;
  templateName: string;
  scenario: SurveyTemplateScenario;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  ownerTeamName: string;
  channel: 'feishu' | 'email' | 'console';
  status: SurveyDispatchStatus;
  audienceRule: string;
  sampleSize: number;
  responseCount: number;
  lowScoreAlertCount: number;
  autoCreateTicket: boolean;
  scheduledAt: string;
  launchedAt: Nullable<string>;
  completedAt: Nullable<string>;
}

export interface SurveyResponseAnswer {
  questionId: string;
  questionTitle: string;
  value: string | string[] | number;
}

export interface SurveyResponse {
  id: string;
  dispatchId: string;
  templateId: string;
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  respondentTeamName: string;
  respondentRole: string;
  csat: number;
  nps: number;
  answers: SurveyResponseAnswer[];
  comment: string;
  sentiment: SurveyResponseSentiment;
  submittedAt: string;
  generatedTicketId?: Nullable<string>;
}

export interface SurveyWordCloudItem {
  term: string;
  weight: number;
  sentiment: SurveyResponseSentiment;
}

export interface SurveySummary {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  templateIds: string[];
  latestDispatchId: string;
  responseCount: number;
  csat: number;
  nps: number;
  lowScoreCount: number;
  summary: string;
  topIssues: string[];
  latestAggregatedAt: string;
  relatedTicketIds: string[];
}

export interface QualityAttributionKpi {
  key: QualityMetricKey;
  label: string;
  value: number;
  unit: '%' | '万元' | 'bp' | 'x';
  delta: number;
  description: string;
}

export interface QualityValueRankingItem {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  rank: number;
  totalRevenue: number;
  totalOrders: number;
  totalConsumptionTeams: number;
  metricBreakdown: Partial<Record<QualityMetricKey, number>>;
}

export interface QualityAttributionTrendPoint {
  period: string;
  metricValues: Partial<Record<QualityMetricKey, number>>;
}

export interface QualityFeatureAttributionDetail {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  rankInDomain: number;
  summary: string;
  metrics: Array<{
    key: QualityMetricKey;
    label: string;
    value: number;
    unit: '%' | '万元' | 'bp' | 'x';
    rankText: string;
  }>;
  trends: QualityAttributionTrendPoint[];
}

export interface HealthScoreBreakdownSource {
  source: HealthScoreSource;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  participatesInScore: boolean;
  summary: string;
}

export interface HealthScoreRadarPoint {
  label: string;
  score: number;
}

export interface HealthScoreBreakdown {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  ownerTeamName: string;
  overallScore: number;
  status: QualityHealthStatus;
  updatedAt: string;
  degraded: boolean;
  sources: HealthScoreBreakdownSource[];
  radar: HealthScoreRadarPoint[];
}

export interface HealthScoreTrendPoint {
  date: string;
  overallScore: number;
  staticScore: number;
  backtestScore: number;
  selfReviewScore: number;
  degraded: boolean;
}

export interface QualityDegradationEvent {
  id: string;
  featureId: string;
  featureName: string;
  source: HealthScoreSource;
  severity: GovernanceSeverity;
  reason: string;
  fromScore: number;
  toScore: number;
  triggeredAt: string;
  relatedTicketId: Nullable<string>;
  resolvedAt: Nullable<string>;
}

export interface QualityPlaceholderEntry {
  key: PlaceholderEntryKey;
  title: string;
  routePath: string;
  description: string;
  available: boolean;
}

export interface ProducerDashboardSupplyCoverage {
  coverageRate: number;
  coveredGapCount: number;
  totalGapCount: number;
  activeFeatureCount: number;
  totalFeatureCount: number;
  domainBreakdown: Array<{
    domain: FeatureDomain;
    coveredGapCount: number;
    totalGapCount: number;
    featureCount: number;
    coverageRate: number;
  }>;
}

export interface ProducerDashboardPipelineOverview {
  totalRuns: number;
  runStatusCounts: Record<FactoryPipelineRunStatus, number>;
  cards: FactoryOverviewCard[];
  attentionRuns: FactoryPipelineRunWithFeature[];
}

export interface ProducerRevenueLoop {
  kpis: QualityAttributionKpi[];
  topConsumers: QualityValueRankingItem[];
  latestCalculatedAt: Nullable<string>;
}

export interface DemandHeatmapCell {
  scenario: DemandScenario;
  domain: FeatureDomain;
  demandCount: number;
  openGapCount: number;
  claimedGapCount: number;
  totalBusinessValue: number;
  unmatchedQueryCount: number;
  gapIds: string[];
}

export interface UnmatchedQueryRankingItem {
  id: string;
  queryText: string;
  scenario: DemandScenario;
  domain: FeatureDomain;
  source: DemandSource;
  searchCount: number;
  weeklyDelta: number;
  relatedGapIds: string[];
}

export interface QualityExportEntry {
  id: string;
  scope: 'governance' | 'tickets' | 'attribution';
  format: QualityExportFormat;
  fileName: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface FusionRelation {
  id: string;
  sourceFeatureId: string;
  targetFeatureId: string;
  relationType: 'derived_from' | 'paired_with' | 'overlaps_with' | 'replaces';
  confidence: number;
  note: Nullable<string>;
  createdAt: string;
}

export interface FusionGraphNode {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  healthScore: number;
  role: 'target' | 'upstream' | 'downstream' | 'peer';
}

export interface FusionGraphData {
  nodes: FusionGraphNode[];
  relations: FusionRelation[];
}

export interface FusionQualityCompareRow {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  featureDomain: FeatureDomain;
  relationType: Nullable<FusionRelation['relationType']>;
  qualitySnapshot: QualitySnapshot;
  attributedRevenue: number;
  consumptionTeams: number;
}

export interface FusionEvaluationRun {
  evalRunId: string;
  featureId: string;
  status: 'queued' | 'running' | 'completed';
  createdAt: string;
  finishedAt: Nullable<string>;
}

export interface FusionEvaluationResult {
  evalRunId: string;
  featureId: string;
  summary: string;
  overallScore: number;
  decision: 'promote' | 'observe' | 'rollback';
  dimensions: EvaluationMetric[];
  comparedFeatureIds: string[];
  createdAt: string;
  finishedAt: string;
}

export interface DrilldownRootCauseItem {
  id: string;
  type: 'quality' | 'pipeline' | 'fusion' | 'coverage';
  title: string;
  summary: string;
  impactScope: string;
  severity: GovernanceSeverity;
  relatedPipelineRunId: Nullable<string>;
  relatedTicketId: Nullable<string>;
}

export interface DrilldownSegmentAccuracy {
  segment: string;
  accuracyRate: number;
  sampleSize: number;
  deltaVsBaseline: number;
}

export interface DrilldownQualityAttributionAnalysis {
  feature: Feature;
  latestSnapshot: Nullable<QualitySnapshot>;
  attributionDetail: Nullable<QualityFeatureAttributionDetail>;
  qualityTrend: QualityTrendPoint[];
  rootCauses: DrilldownRootCauseItem[];
  segmentAccuracy: DrilldownSegmentAccuracy[];
}

export interface FeatureOwnerInfo {
  ownerUserId: Nullable<string>;
  ownerTeamId: string;
  ownerTeamName: string;
}

export interface FeatureSla {
  freshnessTarget: Nullable<string>;
  latencyTargetMs: Nullable<number>;
  availabilityTarget: Nullable<number>;
  coverageTarget: Nullable<number>;
  escalationPolicy: Nullable<string>;
}

export interface FeatureOperationalMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  window: Nullable<string>;
  trend: Nullable<'up' | 'down' | 'flat'>;
  updatedAt: Nullable<string>;
}

export interface FeatureOperationalMetrics {
  adoption: FeatureOperationalMetric[];
  businessImpact: FeatureOperationalMetric[];
  reliability: FeatureOperationalMetric[];
}

export interface Feature {
  domain?: FeatureDomain;
  tagLayer?: Nullable<TagLayer>;
  updateFrequency?: Nullable<UpdateFrequency>;
  distributionChannels?: DistributionChannel[];
  lifecycleStage?: FeatureLifecycleStage;
  owner?: FeatureOwnerInfo;
  currentVersionId?: Nullable<string>;
  versions?: FeatureVersion[];
  caliberVariants?: CaliberVariant[];
  lineageInfo?: Nullable<LineageInfo>;
  sla?: Nullable<FeatureSla>;
  operationalMetrics?: Nullable<FeatureOperationalMetrics>;
  attributionSummary?: Nullable<AttributionSummary>;
  latestEvaluation?: Nullable<EvaluationReport>;
  latestQualitySnapshot?: Nullable<QualitySnapshot>;
}

export interface UserPermission {
  userId: string;
  userName: string;
  teamId: string;
  teamName: string;
  role: UserRole;
  availableViews: AppView[];
  defaultView: AppView;
  dataScopeMode: DataScopeMode;
  enabledActions: string[];
  maskedConsumerIdentity: boolean;
}

export interface ViewStateSnapshot {
  userRole: UserRole;
  currentView: AppView;
  availableViews: AppView[];
  defaultView: AppView;
}

export interface ViewOption {
  view: AppView;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ViewSwitcherProps {
  current_view: AppView;
  available_views: ViewOption[];
  on_switch: (nextView: AppView) => void;
  size?: 'sm' | 'md';
}
