import type { DerivedAsset } from '../../../api/assets';

export type AssetDetailView = 'consumer' | 'producer' | 'operator';
export type AssetDetailSource = 'marketplace' | 'recommender' | 'alert' | 'compare' | 'direct';
export type AssetDetailVerdictLevel = 'recommended' | 'conditional' | 'not_recommended';
export type AssetDetailIssueSeverity = 'low' | 'medium' | 'high';
export type AssetDetailTrend = 'up' | 'down' | 'flat';

export interface AssetDetailQueryState {
  view: AssetDetailView;
  source: AssetDetailSource;
  scope: string | null;
  useCase: string | null;
  compareWith: string | null;
  mockError: '401' | '403' | '404' | '500' | 'random' | null;
  chaos: boolean;
}

export interface AssetDetailIdentity {
  assetId: string;
  displayName: string;
  technicalName: string;
  summary: string;
  scenarios: string[];
}

export interface AssetDetailDefinition {
  oneLiner: string;
  longText: string;
  tooltipTermIds: string[];
}

export interface AssetDetailIsIsNot {
  isItems: string[];
  isNotItems: string[];
}

export interface AssetDetailQuantMetric {
  key: string;
  label: string;
  value: string;
  hint: string;
  trend: AssetDetailTrend;
  drilldownId?: string;
  tooltipTermId?: string;
}

export interface AssetDetailReasonItem {
  label: string;
  value: string;
  evidence: string;
}

export interface AssetDetailVerdictBanner {
  level: AssetDetailVerdictLevel;
  title: string;
  summary: string;
  primaryAction: string;
  secondaryAction: string;
  reasons: string[];
}

export interface AssetDetailScopeSelector {
  editable: boolean;
  scopeLabel: string;
  dimensions: Array<{ label: string; value: string }>;
}

export interface AssetDetailCoverageStage {
  key: string;
  label: string;
  coverage: number;
  delta: number;
  reason: string;
  drilldownId?: string;
}

export interface AssetDetailUseCaseOption {
  key: string;
  label: string;
  description: string;
}

export interface AssetDetailUseCaseVerdict {
  useCaseKey: string;
  label: string;
  verdict: AssetDetailVerdictLevel;
  summary: string;
  blockedBy: string[];
}

export interface AssetDetailQualityBadge {
  key: string;
  label: string;
  score: number;
  percentile: number;
  description: string;
}

export interface AssetDetailKnownIssue {
  id: string;
  title: string;
  severity: AssetDetailIssueSeverity;
  summary: string;
  impact: string;
  suggestion: string;
}

export interface AssetDetailStabilityPoint {
  date: string;
  score: number;
  baseline: number;
}

export interface AssetDetailSubscribeImpact {
  highlights: string[];
  metrics: Array<{ label: string; value: string; hint: string }>;
}

export interface AssetDetailTryRunPreset {
  id: string;
  label: string;
  scenario: string;
  expectedReach: number;
  expectedLift: number;
}

export interface AssetDetailTryRunResult {
  selectedPresetId: string;
  expectedReach: number;
  expectedLift: number;
  expectedRisk: string;
  latencyMs: number;
}

export interface AssetDetailCompareRow {
  assetId: string;
  name: string;
  fitScore: number;
  qualityScore: number;
  coverage: number;
  timeliness: string;
  subscriptionHeat: number;
  recommended: boolean;
}

export interface AssetDetailSubscribeCta {
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
}

export interface AssetDetailDrilldownPayload {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface AssetDetailGlossaryTerm {
  term: string;
  definition: string;
  formula?: string;
  source?: string;
}

export interface AssetDetailSamplePreview {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
}

export interface AssetDetailDistributionMiniBin {
  label: string;
  value: number;
}

export interface AssetDetailDistributionMini {
  title: string;
  average: number;
  benchmark: number;
  bins: AssetDetailDistributionMiniBin[];
}

export interface AssetDetailSourceAwareness {
  title: string;
  description: string;
  defaultLayer: 'layer0' | 'layer1' | 'layer2' | 'layer3';
}

export interface AssetDetailSupplierPanel {
  title: string;
  summary: string;
  bullets: string[];
}

export interface AssetDetailCoverageGapAlert {
  level: 'info' | 'warning';
  title: string;
  description: string;
}

export interface AssetDetailGranularityHint {
  title: string;
  summary: string;
  suggestions: string[];
}

export interface AssetDetailPersonalSample {
  id: string;
  label: string;
  description: string;
  scopeTag: string;
}

export interface AssetDetailPeerUsage {
  team: string;
  scenario: string;
  status: 'active' | 'trial' | 'paused';
  note: string;
}

export interface AssetDetailSliceDistribution {
  slice: string;
  ratio: number;
  trend: AssetDetailTrend;
}

export interface AssetDetailBoundaryCase {
  id: string;
  title: string;
  outcome: 'pass' | 'fail';
  reason: string;
}

export interface AssetDetailChangelogItem {
  date: string;
  change: string;
  impact: string;
}

export interface AssetDetailLineageNode {
  id: string;
  label: string;
  type: 'source' | 'process' | 'output';
}

export interface AssetDetailLineageEdge {
  from: string;
  to: string;
}

export interface AssetDetailBaselineCompareRow {
  scenario: string;
  baseline: number;
  actual: number;
  passed: boolean;
}

export interface AssetDetailRoiEstimatorScenario {
  key: string;
  label: string;
  estimatedRevenue: number;
  estimatedCost: number;
  roi: number;
}

export interface AssetDetailPreflightCheckItem {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface AssetDetailMockData {
  asset: DerivedAsset;
  identity: AssetDetailIdentity;
  query: AssetDetailQueryState;
  definition: AssetDetailDefinition;
  isIsNot: AssetDetailIsIsNot;
  quantSummary: AssetDetailQuantMetric[];
  recommendReason: {
    confidence: number;
    summary: string;
    items: AssetDetailReasonItem[];
  };
  verdictBanner: AssetDetailVerdictBanner;
  scopeSelector: AssetDetailScopeSelector;
  coverageWaterfall: AssetDetailCoverageStage[];
  usageSelector: {
    selectedKey: string;
    options: AssetDetailUseCaseOption[];
  };
  qualityVerdict: AssetDetailUseCaseVerdict[];
  qualityBadges: AssetDetailQualityBadge[];
  knownIssues: AssetDetailKnownIssue[];
  stabilityCurve: AssetDetailStabilityPoint[];
  subscribeImpact: AssetDetailSubscribeImpact;
  tryRun: {
    presets: AssetDetailTryRunPreset[];
    result: AssetDetailTryRunResult;
  };
  compareTable: AssetDetailCompareRow[];
  subscribeCta: AssetDetailSubscribeCta;
  drilldowns: Record<string, AssetDetailDrilldownPayload>;
  glossary: Record<string, AssetDetailGlossaryTerm>;
  useCaseTags: string[];
  samplePreview: AssetDetailSamplePreview[];
  distributionMini: AssetDetailDistributionMini;
  sourceAwareness: AssetDetailSourceAwareness;
  supplierPanel: AssetDetailSupplierPanel;
  coverageGapAlert: AssetDetailCoverageGapAlert;
  granularityHint: AssetDetailGranularityHint;
  personalSamples: AssetDetailPersonalSample[];
  peerUsage: AssetDetailPeerUsage[];
  sliceDistribution: AssetDetailSliceDistribution[];
  boundaryCases: AssetDetailBoundaryCase[];
  definitionChangelog: AssetDetailChangelogItem[];
  lineageDiagram: {
    nodes: AssetDetailLineageNode[];
    edges: AssetDetailLineageEdge[];
  };
  baselineCompare: AssetDetailBaselineCompareRow[];
  roiEstimator: AssetDetailRoiEstimatorScenario[];
  preflightCheck: AssetDetailPreflightCheckItem[];
}
