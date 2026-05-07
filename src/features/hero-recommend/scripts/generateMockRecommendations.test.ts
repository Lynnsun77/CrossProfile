import { describe, expect, it } from 'vitest';
import { generateMockRecommendations } from './generateMockRecommendations';
import { parseIntent } from './parseIntent';

describe('generateMockRecommendations', () => {
  it('空输入返回默认前 2/2/2', () => {
    const parsed = parseIntent({});
    const grouped = generateMockRecommendations(parsed);
    expect(grouped.priority.length).toBeGreaterThan(0);
    expect(grouped.expandable.length).toBeGreaterThan(0);
    expect(grouped.similar.length).toBeGreaterThan(0);
    expect(grouped.priority.length).toBeLessThanOrEqual(2);
  });

  it('命中 goal+scene 的卡片进入 priority', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['local_weekly'] });
    const grouped = generateMockRecommendations(parsed);
    expect(grouped.priority.length).toBeGreaterThan(0);
    // rec-001 同时命中 orders + local_weekly
    expect(grouped.priority.some((c) => c.id === 'rec-001')).toBe(true);
  });

  it('每组最多 3 条', () => {
    const parsed = parseIntent({ goalIds: ['orders', 'gmv'], sceneIds: ['ecom_mkt'] });
    const grouped = generateMockRecommendations(parsed);
    expect(grouped.priority.length).toBeLessThanOrEqual(3);
    expect(grouped.expandable.length).toBeLessThanOrEqual(3);
    expect(grouped.similar.length).toBeLessThanOrEqual(3);
  });
});
