import { describe, expect, it } from 'vitest';
import { buildReasonText } from './buildReasonText';
import { parseIntent } from './parseIntent';
import type { RecommendationCard } from '../types';

const baseCard: RecommendationCard = {
  id: 'x',
  group: 'ready',
  name: 'x',
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

describe('buildReasonText', () => {
  it('card.reasons 非空时优先使用', () => {
    const parsed = parseIntent({});
    const reasons = buildReasonText(parsed, { ...baseCard, reasons: ['r1', 'r2'] });
    expect(reasons).toEqual(['r1', 'r2']);
  });

  it('card.reasons 为空时使用模板兜底', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['local_weekly'] });
    const reasons = buildReasonText(parsed, baseCard);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain('提升订单量');
    expect(reasons[1]).toContain('生服周增');
  });

  it('最多返回 3 条', () => {
    const parsed = parseIntent({});
    const reasons = buildReasonText(parsed, { ...baseCard, reasons: ['a', 'b', 'c', 'd'] });
    expect(reasons).toHaveLength(3);
  });
});
