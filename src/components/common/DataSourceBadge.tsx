import React from 'react';

export type DataSourceType = 'btm_plus' | 'external' | 'cross_domain' | 'private_end';

interface DataSourceBadgeProps {
  type?: DataSourceType;
  className?: string;
}

type BadgeConfig = {
  label: string;
  emoji: string;
  className: string;
  title: string;
};

const CONFIG: Record<DataSourceType, BadgeConfig> = {
  btm_plus: {
    label: 'BTM+',
    emoji: '🟦',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    title: 'BTM+：平台自建数据源，口径来自 trade.common 自研加工',
  },
  external: {
    label: '外采',
    emoji: '⚪️',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
    title: '外采：来自第三方合作伙伴或外部采购',
  },
  cross_domain: {
    label: '跨域',
    emoji: '🟧',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    title: '跨域：跨业务域拼接融合的派生数据源',
  },
  private_end: {
    label: '小端',
    emoji: '🟢',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: '小端：独立业务小端自有数据源',
  },
};

const UNLABELED: BadgeConfig = {
  label: '未标注',
  emoji: '·',
  className: 'bg-slate-50 text-slate-500 border-slate-200',
  title: '未标注数据源类型',
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ type, className = '' }) => {
  const cfg = type ? CONFIG[type] : UNLABELED;
  return (
    <span
      title={cfg.title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className} ${className}`}
    >
      <span aria-hidden>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  );
};

export default DataSourceBadge;
