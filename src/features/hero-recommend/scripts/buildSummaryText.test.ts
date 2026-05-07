import { describe, expect, it } from 'vitest';
import { buildSummaryText } from './buildSummaryText';
import { parseIntent } from './parseIntent';
import type { GroupedRecommendations, RecommendationCard } from '../types';

function makeCard(id: string, group: RecommendationCard['group']): RecommendationCard {
  return {
    id,
    group,
    name: 'c',
    objectType: '策略',
    matchScore: 80,
    matchLabel: group === 'ready' ? '高匹配' : '中匹配',
    oneLineReason: '',
    hitTags: [],
    metrics: [],
    goals: [],
    scenes: [],
    preferenceTags: [],
    reasons: [],
  };
}

describe('buildSummaryText', () => {
  it('变量替换为可直接复用和可加工后使用表述', () => {
    const parsed = parseIntent({});
    const grouped: GroupedRecommendations = {
      ready: [makeCard('a', 'ready'), makeCard('b', 'ready')],
      adaptable: [makeCard('c', 'adaptable'), makeCard('d', 'adaptable'), makeCard('e', 'adaptable')],
      fallback: { show: false },
    };

    const text = buildSummaryText(parsed, grouped);
    expect(text).toContain('5');
    expect(text).toContain('2 条可直接复用');
    expect(text).toContain('3 条可加工后使用');
  });

  it('无卡片时返回 fallback 或空摘要', () => {
    const parsed = parseIntent({});
    const grouped: GroupedRecommendations = {
      ready: [],
      adaptable: [],
      fallback: { show: true, reason: '建议补充画像标签建设。' },
    };

    const text = buildSummaryText(parsed, grouped);
    expect(text).toContain('补充画像标签建设');
  });
});
