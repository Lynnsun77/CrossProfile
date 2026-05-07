import { describe, expect, it } from 'vitest';
import { parseIntent } from './parseIntent';

describe('parseIntent', () => {
  it('空输入使用兜底', () => {
    const r = parseIntent({});
    expect(r.target).toBe('综合增长');
    expect(r.scene).toBe('待进一步确认');
    expect(r.objectType).toBe('策略 / 人群 / 标签');
    expect(r.preference).toBe('优先可直接复用方案');
    expect(r.goalIds).toEqual([]);
    expect(r.sceneIds).toEqual([]);
  });

  it('goal + scene 组合', () => {
    const r = parseIntent({ goalIds: ['orders'], sceneIds: ['local_growth'] });
    expect(r.target).toBe('提升订单量');
    expect(r.scene).toBe('生服用增');
    expect(r.goalIds).toEqual(['orders']);
    expect(r.sceneIds).toEqual(['local_growth']);
  });

  it('仅 text 关键词识别目标与场景', () => {
    const r = parseIntent({ text: '我想在电商营销场景提升订单量 高复用' });
    expect(r.target).toBe('提升订单量');
    expect(r.scene).toBe('电商营销');
    expect(r.preference).toBe('高复用');
    expect(r.goalIds).toEqual(['orders']);
    expect(r.sceneIds).toEqual(['ecom_mkt']);
  });

  it('objectType 从文本中识别', () => {
    const r = parseIntent({ text: '需要一个人群包' });
    expect(r.objectType).toBe('人群');
  });
});
