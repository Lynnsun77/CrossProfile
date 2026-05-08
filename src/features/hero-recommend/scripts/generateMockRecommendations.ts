import mockRecommendationsRaw from '../mock/mockRecommendations.json';
import type {
  GroupedRecommendations,
  IntentParsedResult,
  RecommendationCard,
  RecommendationHighlightTag,
} from '../types';

const ALL_CARDS = mockRecommendationsRaw as RecommendationCard[];
const MAX_PER_GROUP = 3;
const LOW_SIGNAL_METRICS = new Set(['置信度', '人群规模', '覆盖门店', '覆盖用户', '覆盖触点', '标签数']);
const REUSE_PREFERENCE_TAGS = new Set(['高复用', '可快速落地']);
const GOAL_METRIC_LABELS: Record<string, string[]> = {
  orders: ['订单量', '订单数', '下单率'],
  gmv: ['GMV'],
  acquire: ['新客占比', '拉新率'],
  recall: ['召回率'],
  retain: ['留存', '复购率'],
};

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

function parseMetricValue(value: string): number {
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getBusinessValueScore(card: RecommendationCard): number {
  const primaryMetric = card.metrics.find((metric) => !LOW_SIGNAL_METRICS.has(metric.label));
  return primaryMetric ? parseMetricValue(primaryMetric.value) : 0;
}

function getGoalAlignedMetric(card: RecommendationCard, goalId: string) {
  const preferredLabels = GOAL_METRIC_LABELS[goalId] ?? [];
  return card.metrics.find((metric) => preferredLabels.includes(metric.label)) ?? null;
}

function getGoalAlignedMetricScore(card: RecommendationCard, goalId: string) {
  const metric = getGoalAlignedMetric(card, goalId);
  return metric ? parseMetricValue(metric.value) : -1;
}

function getReuseScore(card: RecommendationCard) {
  return card.preferenceTags.reduce((score, tag) => score + (REUSE_PREFERENCE_TAGS.has(tag) ? 1 : 0), 0);
}

function sortReadyCardsByPreference(cards: RecommendationCard[], preference: string) {
  const order =
    preference === '优先高匹配方案'
      ? ['匹配度最高', '收益最优']
      : preference === '优先高收益方案'
        ? ['收益最优', '匹配度最高']
        : null;

  if (order) {
    return [...cards].sort((a, b) => order.indexOf(a.highlightTag ?? '') - order.indexOf(b.highlightTag ?? ''));
  }

  return [...cards].sort((a, b) => getReuseScore(b) - getReuseScore(a) || b.matchScore - a.matchScore);
}

function sortAdaptableByPreference(cards: RecommendationCard[], goalId: string, sceneId: string, preference: string) {
  return [...cards].sort((a, b) => {
    if (preference === '优先高匹配方案') {
      return (
        getComboScore(b, goalId, sceneId) - getComboScore(a, goalId, sceneId) ||
        b.matchScore - a.matchScore ||
        getGoalAlignedMetricScore(b, goalId) - getGoalAlignedMetricScore(a, goalId)
      );
    }

    if (preference === '优先高收益方案') {
      return (
        getGoalAlignedMetricScore(b, goalId) - getGoalAlignedMetricScore(a, goalId) ||
        getBusinessValueScore(b) - getBusinessValueScore(a) ||
        b.matchScore - a.matchScore
      );
    }

    return (
      getReuseScore(b) - getReuseScore(a) ||
      getComboScore(b, goalId, sceneId) - getComboScore(a, goalId, sceneId) ||
      b.matchScore - a.matchScore
    );
  });
}

function getComboScore(card: RecommendationCard, goalId: string, sceneId: string): number {
  const goalHit = card.goals.includes(goalId);
  const sceneHit = card.scenes.includes(sceneId);

  let score = card.matchScore;
  if (goalHit) score += 35;
  if (sceneHit) score += 35;
  if (card.group === 'ready') score += 8;
  if (goalHit && sceneHit) score += 10;
  return score;
}

function buildHighlightedReadyCard(
  card: RecommendationCard,
  highlightTag: RecommendationHighlightTag,
  goalId: string,
  sceneId: string,
  variantIndex: number,
): RecommendationCard {
  const goalHit = card.goals.includes(goalId);
  const sceneHit = card.scenes.includes(sceneId);
  const baseScore = highlightTag === '匹配度最高' ? 92 : 89;
  const nextScore = Math.min(98, Math.max(card.matchScore, baseScore + (goalHit ? 2 : 0) + (sceneHit ? 2 : 0) - variantIndex));
  const goalMetric = getGoalAlignedMetric(card, goalId);
  const highlightDetail =
    highlightTag === '收益最优'
      ? goalMetric
        ? `历史收益${goalMetric.label} ${goalMetric.value}`
        : undefined
      : `高匹配 ${nextScore}%`;

  return {
    ...card,
    id: `${card.id}__${highlightTag === '收益最优' ? 'benefit' : 'match'}__${goalId}__${sceneId}`,
    group: 'ready',
    matchLabel: '高匹配',
    matchScore: nextScore,
    hitTags: card.hitTags,
    highlightTag,
    highlightDetail,
  };
}

function buildReadyCardsForCombo(goalId: string, sceneId: string, preference: string): RecommendationCard[] {
  const ranked = ALL_CARDS
    .map((card) => ({
      card,
      comboScore: getComboScore(card, goalId, sceneId),
      businessValueScore: getBusinessValueScore(card),
      goalMetricScore: getGoalAlignedMetricScore(card, goalId),
      goalHit: card.goals.includes(goalId),
      sceneHit: card.scenes.includes(sceneId),
    }))
    .sort(
      (a, b) =>
        b.comboScore - a.comboScore || b.card.matchScore - a.card.matchScore || b.goalMetricScore - a.goalMetricScore || b.businessValueScore - a.businessValueScore,
    );

  const bestMatch = ranked[0]?.card;
  const benefitCandidates = ranked
    .filter((item) => (item.goalHit || item.sceneHit) && item.goalMetricScore >= 0)
    .sort(
      (a, b) =>
        b.goalMetricScore - a.goalMetricScore || b.comboScore - a.comboScore || b.card.matchScore - a.card.matchScore || b.businessValueScore - a.businessValueScore,
    );
  const bestBenefit =
    benefitCandidates.find((item) => item.card.id !== bestMatch?.id)?.card ??
    ranked.find((item) => item.card.id !== bestMatch?.id)?.card ??
    bestMatch;

  if (!bestMatch || !bestBenefit) {
    return [];
  }

  return sortReadyCardsByPreference([
    buildHighlightedReadyCard(bestBenefit, '收益最优', goalId, sceneId, 0),
    buildHighlightedReadyCard(bestMatch, '匹配度最高', goalId, sceneId, 1),
  ], preference);
}

export function generateMockRecommendations(parsed: IntentParsedResult): GroupedRecommendations {
  const { goalIds, sceneIds, preference } = parsed;
  const hasAnyInput = goalIds.length > 0 || sceneIds.length > 0 || parsed.rawText.length > 0;
  const goalId = goalIds[0];
  const sceneId = sceneIds[0];

  if (!hasAnyInput) {
    return {
      ready: take(
        ALL_CARDS.filter((card) => card.group === 'ready').sort((a, b) => b.matchScore - a.matchScore),
        2,
      ),
      adaptable: take(
        ALL_CARDS.filter((card) => card.group === 'adaptable').sort((a, b) => b.matchScore - a.matchScore),
        2,
      ),
      fallback: { show: false },
    };
  }

  if (goalId && sceneId) {
    const ready = buildReadyCardsForCombo(goalId, sceneId, preference);
    const readySourceIds = new Set(ready.map((card) => card.id.split('__')[0]));
    const adaptable = sortAdaptableByPreference(
      ALL_CARDS
      .filter((card) => !readySourceIds.has(card.id) && (card.goals.includes(goalId) || card.scenes.includes(sceneId)))
      .map((card) => ({ ...card, group: 'adaptable' as const, matchLabel: '中匹配' as const, highlightTag: undefined })),
      goalId,
      sceneId,
      preference,
    )
      .slice(0, MAX_PER_GROUP);

    return {
      ready,
      adaptable,
      fallback: { show: false },
    };
  }

  const ready: RecommendationCard[] = [];
  const adaptable: RecommendationCard[] = [];

  for (const card of ALL_CARDS) {
    const hitGoal = goalIds.length > 0 && card.goals.some((goal) => goalIds.includes(goal));
    const hitScene = sceneIds.length > 0 && card.scenes.some((scene) => sceneIds.includes(scene));

    if (hitGoal && hitScene) {
      ready.push({ ...card, group: 'ready', matchLabel: '高匹配' });
      continue;
    }

    if (hitGoal || hitScene) {
      adaptable.push({ ...card, group: 'adaptable', matchLabel: '中匹配' });
    }
  }

  ready.sort((a, b) => b.matchScore - a.matchScore);
  adaptable.sort((a, b) => b.matchScore - a.matchScore);

  const nextReady = take(ready, MAX_PER_GROUP);
  const nextAdaptable = take(adaptable, MAX_PER_GROUP);
  const hasMatches = nextReady.length > 0 || nextAdaptable.length > 0;

  return {
    ready: nextReady,
    adaptable: nextAdaptable,
    fallback: {
      show: !hasMatches,
      reason: hasMatches ? undefined : '现有资产尚未覆盖该类诉求，建议补充画像标签建设或重新描述需求。',
    },
  };
}
