import type { NavStage } from './nav.types';

export type NavStageTheme = {
  groupAccent: string;
  groupLabel: string;
  itemHover: string;
  itemText: string;
  itemActive: string;
  itemBar: string;
  badge: string;
};

const STAGE_THEME_MAP: Record<NavStage, NavStageTheme> = {
  market: {
    groupAccent: 'bg-module-market/15',
    groupLabel: 'text-module-market',
    itemHover: 'hover:bg-module-market/5 hover:text-module-market',
    itemText: 'text-text-2',
    itemActive: 'bg-module-market/10 text-module-market',
    itemBar: 'bg-module-market',
    badge: 'bg-module-market text-white',
  },
  workshop: {
    groupAccent: 'bg-module-workshop/15',
    groupLabel: 'text-module-workshop',
    itemHover: 'hover:bg-module-workshop/5 hover:text-module-workshop',
    itemText: 'text-text-2',
    itemActive: 'bg-module-workshop/10 text-module-workshop',
    itemBar: 'bg-module-workshop',
    badge: 'bg-module-workshop text-white',
  },
  dashboard: {
    groupAccent: 'bg-module-dashboard/15',
    groupLabel: 'text-module-dashboard',
    itemHover: 'hover:bg-module-dashboard/5 hover:text-module-dashboard',
    itemText: 'text-text-2',
    itemActive: 'bg-module-dashboard/10 text-module-dashboard',
    itemBar: 'bg-module-dashboard',
    badge: 'bg-module-dashboard text-white',
  },
  neutral: {
    groupAccent: 'bg-slate-100',
    groupLabel: 'text-slate-600',
    itemHover: 'hover:bg-slate-100 hover:text-slate-900',
    itemText: 'text-text-2',
    itemActive: 'bg-slate-900 text-white',
    itemBar: 'bg-slate-900',
    badge: 'bg-slate-900 text-white',
  },
};

export function inferStage(groupLabel: string): NavStage {
  if (/(市集|消费|我的)/.test(groupLabel)) {
    return groupLabel.includes('我的') ? 'neutral' : 'market';
  }
  if (/(算法|流水线|注册|发布|评测)/.test(groupLabel)) {
    return 'workshop';
  }
  if (/(工作台|洞察|诊断|质量|治理|大盘)/.test(groupLabel)) {
    return 'dashboard';
  }
  return 'neutral';
}

export function getStageTheme(stage: NavStage) {
  return STAGE_THEME_MAP[stage];
}
