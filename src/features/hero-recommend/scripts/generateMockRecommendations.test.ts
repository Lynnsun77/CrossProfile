import { describe, expect, it } from 'vitest';
import { generateMockRecommendations } from './generateMockRecommendations';
import { parseIntent } from './parseIntent';

describe('generateMockRecommendations', () => {
  it('空输入返回默认 ready 和 adaptable 推荐', () => {
    const parsed = parseIntent({});
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.ready.length).toBeGreaterThan(0);
    expect(grouped.adaptable.length).toBeGreaterThan(0);
    expect(grouped.fallback.show).toBe(false);
    expect(grouped.ready.length).toBeLessThanOrEqual(2);
  });

  it('命中 goal 和 scene 的卡片进入 ready', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['local_growth'] });
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.ready.length).toBeGreaterThan(0);
    expect(grouped.ready.some((card) => card.id === 'rec-001')).toBe(true);
  });

  it('只命中单一维度的卡片进入 adaptable', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['ecom_mall'] });
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.adaptable.length).toBeGreaterThan(0);
    expect(grouped.adaptable.some((card) => card.id === 'rec-001')).toBe(true);
  });

  it('都不命中时走 fallback', () => {
    const parsed = parseIntent({ text: '我需要海外直播冷启动素材诊断标签' });
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.ready).toHaveLength(0);
    expect(grouped.adaptable).toHaveLength(0);
    expect(grouped.fallback.show).toBe(true);
  });

  it('每组最多 3 条', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['ecom_mkt'] });
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.ready.length).toBeLessThanOrEqual(3);
    expect(grouped.adaptable.length).toBeLessThanOrEqual(3);
  });
});
