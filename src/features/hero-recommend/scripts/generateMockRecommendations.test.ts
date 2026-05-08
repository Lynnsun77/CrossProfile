import mockTagsRaw from '../mock/mockTags.json';
import { describe, expect, it } from 'vitest';
import { generateMockRecommendations } from './generateMockRecommendations';
import { parseIntent } from './parseIntent';
import type { MockTags } from '../types';

const mockTags = mockTagsRaw as MockTags;

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
    const benefitCard = grouped.ready.find((card) => card.highlightTag === '收益最优');

    expect(grouped.ready).toHaveLength(2);
    expect(grouped.ready.map((card) => card.highlightTag).sort()).toEqual(['匹配度最高', '收益最优']);
    expect(benefitCard?.highlightDetail?.includes('标签数')).toBe(false);
    expect(benefitCard?.highlightDetail).toContain('历史收益订单量');
    expect(grouped.ready.some((card) => card.hitTags.includes('收益最优') || card.hitTags.includes('匹配度最高'))).toBe(false);
  });

  it('只命中单一维度的卡片进入 adaptable', () => {
    const parsed = parseIntent({ goalIds: ['orders'], sceneIds: ['ecom_mall'] });
    const grouped = generateMockRecommendations(parsed);

    expect(grouped.adaptable.length).toBeGreaterThan(0);
    expect(
      grouped.adaptable.every((card) => card.goals.includes('orders') || card.scenes.includes('ecom_mall')),
    ).toBe(true);
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

    expect(grouped.ready).toHaveLength(2);
    expect(grouped.adaptable.length).toBeLessThanOrEqual(3);
  });

  it('每个业务目标 x 业务场景组合都稳定产出两张高度匹配卡', () => {
    for (const goal of mockTags.goals) {
      for (const scene of mockTags.scenes) {
        const parsed = parseIntent({ goalIds: [goal.id], sceneIds: [scene.id] });
        const grouped = generateMockRecommendations(parsed);

        expect(grouped.ready).toHaveLength(2);
        expect(grouped.ready.every((card) => card.group === 'ready')).toBe(true);
        expect(grouped.ready.every((card) => card.matchLabel === '高匹配')).toBe(true);
        expect(grouped.ready.map((card) => card.highlightTag).sort()).toEqual(['匹配度最高', '收益最优']);
      }
    }
  });

  it('收益最优的收益文案跟随所选业务目标', () => {
    const gmvGrouped = generateMockRecommendations(parseIntent({ goalIds: ['gmv'], sceneIds: ['ecom_mkt'] }));
    expect(gmvGrouped.ready.find((card) => card.highlightTag === '收益最优')?.highlightDetail).toContain('历史收益GMV');

    const recallGrouped = generateMockRecommendations(parseIntent({ goalIds: ['recall'], sceneIds: ['ecom_mall'] }));
    expect(recallGrouped.ready.find((card) => card.highlightTag === '收益最优')?.highlightDetail).toContain('历史收益召回率');

    const retainGrouped = generateMockRecommendations(parseIntent({ goalIds: ['retain'], sceneIds: ['ecom_mall'] }));
    expect(retainGrouped.ready.find((card) => card.highlightTag === '收益最优')?.highlightDetail).toContain('历史收益留存');
  });
});
