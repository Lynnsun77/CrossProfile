export type RecommendStep = 'entry' | 'parsing' | 'recommending' | 'result';

export type RecommendPhase = 'idle' | 'parse' | 'recommend' | 'gap' | 'done';

export type RecommendSubRole = 'business' | 'algorithm';

export type RecommendView = 'A' | 'B';

export type RecommendInput = {
  text?: string;
  docUrl?: string;
  scenarioId?: string;
  goalId?: string;
  sceneId?: string;
};

export type RecommendReason = {
  biz_goal_echo?: string;
  scene_echo?: string;
  goal_match_score?: number;
  goal_metric_proof?: string;
  scene_match_score?: number;
  scene_evidence?: string;
  query_keyword_hit?: string[];
};

export type RecommendConfidenceStatus = 'recommended' | 'accepted' | 'needReview';

export function statusFromConfidence(confidence: number): RecommendConfidenceStatus {
  if (confidence >= 0.8) return 'recommended';
  if (confidence >= 0.6) return 'accepted';
  return 'needReview';
}

export interface RequirementCard {
  industry: string; // 川渝火锅
  merchant: { id: string; name: string };
  problems: { id: string; segment: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  miningScope: { selfHistory: boolean; benchmark: boolean; crossIndustry: boolean };
  actionTypes: { product: boolean; marketing: boolean; content: boolean; acquisition: boolean };
  featureDims: { consumeLevel: boolean; scene: boolean; keyword: boolean; frequency: boolean };
  confidence: number; // 0-1
  status?: RecommendConfidenceStatus;
}

export interface AssetRef {
  id: string;
  name: string;
  type: string;
}

export type ThinkingEventStatus = 'pending' | 'running' | 'done' | 'failed' | 'ok' | 'warn';

export interface ThinkingEvent {
  id?: string;
  t: number;
  phase: Exclude<RecommendPhase, 'idle' | 'done'>;
  node: string;
  text: string;
  status?: ThinkingEventStatus;
}

export type ThinkingStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout';

export type IntentSource = 'manual' | 'metrics' | 'feishu_doc';

export interface IntentInput {
  text: string;
  source: IntentSource;
  submittedAt: number | null;
  hasFeishuDoc: boolean;
  truncated: boolean; // 超过 2000 字
}

export interface ChainNode {
  id: string;
  order: number;
  title: string;
  desc: string;
  status: 'pending' | 'running' | 'done';
}

export interface ThinkingTask {
  taskId: string;
  startedAt: number;
  durationMs: number | null;
  status: ThinkingStatus;
  nodes: ChainNode[]; // 允许超过 5，首屏只展示前 5
}

export type RecommendGroupKind = 'ai' | 'cohort' | 'fallback';

export interface RecommendGroup {
  id: string;
  kind: RecommendGroupKind;
  title: string;
  cards: RecommendCard[]; // fallback 允许为空
  combinedLift?: number; // 组合增益，如 0.18 表示 +18%
  comboTitle?: string; // 组合标题，例如 "电商复购 × 跨域高消费妈妈"
}

export interface AssetDrawerState {
  open: boolean;
  cardId: string | null;
}

export type DeployStatus = 'draft' | 'submitted';

export interface DeployConfig {
  open: boolean;
  cardId: string | null;
  downstream: string | null;
  libraUrl: string;
  status: DeployStatus;
  error: string | null;
}

export const DEFAULT_CHAIN_NODE_LIMIT = 5;

export interface ActionCard {
  id: string;
  problemId: string;
  actionType: 'product' | 'marketing' | 'acquisition' | 'content';
  title: string;
  detail: string;
  referencedAssets: AssetRef[];
  expectedKpi: { metric: string; lift: number };
  confidence: number;
  reasoning: string;
  status: RecommendConfidenceStatus;
}

export interface RequirementDraft extends RequirementCard {
  merchantId: string;
  merchantName: string;
  problemCrowds: { key: string; label: string; priority: number }[];
  scopes: { key: string; label: string; checked: boolean }[];
  actions: { key: string; label: string; checked: boolean }[];
  features: { key: string; label: string; checked: boolean }[];
  docUrl?: string;
  docTitle?: string;
}

export interface RecommendCard extends ActionCard {
  crowd: string;
  action: 'product' | 'campaign' | 'acquire';
  desc: string;
  refs: string[];
  kpi: string;
  tag: '🟢' | '🟡';
  summary?: string;
  assetRefs?: AssetRef[];
  sortKeys?: { relevance: number; revenue: number; audienceSize: number };
  consumers?: string[];
  consumeHeat?: number;
  healthStatus?: 'healthy' | 'warning' | 'offline';
  reason?: string;
  recommend_reason?: RecommendReason;
  typeTags?: string[];
  sceneTags?: string[];
  audienceSize?: number;
  reason_humanized?: string;
  audience_narrative?: string;
}

export type RecommendSectionId = 'paragraph_1' | 'paragraph_2' | 'paragraph_3';

export type RecommendSectionBgStyle = 'plain' | 'accent' | 'muted';

export type RecommendSlotKind = 'card_list' | 'combo_group' | 'fallback_cta';

export type AdaptType = 'recommend_group' | 'recommend_cards' | 'fallback';

export interface AdaptMeta {
  type: AdaptType;
  sourceId?: string;
  sourceKind?: string;
}

export type RecommendCtaAction = 'go_report' | 'contact_owner' | 'open_url';

export interface RecommendCtaButton {
  text: string;
  action: RecommendCtaAction;
  href?: string;
}

export interface RecommendSectionCta {
  primary: RecommendCtaButton;
  secondary?: RecommendCtaButton;
}

export type RecommendSlot =
  | {
      kind: 'card_list';
      cards: RecommendCard[];
      adapt?: AdaptMeta;
    }
  | {
      kind: 'combo_group';
      groups: RecommendGroup[];
      adapt?: AdaptMeta;
    }
  | {
      kind: 'fallback_cta';
      cta: RecommendSectionCta;
      adapt?: AdaptMeta;
    };

export interface RecommendSection {
  section_id: RecommendSectionId;
  emoji: string;
  title: string;
  subtitle?: string;
  bg_style: RecommendSectionBgStyle;
  slots: RecommendSlot[];
  cta?: RecommendSectionCta;
}

export const DEFAULT_RECOMMEND_SECTION_1_COPY: Pick<
  RecommendSection,
  'emoji' | 'title' | 'subtitle' | 'bg_style'
> = {
  emoji: '🤖',
  title: '以下画像资产高度匹配，可以直接配置使用',
  subtitle: undefined,
  bg_style: 'plain',
};

export const DEFAULT_RECOMMEND_SECTION_2_COPY: Pick<
  RecommendSection,
  'emoji' | 'title' | 'subtitle' | 'bg_style'
> = {
  emoji: '📌',
  title: '匹配到了与你的需求相似的画像资产',
  subtitle: '将人群与动作组合，获得更高整体增益',
  bg_style: 'accent',
};

export const DEFAULT_RECOMMEND_SECTION_3_COPY: Pick<
  RecommendSection,
  'emoji' | 'title' | 'subtitle' | 'bg_style'
> = {
  emoji: '🧭',
  title: '都不符合你的诉求？',
  subtitle: '可能是资产尚未入驻市集，或诉求过于定制',
  bg_style: 'muted',
};

export interface FeatureBundle {
  crowdSegments: { id: string; name: string; size: number }[];
  features: { id: string; dim: string; value: string; ratio: number }[];
  executableAssets: { id: string; name: string; type: string }[];
}

export interface GapItem {
  id: string;
  title: string;
  impact: string;
  owner: string;
  draft: { title: string; source: string; desc: string; assignee: string };
  type?: 'asset_missing' | 'feature_deprecated' | 'capability_missing';
  suggestedOwner?: string;
  severity?: 'P0' | 'P1' | 'P2';
  status?: RecommendConfidenceStatus;
}

export interface ThinkingStep {
  id: string;
  // Some scripts use title/detail; normalize in store to label/description.
  label?: string;
  title?: string;
  description?: string;
  detail?: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  durationMs?: number;
  // derived by UI from sessionStartMs
  timestampMs?: number;
}

export type Dispatch = (action: any) => void;

export interface ScriptStep {
  phase: Exclude<RecommendPhase, 'idle' | 'done'>;
  thinking: ThinkingEvent[];
  onExit?: (dispatch: Dispatch) => void;
}

export interface RecommendScript {
  id: string;
  name: string;
  defaultDocUrl: string;
  defaultDocTitle: string;
  steps: ScriptStep[];
}

export interface RecommendTicket {
  id: string;
  gapId: string;
  createdAtMs: number;
}

export function stepFromPhase(phase: RecommendPhase): RecommendStep {
  if (phase === 'idle') return 'entry';
  if (phase === 'parse') return 'parsing';
  if (phase === 'recommend') return 'recommending';
  return 'result';
}

export function completedStepsFromPhase(phase: RecommendPhase): RecommendStep[] {
  if (phase === 'idle') return ['entry'];
  if (phase === 'parse') return ['entry', 'parsing'];
  if (phase === 'recommend') return ['entry', 'parsing', 'recommending'];
  return ['entry', 'parsing', 'recommending', 'result'];
}

export function phaseFromStep(step: RecommendStep): RecommendPhase {
  if (step === 'entry') return 'idle';
  if (step === 'parsing') return 'parse';
  if (step === 'recommending') return 'recommend';
  return 'done';
}

export type AgentEvent =
  | { type: 'thinking_step'; payload: ThinkingStep }
  | { type: 'parse_result'; payload: RequirementCard }
  | { type: 'clarify_question'; payload: { questions: string[] } }
  | { type: 'actions_ready'; payload: ActionCard[] }
  | { type: 'bundle_ready'; payload: FeatureBundle }
  | { type: 'gap_items'; payload: GapItem[] }
  | { type: 'done'; payload: { assets: number; actions: number; gaps: number } };
