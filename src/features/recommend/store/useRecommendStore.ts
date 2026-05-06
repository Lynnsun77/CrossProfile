import { create } from 'zustand';
import { DEFAULT_SCRIPT_ID } from '../scripts';
import type {
  ActionCard,
  AgentEvent,
  AssetDrawerState,
  ChainNode,
  DeployConfig,
  FeatureBundle,
  GapItem,
  IntentInput,
  IntentSource,
  RecommendCard,
  RecommendGroup,
  RecommendSection,
  RecommendInput,
  RecommendPhase,
  RecommendStep,
  RecommendSubRole,
  RecommendTicket,
  RecommendView,
  RequirementCard,
  RequirementDraft,
  ThinkingEvent,
  ThinkingStep,
  ThinkingTask,
} from '../types';
import {
  completedStepsFromPhase,
  DEFAULT_RECOMMEND_SECTION_1_COPY,
  DEFAULT_RECOMMEND_SECTION_3_COPY,
  statusFromConfidence,
  stepFromPhase,
} from '../types';

const SUB_ROLE_STORAGE_KEY = 'cp_subrole';

type RecommendDispatchAction =
  | { type: 'thinking'; payload: ThinkingEvent }
  | { type: 'requirement'; payload: RequirementDraft }
  | { type: 'recommends'; payload: { cards: RecommendCard[]; featureBundle?: FeatureBundle | null } }
  | { type: 'gaps'; payload: GapItem[] }
  | { type: 'phase'; payload: RecommendPhase }
  | { type: 'PUSH_THINKING'; payload: ThinkingEvent }
  | { type: 'SET_REQUIREMENT'; payload: RequirementDraft }
  | { type: 'SET_RECOMMENDS'; payload: RecommendCard[] | { cards: RecommendCard[]; featureBundle?: FeatureBundle | null } }
  | { type: 'SET_GAPS'; payload: GapItem[] }
  | { type: 'ENTER_PHASE'; payload: RecommendPhase };

export interface IntentParsed {
  goals: string[];
  scenes: string[];
  features: string[];
}

export interface UnmetDemandEntry {
  intentText: string;
  feedbackText: string;
  createdAt: number;
}

type RecommendState = {
  step: RecommendStep;
  phase: RecommendPhase;
  subRole: RecommendSubRole;
  view: RecommendView;
  input: RecommendInput;
  docUrl?: string;
  docTitle?: string;
  sessionId: string;
  sessionStartMs: number;
  activeScriptId: string;
  completedSteps: RecommendStep[];
  manualGateAfterParse: boolean;

  thinking: ThinkingEvent[];
  thinkingTrace: ThinkingStep[];
  requirement: RequirementDraft | null;
  recommends: RecommendCard[];
  actions: RecommendCard[];
  featureBundle: FeatureBundle | null;
  gaps: GapItem[];
  tickets: RecommendTicket[];
  starred: string[];

  intent: IntentInput;
  thinkingTask: ThinkingTask | null;
  groups: RecommendGroup[];
  // New segmented result view. Keep `groups` for backward compatibility with existing UI.
  sections: RecommendSection[];
  drawer: AssetDrawerState;
  deploy: DeployConfig;
  unmetDemandLog: UnmetDemandEntry[];

  setSubRole: (subRole: RecommendSubRole) => void;
  setView: (view: RecommendView) => void;
  setInputText: (text: string) => void;
  setScenarioId: (scenarioId: string | undefined) => void;
  setGoalId: (goalId: string | undefined) => void;
  setSceneId: (sceneId: RecommendInput['sceneId']) => void;
  setDocUrl: (docUrl: string | undefined) => void;
  setManualGateAfterParse: (enabled: boolean) => void;
  startSession: (url?: string, title?: string, options?: { scriptId?: string; manualGateAfterParse?: boolean }) => void;
  advancePhase: (phase?: RecommendPhase) => void;
  dispatch: (action: RecommendDispatchAction) => void;
  toggleStar: (id: string) => void;
  submitTicket: (gapId: string) => void;

  startParse: (scriptId?: string) => void;
  confirmRecommend: () => void;
  jumpToStep: (target: RecommendStep) => void;
  dispatchAgentEvent: (event: AgentEvent) => void;
  reset: () => void;

  setIntentText: (text: string) => void;
  setIntentSource: (source: IntentSource) => void;
  submitIntent: () => void;
  pushChainNode: (node: ChainNode) => void;
  completeThinking: () => void;
  failThinking: (reason?: string) => void;
  timeoutThinking: () => void;
  setGroups: (groups: RecommendGroup[]) => void;
  openDrawer: (cardId: string) => void;
  closeDrawer: () => void;
  openDeploy: (cardId: string) => void;
  closeDeploy: () => void;
  setDeployField: <K extends keyof DeployConfig>(key: K, value: DeployConfig[K]) => void;
  submitDeploy: () => void;
  resetRecommend: () => void;
  appendUnmetDemand: (feedbackText: string) => void;
  captureInvalidQuery: () => void;
};

function randomSessionId() {
  return `sess_${Math.random().toString(16).slice(2, 10)}`;
}

function readInitialSubRole(): RecommendSubRole {
  try {
    if (typeof window === 'undefined') return 'business';
    const raw = window.localStorage.getItem(SUB_ROLE_STORAGE_KEY);
    if (raw === 'business' || raw === 'algorithm') return raw;
  } catch {
    // ignore storage errors
  }
  return 'business';
}

function persistSubRole(subRole: RecommendSubRole) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SUB_ROLE_STORAGE_KEY, subRole);
  } catch {
    // ignore storage errors
  }
}

function extractLarkDocUrl(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s]*larkoffice\.com\/(wiki|docx|docs)\/[^\s]+/i);
  return m?.[0];
}

const FEISHU_DOC_REGEX = /(bytedance\.larkoffice\.com\/wiki|feishu\.cn|larksuite\.com)/i;
const INTENT_TRUNCATE_LIMIT = 2000;

function detectHasFeishuDoc(text: string): boolean {
  return FEISHU_DOC_REGEX.test(text);
}

function detectTruncated(text: string): boolean {
  return text.length > INTENT_TRUNCATE_LIMIT;
}

const FALLBACK_GROUP: RecommendGroup = {
  id: 'fallback',
  kind: 'fallback',
  title: '都不符合你的诉求？',
  cards: [],
};

function ensureFallbackGroup(groups: RecommendGroup[]): RecommendGroup[] {
  const hasFallback = groups.some((group) => group.kind === 'fallback');
  if (hasFallback) return groups;
  return [...groups, { ...FALLBACK_GROUP }];
}

function buildNoMatchCtaUrl(params: { goal: string; scene: string; query: string; source: string }): string {
  const search = new URLSearchParams();
  search.set('goal', params.goal);
  search.set('scene', params.scene);
  search.set('query', params.query);
  search.set('source', params.source);
  return `/asset/report?${search.toString()}`;
}

function normalizeHealthStatus(card: RecommendCard): NonNullable<RecommendCard['healthStatus']> {
  return (card.healthStatus ?? 'healthy') as NonNullable<RecommendCard['healthStatus']>;
}

function isHealthyOrWarning(card: RecommendCard): boolean {
  const hs = normalizeHealthStatus(card);
  return hs === 'healthy' || hs === 'warning';
}

function isHealthy(card: RecommendCard): boolean {
  return normalizeHealthStatus(card) === 'healthy';
}

function getConfidence(card: RecommendCard): number {
  return typeof card.confidence === 'number' ? card.confidence : 0;
}

function extractQueryKeywordHit(query: string): string[] {
  const hits: string[] = [];
  const candidates = ['特征', '人群', '标签'];
  candidates.forEach((kw) => {
    if (query.includes(kw)) hits.push(kw);
  });
  return hits;
}

function formatRecommendReason(params: {
  goal: string;
  scene: string;
  goalMatch: number;
  goalProof: string;
  sceneMatch: number;
  sceneEvidence: string;
  keywordHit: string[];
}): string {
  const goal = params.goal || '业务目标';
  const scene = params.scene || '策略场景';
  const parts: string[] = [];
  if (params.goalMatch) parts.push(`目标匹配 ${params.goalMatch}%（${params.goalProof || `历史 AB ${goal} ↑—`}）`);
  if (params.sceneMatch) parts.push(`场景匹配 ${params.sceneMatch}%（${params.sceneEvidence || `近 90 天${scene}链路命中 — 次`}）`);
  if (params.keywordHit.length > 0) parts.push(`与你查询的 “${params.keywordHit.join(' / ')}” 强相关`);
  return `同为【${goal}】目标下【${scene}】场景，${parts.filter(Boolean).join('・')}`;
}

function withTemplatedReason(card: RecommendCard, ctx: { goal: string; scene: string; query: string }, index: number): RecommendCard {
  const descFallback = (card.desc ?? card.summary ?? '').trim();
  const existing = (card.reason ?? '').trim();
  // If reason is empty or equals desc/summary, replace with templated reason.
  const shouldReplace = !existing || (descFallback && existing === descFallback);
  if (!shouldReplace) return card;

  const confidencePct = Math.round(getConfidence(card) * 100);
  const goalMatch = Math.max(60, Math.min(96, confidencePct));
  const sceneMatch = Math.max(55, Math.min(95, confidencePct - 4 - index));
  const keywordHit = extractQueryKeywordHit(ctx.query).slice(0, 2);
  const goalProof = card.kpi ? `历史 AB ${card.kpi}` : `历史 AB ${ctx.goal || '指标'} ↑—`;
  const sceneEvidence = `近 90 天${ctx.scene || '相关'}链路命中 ${Math.max(1, 5 - index)} 次`;

  return {
    ...card,
    recommend_reason: {
      biz_goal_echo: ctx.goal,
      scene_echo: ctx.scene,
      goal_match_score: goalMatch,
      goal_metric_proof: goalProof,
      scene_match_score: sceneMatch,
      scene_evidence: sceneEvidence,
      query_keyword_hit: keywordHit,
    },
    reason: formatRecommendReason({
      goal: ctx.goal,
      scene: ctx.scene,
      goalMatch,
      goalProof,
      sceneMatch,
      sceneEvidence,
      keywordHit,
    }),
  };
}

function uniqueCardsFromGroups(groups: RecommendGroup[]): RecommendCard[] {
  const map = new Map<string, RecommendCard>();
  groups.forEach((g) => {
    if (g.kind === 'fallback') return;
    (g.cards ?? []).forEach((c) => {
      if (!c?.id) return;
      if (!map.has(c.id)) map.set(c.id, c);
    });
  });
  return Array.from(map.values());
}

function deriveSectionsFromGroups(
  groups: RecommendGroup[],
  ctx: { input: RecommendInput; intent: IntentInput },
): RecommendSection[] {
  const aiGroup = groups.find((g) => g.kind === 'ai') ?? null;
  const cohortGroups = groups.filter((g) => g.kind === 'cohort');

  const uniqueCards = uniqueCardsFromGroups(groups);
  const totalUnique = uniqueCards.length;

  // goal/scene/query: prefer input.goalId/input.sceneId; fallback to intent/input text; else empty string.
  const goal = ctx.input.goalId ?? '';
  const scene = (ctx.input.sceneId ?? '') as string;
  const query = ctx.intent.text || ctx.input.text || '';
  const reasonCtx = { goal, scene, query };
  const fallbackHref = buildNoMatchCtaUrl({
    goal,
    scene,
    query,
    source: 'no_match_section_1_2',
  });

  const baseFallback: RecommendSection = {
    section_id: 'paragraph_3',
    ...DEFAULT_RECOMMEND_SECTION_3_COPY,
    slots: [
      {
        kind: 'fallback_cta',
        cta: {
          primary: { text: '去提需更多画像标签建设', action: 'open_url', href: fallbackHref },
          secondary: { text: '联系资产 Owner', action: 'contact_owner' },
        },
        adapt: { type: 'fallback', sourceKind: 'no_match', sourceId: 'no_match_section_1_2' },
      },
    ],
  };

  // If there is only 1 result overall, always treat it as ready (even if confidence < 0.8).
  if (totalUnique === 1) {
    const only = uniqueCards[0];
    const decorated = withTemplatedReason(only, reasonCtx, 0);
    const readySection: RecommendSection = {
      section_id: 'paragraph_1',
      ...DEFAULT_RECOMMEND_SECTION_1_COPY,
      slots: [
        {
          kind: 'card_list',
          cards: [decorated],
          adapt: { type: 'recommend_cards', sourceKind: 'singleton', sourceId: decorated.id },
        },
      ],
    };
    return [readySection, baseFallback];
  }

  const usedCardIds = new Set<string>();

  const isReadyCandidate = (c: RecommendCard) => getConfidence(c) >= 0.8 && isHealthy(c);
  const isAdaptableCandidate = (c: RecommendCard) => getConfidence(c) >= 0.6 && getConfidence(c) < 0.8 && isHealthyOrWarning(c);

  // Paragraph 1 (ready): confidence>=0.8 && healthStatus==='healthy'
  const aiCards = aiGroup?.cards ?? [];
  const readyAiStrict = aiCards.filter(isReadyCandidate);
  const readyAiRelaxedPool = aiCards
    .filter((c) => isHealthy(c) && !readyAiStrict.some((x) => x.id === c.id))
    .sort((a, b) => getConfidence(b) - getConfidence(a));

  // Ensure paragraph_1 tries to output 2 single cards when possible.
  const readyAi =
    readyAiStrict.length > 0
      ? [...readyAiStrict, ...readyAiRelaxedPool].slice(0, 2)
      : readyAiStrict.slice(0, 2);
  const readyAiDecorated = readyAi.map((c, idx) => withTemplatedReason(c, reasonCtx, idx));
  readyAiDecorated.forEach((c) => usedCardIds.add(c.id));

  const eligibleCohorts = cohortGroups.filter((g) => {
    const cards = g.cards ?? [];
    if (cards.length === 0) return false;
    return cards.every(isReadyCandidate);
  });

  // Keep combo max 1; if there is no cohort group available, try to construct a mock combo from ready candidates.
  const readyCohortGroup = eligibleCohorts.length > 0 ? eligibleCohorts[0] : null;
  const readyPoolForMock = uniqueCards
    .filter(isReadyCandidate)
    .sort((a, b) => getConfidence(b) - getConfidence(a));
  const readyMockComboGroup: RecommendGroup | null =
    !readyCohortGroup && readyPoolForMock.length >= 2
      ? {
          id: 'cohort-ready-mock',
          kind: 'cohort',
          title: '组合（可直接复用）',
          comboTitle: `${readyPoolForMock[0].title} × ${readyPoolForMock[1].title}`,
          combinedLift: 0.18,
          cards: readyPoolForMock.slice(0, 2).map((c, idx) => withTemplatedReason(c, reasonCtx, idx)),
        }
      : null;
  const readyComboGroup = readyCohortGroup
    ? {
        ...readyCohortGroup,
        cards: (readyCohortGroup.cards ?? []).map((c, idx) => withTemplatedReason(c, reasonCtx, idx)),
      }
    : readyMockComboGroup;
  if (readyComboGroup) {
    (readyComboGroup.cards ?? []).forEach((c) => usedCardIds.add(c.id));
  }

  const hasReady = readyAi.length > 0 || Boolean(readyComboGroup);
  const readySection: RecommendSection | null = hasReady
    ? {
        section_id: 'paragraph_1',
        ...DEFAULT_RECOMMEND_SECTION_1_COPY,
        slots: [
          ...(readyAi.length > 0
            ? [
                {
                  kind: 'card_list' as const,
                  cards: readyAiDecorated,
                  adapt: { type: 'recommend_cards' as const, sourceKind: 'ready_ai', sourceId: 'ai' },
                },
              ]
            : []),
          ...(readyComboGroup
            ? [
                {
                  kind: 'combo_group' as const,
                  groups: [readyComboGroup],
                  adapt: {
                    type: 'recommend_group' as const,
                    sourceKind: readyCohortGroup ? 'ready_cohort' : 'ready_mock',
                    sourceId: readyComboGroup.id,
                  },
                },
              ]
            : []),
        ],
      }
    : null;

  // Paragraph 2 (adaptable): from remaining cards: 0.6<=confidence<0.8 && healthStatus in healthy|warning
  const remaining = uniqueCards.filter((c) => !usedCardIds.has(c.id));
  const adaptablePool = remaining
    .filter(isAdaptableCandidate)
    .sort((a, b) => getConfidence(b) - getConfidence(a));

  const adaptableSingles = adaptablePool.slice(0, 2);
  const adaptableSinglesDecorated = adaptableSingles.map((c, idx) => withTemplatedReason(c, reasonCtx, idx + 2));
  const adaptableSingleIds = new Set(adaptableSingles.map((c) => c.id));

  // Prefer an existing cohort group as the "similar combo" if it matches adaptable criteria.
  const cohortCandidates = cohortGroups.filter((g) => g.id !== readyComboGroup?.id);
  const isAdaptableCohort = (g: RecommendGroup) => {
    const cards = g.cards ?? [];
    if (cards.length < 2) return false;
    return cards.every(isAdaptableCandidate);
  };
  // Prefer cohorts that bring new cards (not used in paragraph_1).
  const adaptableCohort =
    cohortCandidates.find((g) => isAdaptableCohort(g) && (g.cards ?? []).some((c) => !usedCardIds.has(c.id))) ??
    cohortCandidates.find(isAdaptableCohort) ??
    null;

  const comboPoolPrimary = adaptablePool.filter((c) => !adaptableSingleIds.has(c.id));
  const comboPick = (comboPoolPrimary.length >= 2 ? comboPoolPrimary : adaptablePool).slice(0, 2);
  const mockComboGroup: RecommendGroup | null =
    !adaptableCohort && comboPick.length >= 2
      ? {
          id: 'cohort-adaptable-mock',
          kind: 'cohort',
          title: '相似组合（可调整）',
          comboTitle: `${comboPick[0].title} × ${comboPick[1].title}`,
          combinedLift: 0.12,
          cards: comboPick.map((c, idx) => withTemplatedReason(c, reasonCtx, idx + 4)),
        }
      : null;

  const adaptableComboGroup = adaptableCohort
    ? {
        ...adaptableCohort,
        cards: (adaptableCohort.cards ?? []).map((c, idx) => withTemplatedReason(c, reasonCtx, idx + 4)),
      }
    : mockComboGroup;
  const hasAdaptable = adaptableSingles.length > 0 || Boolean(adaptableComboGroup);
  const adaptableSection: RecommendSection | null = hasAdaptable
    ? {
        section_id: 'paragraph_2',
        emoji: '📌',
        title: '匹配到了与你的需求相似的画像资产',
        subtitle: '从相似场景中挑选的候选资产，可结合目标做调整',
        bg_style: 'accent',
        slots: [
          ...(adaptableSingles.length > 0
            ? [
                {
                  kind: 'card_list' as const,
                  cards: adaptableSinglesDecorated,
                  adapt: { type: 'recommend_cards' as const, sourceKind: 'similarity_pool', sourceId: adaptableSingles[0]?.id },
                },
              ]
            : []),
          ...(adaptableComboGroup
            ? [
                {
                  kind: 'combo_group' as const,
                  groups: [adaptableComboGroup],
                  adapt: {
                    type: 'recommend_group' as const,
                    sourceKind: adaptableCohort ? 'cohort_reuse' : 'mock',
                    sourceId: adaptableComboGroup.id,
                  },
                },
              ]
            : []),
        ],
      }
    : null;

  // Fallback subtitle upgrade if both paragraph 1/2 are empty.
  const fallbackSection: RecommendSection =
    readySection || adaptableSection
      ? baseFallback
      : {
          ...baseFallback,
          subtitle: '暂未命中画像资产，帮我们补充标签建设',
        };

  const sections: RecommendSection[] = [];
  if (readySection) sections.push(readySection);
  if (adaptableSection) sections.push(adaptableSection);
  sections.push(fallbackSection);
  return sections;
}

const INITIAL_INTENT: IntentInput = {
  text: '',
  source: 'manual',
  submittedAt: null,
  hasFeishuDoc: false,
  truncated: false,
};

const INITIAL_DRAWER: AssetDrawerState = { open: false, cardId: null };

const INITIAL_DEPLOY: DeployConfig = {
  open: false,
  cardId: null,
  downstream: null,
  libraUrl: '',
  status: 'draft',
  error: null,
};

const INITIAL_GROUPS: RecommendGroup[] = [{ ...FALLBACK_GROUP }];
const INITIAL_SECTIONS: RecommendSection[] = deriveSectionsFromGroups(INITIAL_GROUPS, { input: {}, intent: INITIAL_INTENT });

function resolveView(subRole: RecommendSubRole) {
  return subRole === 'algorithm' ? 'B' : 'A';
}

function nextPhase(current: RecommendPhase): RecommendPhase {
  if (current === 'parse') return 'recommend';
  if (current === 'recommend') return 'gap';
  if (current === 'gap') return 'done';
  return current;
}

function rank(step: RecommendStep) {
  if (step === 'entry') return 0;
  if (step === 'parsing') return 1;
  if (step === 'recommending') return 2;
  return 3;
}

function toThinkingStep(event: ThinkingEvent): ThinkingStep {
  return {
    id: event.id ?? `${event.phase}-${event.node}-${event.t}`,
    label: event.node,
    description: event.text,
    status: event.status === 'ok' ? 'done' : event.status === 'warn' ? 'failed' : event.status ?? 'done',
    timestampMs: event.t,
  };
}

function normalizeRequirementDraft(item: RequirementDraft | RequirementCard, docUrl?: string, docTitle?: string): RequirementDraft {
  const draft = item as Partial<RequirementDraft> & RequirementCard;
  const scopes = draft.scopes ?? [
    { key: 'self', label: '当前商家跃迁人群', checked: draft.miningScope?.selfHistory ?? false },
    { key: 'bench', label: '标杆商家', checked: draft.miningScope?.benchmark ?? false },
    { key: 'cross', label: '跨行业相似', checked: draft.miningScope?.crossIndustry ?? false },
  ];
  const actions = draft.actions ?? [
    { key: 'product', label: '商品优化', checked: draft.actionTypes?.product ?? false },
    { key: 'campaign', label: '营销活动', checked: draft.actionTypes?.marketing ?? false },
    { key: 'content', label: '内容优化', checked: draft.actionTypes?.content ?? false },
    { key: 'acquire', label: '人群拉新', checked: draft.actionTypes?.acquisition ?? false },
  ];
  const features = draft.features ?? [
    { key: 'power', label: '消费力', checked: draft.featureDims?.consumeLevel ?? false },
    { key: 'scene', label: '消费场景', checked: draft.featureDims?.scene ?? false },
    { key: 'interest', label: '兴趣关键词', checked: draft.featureDims?.keyword ?? false },
    { key: 'freq', label: '频次', checked: draft.featureDims?.frequency ?? false },
  ];
  const problemCrowds = draft.problemCrowds ?? (draft.problems ?? []).map((problem, index) => ({
    key: problem.id,
    label: `${problem.segment}：${problem.description}`,
    priority: index + 1,
  }));

  return {
    ...draft,
    merchantId: draft.merchantId ?? draft.merchant?.id ?? '',
    merchantName: draft.merchantName ?? draft.merchant?.name ?? '',
    merchant: draft.merchant ?? { id: draft.merchantId ?? '', name: draft.merchantName ?? '' },
    problemCrowds,
    problems:
      draft.problems ??
      problemCrowds.map((crowd: { key: string; label: string; priority: number }) => ({
        id: crowd.key,
        segment: crowd.label.split('：')[0] ?? crowd.label,
        description: crowd.label.split('：').slice(1).join('：') || crowd.label,
        priority: crowd.priority === 1 ? 'high' : crowd.priority === 2 ? 'medium' : 'low',
      })),
    scopes,
    miningScope: draft.miningScope ?? {
      selfHistory: scopes.find((scope: { key: string; checked: boolean }) => scope.key === 'self')?.checked ?? false,
      benchmark: scopes.find((scope: { key: string; checked: boolean }) => scope.key === 'bench')?.checked ?? false,
      crossIndustry: scopes.find((scope: { key: string; checked: boolean }) => scope.key === 'cross')?.checked ?? false,
    },
    actions,
    actionTypes: draft.actionTypes ?? {
      product: actions.find((action: { key: string; checked: boolean }) => action.key === 'product')?.checked ?? false,
      marketing: actions.find((action: { key: string; checked: boolean }) => action.key === 'campaign')?.checked ?? false,
      content: actions.find((action: { key: string; checked: boolean }) => action.key === 'content')?.checked ?? false,
      acquisition: actions.find((action: { key: string; checked: boolean }) => action.key === 'acquire')?.checked ?? false,
    },
    features,
    featureDims: draft.featureDims ?? {
      consumeLevel: features.find((feature: { key: string; checked: boolean }) => feature.key === 'power')?.checked ?? false,
      scene: features.find((feature: { key: string; checked: boolean }) => feature.key === 'scene')?.checked ?? false,
      keyword: features.find((feature: { key: string; checked: boolean }) => feature.key === 'interest')?.checked ?? false,
      frequency: features.find((feature: { key: string; checked: boolean }) => feature.key === 'freq')?.checked ?? false,
    },
    docUrl: draft.docUrl ?? docUrl,
    docTitle: draft.docTitle ?? docTitle,
  };
}

function normalizeRecommendCards(cards: Array<RecommendCard | ActionCard>): RecommendCard[] {
  return cards.map((item) => {
    const card = item as Partial<RecommendCard> & ActionCard;
    return ({
    ...item,
    status: card.status ?? statusFromConfidence(card.confidence),
    crowd: card.crowd ?? card.problemId ?? '',
    action: card.action ?? (card.actionType === 'marketing' ? 'campaign' : card.actionType === 'acquisition' ? 'acquire' : 'product'),
    desc: card.desc ?? card.summary ?? card.detail,
    refs: card.refs ?? (card.referencedAssets ?? card.assetRefs ?? []).map((asset) => asset.name),
    kpi:
      card.kpi ??
      (card.expectedKpi ? `${card.expectedKpi.metric} ↑ ${Math.round(card.expectedKpi.lift * 100)}%` : ''),
    tag: card.tag ?? (card.confidence >= 0.8 ? '🟢' : '🟡'),
    referencedAssets: card.referencedAssets ?? card.assetRefs ?? [],
    assetRefs: card.assetRefs ?? card.referencedAssets,
    summary: card.summary ?? card.desc ?? card.detail,
    detail: card.detail ?? card.desc ?? '',
    actionType:
      card.actionType ?? (card.action === 'campaign' ? 'marketing' : card.action === 'acquire' ? 'acquisition' : 'product'),
    expectedKpi: card.expectedKpi ?? { metric: card.kpi || '指标', lift: card.confidence },
    reasoning: card.reasoning ?? card.desc ?? card.summary ?? card.detail ?? '',
  }) as RecommendCard;
  });
}

function normalizeGaps(items: GapItem[]): GapItem[] {
  return items.map((item) => ({
    ...item,
    owner: item.owner ?? item.suggestedOwner ?? '',
    suggestedOwner: item.suggestedOwner ?? item.owner ?? '',
    severity: item.severity ?? 'P1',
    draft:
      item.draft ??
      {
        title: `【${item.title}】`,
        source: '智能推荐 · 飞书文档推荐链路',
        desc: item.impact,
        assignee: item.owner ?? item.suggestedOwner ?? '',
      },
    status: item.status ?? ((item.severity ?? 'P1') === 'P0' ? 'needReview' : (item.severity ?? 'P1') === 'P1' ? 'accepted' : 'recommended'),
  }));
}

function deriveGroupsFromRecommends(cards: RecommendCard[], existing: RecommendGroup[]): RecommendGroup[] {
  if (cards.length === 0) return ensureFallbackGroup(existing);
  const aiCards: RecommendCard[] = cards.map((card, index) => ({
    ...card,
    sortKeys:
      card.sortKeys ?? {
        relevance: Math.max(0.2, card.confidence ?? 0.6) - index * 0.01,
        revenue: (card.expectedKpi?.lift ?? 0.1) * 100 - index * 0.5,
        audienceSize: 100 - index * 10,
      },
    healthStatus: card.healthStatus ?? 'healthy',
    typeTags: card.typeTags ?? ['BTM+'],
    sceneTags: card.sceneTags ?? ['电商', '热门'],
    audienceSize: card.audienceSize ?? Math.max(20, 100 - index * 20),
    reason: card.reason ?? (card.desc ?? '').slice(0, 30),
  }));
  const aiGroup: RecommendGroup = {
    id: 'ai',
    kind: 'ai',
    title: '推荐组 1 · AI 推荐',
    cards: aiCards,
  };
  const cohortGroup: RecommendGroup | null =
    aiCards.length >= 2
      ? {
          id: 'cohort-mock',
          kind: 'cohort',
          title: '推荐组 2 · 人群组（组合推荐）',
          comboTitle: `${aiCards[0].title} × ${aiCards[1].title}`,
          combinedLift: 0.18,
          cards: aiCards.slice(0, 2),
        }
      : null;
  const bridged = cohortGroup ? [aiGroup, cohortGroup] : [aiGroup];
  return ensureFallbackGroup(bridged);
}

function deriveFeatureBundle(cards: RecommendCard[]): FeatureBundle {
  const assetMap = new Map<string, RecommendCard['referencedAssets'][number]>();
  cards.forEach((card) => {
    (card.referencedAssets ?? card.assetRefs ?? []).forEach((asset) => {
      assetMap.set(asset.id, asset);
    });
  });

  return {
    crowdSegments: [],
    features: [],
    executableAssets: Array.from(assetMap.values()),
  };
}

function applyPhase(phase: RecommendPhase) {
  return {
    phase,
    step: stepFromPhase(phase),
    completedSteps: completedStepsFromPhase(phase),
  };
}

const INTENT_GOAL_KEYWORDS: Array<{ key: string; aliases: string[] }> = [
  { key: '留存', aliases: ['留存'] },
  { key: '复购', aliases: ['复购'] },
  { key: '流失', aliases: ['流失'] },
  { key: '召回', aliases: ['召回'] },
  { key: '新客', aliases: ['新客'] },
  { key: 'GMV', aliases: ['gmv', 'GMV'] },
  { key: 'MAC', aliases: ['mac', 'MAC'] },
  { key: '增长', aliases: ['增长'] },
];

const INTENT_SCENE_KEYWORDS: Array<{ key: string; aliases: string[] }> = [
  { key: '生服用增', aliases: ['生服用增'] },
  { key: '生服营销', aliases: ['生服营销'] },
  { key: '生服KA', aliases: ['生服ka', '生服KA'] },
  { key: '电商用增', aliases: ['电商用增'] },
  { key: '电商营销', aliases: ['电商营销'] },
  { key: '电商商城', aliases: ['电商商城'] },
  { key: '大促', aliases: ['大促'] },
  { key: '母婴', aliases: ['母婴'] },
  { key: '会员', aliases: ['会员'] },
];

const INTENT_FEATURE_KEYWORDS: Array<{ key: string; aliases: string[] }> = [
  { key: '高消费', aliases: ['高消费'] },
  { key: '妈妈人群', aliases: ['妈妈人群', '妈妈'] },
  { key: '母婴', aliases: ['母婴'] },
  { key: '价格敏感', aliases: ['价格敏感'] },
  { key: '流失高风险', aliases: ['流失高风险', '高流失'] },
  { key: '新客', aliases: ['新客'] },
  { key: '高活跃', aliases: ['高活跃'] },
  { key: 'Top 20%', aliases: ['top 20%', 'Top 20%', 'top20%'] },
];

function matchKeywords(
  haystackLower: string,
  dict: Array<{ key: string; aliases: string[] }>,
): string[] {
  const found: string[] = [];
  dict.forEach(({ key, aliases }) => {
    if (aliases.some((alias) => haystackLower.includes(alias.toLowerCase()))) {
      if (!found.includes(key)) found.push(key);
    }
  });
  return found;
}

export function getIntentParsed(state: Pick<RecommendState, 'intent' | 'input'>): IntentParsed {
  const text = state.intent?.text ?? '';
  const sceneId = state.input?.sceneId ?? '';
  const goalId = state.input?.goalId ?? '';
  const haystack = `${text} ${sceneId} ${goalId}`.toLowerCase();
  return {
    goals: matchKeywords(haystack, INTENT_GOAL_KEYWORDS),
    scenes: matchKeywords(haystack, INTENT_SCENE_KEYWORDS),
    features: matchKeywords(haystack, INTENT_FEATURE_KEYWORDS),
  };
}

export const useRecommendStore = create<RecommendState>((set, get) => ({
  ...applyPhase('idle'),
  subRole: readInitialSubRole(),
  view: resolveView(readInitialSubRole()),
  input: {},
  docUrl: undefined,
  docTitle: undefined,
  sessionId: randomSessionId(),
  sessionStartMs: Date.now(),
  activeScriptId: DEFAULT_SCRIPT_ID,
  manualGateAfterParse: false,

  thinking: [],
  thinkingTrace: [],
  requirement: null,
  recommends: [],
  actions: [],
  featureBundle: null,
  gaps: [],
  tickets: [],
  starred: [],

  intent: { ...INITIAL_INTENT },
  thinkingTask: null,
  groups: INITIAL_GROUPS.map((group) => ({ ...group })),
  sections: INITIAL_SECTIONS.map((section) => ({ ...section })),
  drawer: { ...INITIAL_DRAWER },
  deploy: { ...INITIAL_DEPLOY },
  unmetDemandLog: [],

  setSubRole: (subRole) => {
    persistSubRole(subRole);
    set(() => ({
      subRole,
      view: resolveView(subRole),
    }));
  },
  setView: (view) => set(() => ({ view })),
  setInputText: (text) =>
    set((s) => {
      const docUrl = extractLarkDocUrl(text) ?? s.docUrl;
      if (s.input.text === text && s.docUrl === docUrl) {
        return s;
      }
      return {
        input: { ...s.input, text, docUrl },
        docUrl,
      };
    }),
  setScenarioId: (scenarioId) => set((s) => ({ input: { ...s.input, scenarioId } })),
  setGoalId: (goalId) => set((s) => ({ input: { ...s.input, goalId } })),
  setSceneId: (sceneId) => set((s) => ({ input: { ...s.input, sceneId } })),
  setDocUrl: (docUrl) =>
    set((s) => ({
      docUrl,
      input: { ...s.input, docUrl },
    })),
  setManualGateAfterParse: (manualGateAfterParse) => set(() => ({ manualGateAfterParse })),
  startSession: (url, title, options) =>
    set((s) => {
      const nextDocUrl = url ?? extractLarkDocUrl(s.input.text ?? '') ?? s.docUrl;
      const nextDocTitle = title ?? s.docTitle;
      return {
        ...applyPhase('parse'),
        sessionId: randomSessionId(),
        sessionStartMs: Date.now(),
        activeScriptId: options?.scriptId ?? s.activeScriptId ?? DEFAULT_SCRIPT_ID,
        manualGateAfterParse: options?.manualGateAfterParse ?? s.manualGateAfterParse,
        docUrl: nextDocUrl,
        docTitle: nextDocTitle,
        input: { ...s.input, docUrl: nextDocUrl },
        thinking: [],
        thinkingTrace: [],
        requirement: null,
        recommends: [],
        actions: [],
        featureBundle: null,
        gaps: [],
        tickets: [],
        starred: [],
      };
    }),
  advancePhase: (phase) =>
    set((s) => {
      const target = phase ?? nextPhase(s.phase);
      if (target === s.phase) return {};
      return applyPhase(target);
    }),
  dispatch: (action) =>
    set((s) => {
      if (action.type === 'thinking' || action.type === 'PUSH_THINKING') {
        const nextPayload = {
          ...action.payload,
          id: action.payload.id ?? `${action.payload.phase}-${action.payload.node}-${action.payload.t}`,
        };
        const existingIdx = s.thinking.findIndex((item) => item.id === nextPayload.id);
        const thinking =
          existingIdx >= 0
            ? s.thinking.map((item, index) => (index === existingIdx ? nextPayload : item))
            : [...s.thinking, nextPayload];
        const thinkingTrace =
          existingIdx >= 0
            ? s.thinkingTrace.map((item, index) => (index === existingIdx ? toThinkingStep(nextPayload) : item))
            : [...s.thinkingTrace, toThinkingStep(nextPayload)];
        return { thinking, thinkingTrace };
      }

      if (action.type === 'requirement' || action.type === 'SET_REQUIREMENT') {
        return {
          requirement: {
            ...normalizeRequirementDraft(action.payload, s.docUrl, s.docTitle),
            status: action.payload.status ?? statusFromConfidence(action.payload.confidence),
          },
        };
      }

      if (action.type === 'recommends' || action.type === 'SET_RECOMMENDS') {
        const recommendPayload = Array.isArray(action.payload) ? { cards: action.payload } : action.payload;
        const recommends = normalizeRecommendCards(recommendPayload.cards);
        const nextGroups = deriveGroupsFromRecommends(recommends, s.groups);
        return {
          recommends,
          actions: recommends,
          featureBundle: recommendPayload.featureBundle ?? deriveFeatureBundle(recommends),
          groups: nextGroups,
          sections: deriveSectionsFromGroups(nextGroups, { input: s.input, intent: s.intent }),
        };
      }

      if (action.type === 'gaps') {
        return {
          gaps: normalizeGaps(action.payload),
        };
      }

      if (action.type === 'SET_GAPS') {
        return {
          ...applyPhase('done'),
          gaps: normalizeGaps(action.payload),
        };
      }

      if (action.type === 'phase' || action.type === 'ENTER_PHASE') {
        return applyPhase(action.payload);
      }

      return {};
    }),
  toggleStar: (id) =>
    set((s) => ({
      starred: s.starred.includes(id) ? s.starred.filter((item) => item !== id) : [...s.starred, id],
    })),
  submitTicket: (gapId) =>
    set((s) => ({
      tickets: [
        ...s.tickets,
        {
          id: `ticket_${Math.random().toString(16).slice(2, 10)}`,
          gapId,
          createdAtMs: Date.now(),
        },
      ],
    })),

  startParse: (scriptId) => {
    const state = get();
    state.startSession(state.docUrl, state.docTitle, { scriptId });
  },
  confirmRecommend: () => {
    const state = get();
    if (state.phase === 'parse') {
      state.advancePhase('recommend');
    }
  },
  jumpToStep: (target) =>
    set((s) => {
      const canJump = s.completedSteps.includes(target) && rank(target) <= rank(s.step);
      if (!canJump) return {};
      if (target === 'entry') return applyPhase('idle');
      if (target === 'parsing') return applyPhase('parse');
      if (target === 'recommending') return applyPhase('recommend');
      return applyPhase('done');
    }),
  dispatchAgentEvent: (event) =>
    set((s) => {
      if (event.type === 'thinking_step') {
        const action: RecommendDispatchAction = {
          type: 'thinking',
          payload: {
            id: event.payload.id,
            t: event.payload.timestampMs ?? Date.now() - s.sessionStartMs,
            phase: s.phase === 'idle' ? 'parse' : s.phase === 'done' ? 'gap' : s.phase,
            node: event.payload.label ?? event.payload.title ?? event.payload.id,
            text: event.payload.description ?? event.payload.detail ?? '',
            status: event.payload.status,
          },
        };
        const next = get().dispatch(action);
        return next as unknown as Partial<RecommendState>;
      }

      if (event.type === 'parse_result') {
        return {
          requirement: {
            ...normalizeRequirementDraft(event.payload, s.docUrl, s.docTitle),
            status: event.payload.status ?? statusFromConfidence(event.payload.confidence),
          },
        };
      }

      if (event.type === 'actions_ready') {
        const recommends = normalizeRecommendCards(event.payload);
        const nextGroups = deriveGroupsFromRecommends(recommends, s.groups);
        return {
          recommends,
          actions: recommends,
          featureBundle: s.featureBundle ?? deriveFeatureBundle(recommends),
          groups: nextGroups,
          sections: deriveSectionsFromGroups(nextGroups, { input: s.input, intent: s.intent }),
        };
      }

      if (event.type === 'bundle_ready') {
        return { featureBundle: event.payload };
      }

      if (event.type === 'gap_items') {
        return { gaps: normalizeGaps(event.payload) };
      }

      if (event.type === 'done') {
        return applyPhase('done');
      }

      return {};
    }),
  reset: () =>
    set((s) => ({
      ...applyPhase('idle'),
      view: resolveView(s.subRole),
      docUrl: undefined,
      docTitle: undefined,
      sessionId: randomSessionId(),
      sessionStartMs: Date.now(),
      activeScriptId: DEFAULT_SCRIPT_ID,
      manualGateAfterParse: false,
      thinking: [],
      thinkingTrace: [],
      requirement: null,
      recommends: [],
      actions: [],
      featureBundle: null,
      gaps: [],
      tickets: [],
      starred: [],
      intent: { ...INITIAL_INTENT },
      thinkingTask: null,
      groups: INITIAL_GROUPS.map((group) => ({ ...group })),
      sections: deriveSectionsFromGroups(INITIAL_GROUPS, { input: s.input, intent: INITIAL_INTENT }),
      drawer: { ...INITIAL_DRAWER },
      deploy: { ...INITIAL_DEPLOY },
      unmetDemandLog: [],
    })),

  setIntentText: (text) =>
    set((s) => ({
      intent: {
        ...s.intent,
        text,
        hasFeishuDoc: detectHasFeishuDoc(text),
        truncated: detectTruncated(text),
      },
    })),
  setIntentSource: (source) =>
    set((s) => ({
      intent: { ...s.intent, source },
    })),
  submitIntent: () =>
    set((s) => {
      const submittedAt = Date.now();
      const taskId = `T-${submittedAt}`;
      const task: ThinkingTask = {
        taskId,
        startedAt: submittedAt,
        durationMs: null,
        status: 'pending',
        nodes: [],
      };
      return {
        intent: { ...s.intent, submittedAt },
        thinkingTask: task,
      };
    }),
  pushChainNode: (node) =>
    set((s) => {
      if (!s.thinkingTask) return {};
      const existingIdx = s.thinkingTask.nodes.findIndex((item) => item.id === node.id);
      let nextNodes: ChainNode[];
      if (existingIdx >= 0) {
        nextNodes = s.thinkingTask.nodes.map((item, index) =>
          index === existingIdx ? { ...item, status: node.status } : item,
        );
      } else {
        nextNodes = [...s.thinkingTask.nodes, node].sort((a, b) => a.order - b.order);
      }
      return {
        thinkingTask: {
          ...s.thinkingTask,
          status: s.thinkingTask.status === 'pending' ? 'running' : s.thinkingTask.status,
          nodes: nextNodes,
        },
      };
    }),
  completeThinking: () =>
    set((s) => {
      if (!s.thinkingTask) return {};
      return {
        thinkingTask: {
          ...s.thinkingTask,
          status: 'success',
          durationMs: Date.now() - s.thinkingTask.startedAt,
        },
      };
    }),
  failThinking: (_reason) =>
    set((s) => {
      if (!s.thinkingTask) return {};
      return {
        thinkingTask: {
          ...s.thinkingTask,
          status: 'failed',
          durationMs: Date.now() - s.thinkingTask.startedAt,
        },
      };
    }),
  timeoutThinking: () =>
    set((s) => {
      if (!s.thinkingTask) return {};
      return {
        thinkingTask: {
          ...s.thinkingTask,
          status: 'timeout',
          durationMs: Date.now() - s.thinkingTask.startedAt,
        },
      };
    }),
  setGroups: (groups) =>
    set((s) => {
      const nextGroups = ensureFallbackGroup(groups);
      return {
        groups: nextGroups,
        sections: deriveSectionsFromGroups(nextGroups, { input: s.input, intent: s.intent }),
      };
    }),
  openDrawer: (cardId) =>
    set(() => ({
      drawer: { open: true, cardId },
    })),
  closeDrawer: () =>
    set(() => ({
      drawer: { ...INITIAL_DRAWER },
    })),
  openDeploy: (cardId) =>
    set((s) => ({
      deploy: { ...s.deploy, open: true, cardId, status: 'draft', error: null },
    })),
  closeDeploy: () =>
    set(() => ({
      deploy: { ...INITIAL_DEPLOY },
    })),
  setDeployField: (key, value) =>
    set((s) => ({
      deploy: { ...s.deploy, [key]: value },
    })),
  submitDeploy: () =>
    set((s) => {
      if (!s.deploy.open || !s.deploy.cardId) return {};
      return {
        deploy: { ...s.deploy, status: 'submitted', error: null },
      };
    }),
  resetRecommend: () =>
    set((s) => ({
      intent: { ...INITIAL_INTENT },
      thinkingTask: null,
      groups: INITIAL_GROUPS.map((group) => ({ ...group })),
      sections: deriveSectionsFromGroups(INITIAL_GROUPS, { input: s.input, intent: INITIAL_INTENT }),
      drawer: { ...INITIAL_DRAWER },
      deploy: { ...INITIAL_DEPLOY },
      unmetDemandLog: [],
    })),
  appendUnmetDemand: (feedbackText) =>
    set((s) => ({
      unmetDemandLog: [
        ...s.unmetDemandLog,
        {
          intentText: s.intent.text,
          feedbackText,
          createdAt: Date.now(),
        },
      ],
    })),
  captureInvalidQuery: () =>
    set((s) => {
      const intentText = s.intent.text;
      if (!intentText) return {};
      const alreadyCaptured = s.unmetDemandLog.some((entry) => entry.intentText === intentText);
      if (alreadyCaptured) return {};
      return {
        unmetDemandLog: [
          ...s.unmetDemandLog,
          {
            intentText,
            feedbackText: '',
            createdAt: Date.now(),
          },
        ],
      };
    }),
}));

export function useIntentParsed(): IntentParsed {
  return useRecommendStore((s) => getIntentParsed(s));
}
