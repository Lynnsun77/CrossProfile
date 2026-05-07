import mockRecommendationsRaw from '../mock/mockRecommendations.json';
import type {
  GroupedRecommendations,
  IntentParsedResult,
  RecommendationCard,
} from '../types';

const ALL_CARDS = mockRecommendationsRaw as RecommendationCard[];

const MAX_PER_GROUP = 3;

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

export function generateMockRecommendations(
  parsed: IntentParsedResult
): GroupedRecommendations {
  const { goalIds, sceneIds, objectType, preference } = parsed;

  // 如果用户无任何输入（未选 tag、未输入文本 → 没有 raw），返回默认前 2/2/2
  const hasAnyInput =
    goalIds.length > 0 || sceneIds.length > 0 || parsed.rawText.length > 0;

  if (!hasAnyInput) {
    const priorityDefaults = take(
      ALL_CARDS.filter((c) => c.group === 'priority'),
      2
    );
    const expandableDefaults = take(
      ALL_CARDS.filter((c) => c.group === 'expandable'),
      2
    );
    const similarDefaults = take(
      ALL_CARDS.filter((c) => c.group === 'similar'),
      2
    );
    return {
      priority: priorityDefaults,
      expandable: expandableDefaults,
      similar: similarDefaults,
    };
  }

  const priority: RecommendationCard[] = [];
  const expandable: RecommendationCard[] = [];
  const similar: RecommendationCard[] = [];

  for (const card of ALL_CARDS) {
    const hitGoal = goalIds.length > 0 && card.goals.some((g) => goalIds.includes(g));
    const hitScene = sceneIds.length > 0 && card.scenes.some((s) => sceneIds.includes(s));

    if (hitGoal && hitScene) {
      priority.push(card);
      continue;
    }
    if (hitGoal || hitScene) {
      expandable.push(card);
      continue;
    }
    // 都未命中：按 objectType / preference 兜底为 similar
    const matchesObjectType =
      objectType && objectType !== '策略 / 人群 / 标签' && card.objectType === objectType;
    const matchesPreference =
      preference && card.preferenceTags.some((t) => preference.includes(t) || t.includes(preference));

    if (matchesObjectType || matchesPreference) {
      similar.push(card);
    }
  }

  // 按 matchScore 排序后截断
  priority.sort((a, b) => b.matchScore - a.matchScore);
  expandable.sort((a, b) => b.matchScore - a.matchScore);
  similar.sort((a, b) => b.matchScore - a.matchScore);

  return {
    priority: take(priority, MAX_PER_GROUP),
    expandable: take(expandable, MAX_PER_GROUP),
    similar: take(similar, MAX_PER_GROUP),
  };
}
