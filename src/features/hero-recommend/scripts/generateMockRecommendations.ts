import mockRecommendationsRaw from '../mock/mockRecommendations.json';
import type { GroupedRecommendations, IntentParsedResult, RecommendationCard } from '../types';

const ALL_CARDS = mockRecommendationsRaw as RecommendationCard[];
const MAX_PER_GROUP = 3;

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

export function generateMockRecommendations(parsed: IntentParsedResult): GroupedRecommendations {
  const { goalIds, sceneIds } = parsed;
  const hasAnyInput = goalIds.length > 0 || sceneIds.length > 0 || parsed.rawText.length > 0;

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
