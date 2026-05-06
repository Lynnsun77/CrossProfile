import { EmptyState } from './EmptyState';
import type { AssetDetailCoverageStage } from '../types';

interface CoverageWaterfallProps {
  items?: AssetDetailCoverageStage[];
  loading?: boolean;
  error?: string | null;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
}

export function CoverageWaterfall({ items, loading, error, onOpenDrilldown }: CoverageWaterfallProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="覆盖瀑布加载失败" description={error} />;
  }
  if (!items?.length) {
    return <EmptyState title="暂无覆盖瀑布" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">个性化覆盖瀑布</div>
        <span className="text-xs text-text-3">点击数值可下钻</span>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="w-full text-left"
            onClick={() => item.drilldownId && onOpenDrilldown(item.drilldownId, item.label)}
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-text-1">{item.label}</div>
                <div className="mt-1 text-xs text-text-3">{item.reason}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-text-1">{item.coverage}%</div>
                <div className={`text-xs ${item.delta < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{item.delta > 0 ? '+' : ''}{item.delta}pp</div>
              </div>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-module-market" style={{ width: `${item.coverage}%` }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
