import { EmptyState } from './EmptyState';
import type { AssetDetailQualityBadge } from '../types';

interface QualityBadgesProps {
  items?: AssetDetailQualityBadge[];
  loading?: boolean;
  error?: string | null;
}

export function QualityBadges({ items, loading, error }: QualityBadgesProps) {
  if (loading) {
    return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-bg" />)}</div>;
  }
  if (error) {
    return <EmptyState title="质量徽章加载失败" description={error} />;
  }
  if (!items?.length) {
    return <EmptyState title="暂无质量徽章" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm text-text-3">{item.label}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-2xl font-semibold text-text-1">{item.score}</div>
            <div className="text-xs text-text-3">P{item.percentile}</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-module-market" style={{ width: `${item.percentile}%` }} />
          </div>
          <div className="mt-2 text-xs leading-5 text-text-2">{item.description}</div>
        </div>
      ))}
    </div>
  );
}
