import { describe, expect, it } from 'vitest';
import { buildSummaryText } from './buildSummaryText';
import { parseIntent } from './parseIntent';
import type { GroupedRecommendations, RecommendationCard } from '../types';

function makeCard(id: string): RecommendationCard {
  return {
    id,
    group: 'priority',
    name: 'c',
    objectType: '策略',
    matchScore: 80,
    matchLabel: '高匹配',
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
  it('变量替换', () => {
    const parsed = parseIntent({});
    const grouped: GroupedRecommendations = {
      priority: [makeCard('a'), makeCard('b')],
      expandable: [makeCard('c'), makeCard('d'), makeCard('e')],
      similar: [makeCard('f'), makeCard('g')],
    };
    const text = buildSummaryText(parsed, grouped);
    expect(text).toContain('7');
    expect(text).toContain('2');
    expect(text).toContain('3');
    expect(text).toContain('高复用');
  });

  it('空结果返回空摘要', () => {
    const parsed = parseIntent({});
    const grouped: GroupedRecommendations = { priority: [], expandable: [], similar: [] };
    const text = buildSummaryText(parsed, grouped);
    expect(text).toContain('暂未');
  });
});
