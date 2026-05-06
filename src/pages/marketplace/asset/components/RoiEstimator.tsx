import { useMemo, useState } from 'react';
import type { AssetDetailRoiEstimatorScenario } from '../types';
import { EmptyState } from './EmptyState';

interface RoiEstimatorProps {
  items?: AssetDetailRoiEstimatorScenario[];
  loading?: boolean;
  error?: string | null;
}

export function RoiEstimator({ items, loading, error }: RoiEstimatorProps) {
  const [selectedKey, setSelectedKey] = useState(items?.[0]?.key || '');
  const current = useMemo(() => items?.find((item) => item.key === selectedKey) || items?.[0], [items, selectedKey]);

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="ROI 预估加载失败" description={error} />;
  if (!items?.length || !current) return <EmptyState title="暂无 ROI 预估" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">场景化 ROI 预估</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)} className={`rounded-full px-3 py-1 text-xs ${item.key === current.key ? 'bg-module-market text-white' : 'bg-bg text-text-2'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">预估收入</div><div className="mt-1 text-lg font-semibold text-text-1">¥{current.estimatedRevenue.toLocaleString()}</div></div>
        <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">预估成本</div><div className="mt-1 text-lg font-semibold text-text-1">¥{current.estimatedCost.toLocaleString()}</div></div>
        <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">ROI</div><div className="mt-1 text-lg font-semibold text-emerald-600">{current.roi.toFixed(1)}x</div></div>
      </div>
    </div>
  );
}
