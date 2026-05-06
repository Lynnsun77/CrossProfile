import type { AssetDetailSliceDistribution } from '../types';
import { EmptyState } from './EmptyState';

interface SliceDistributionProps {
  items?: AssetDetailSliceDistribution[];
  loading?: boolean;
  error?: string | null;
}

const trendMark = { up: '↑', down: '↓', flat: '→' };

export function SliceDistribution({ items, loading, error }: SliceDistributionProps) {
  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="切片分布加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无切片分布" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">切片分布分析</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.slice}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-text-1">{item.slice}</span>
              <span className="text-text-3">{item.ratio}% {trendMark[item.trend]}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-module-market" style={{ width: `${item.ratio}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
