import type { AssetDetailBoundaryCase } from '../types';
import { EmptyState } from './EmptyState';

interface BoundaryCasesProps {
  items?: AssetDetailBoundaryCase[];
  loading?: boolean;
  error?: string | null;
}

export function BoundaryCases({ items, loading, error }: BoundaryCasesProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="边界案例加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无边界案例" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">边界与失败案例</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-text-1">{item.title}</div>
              <span className={`rounded-full px-2 py-1 text-[11px] ${item.outcome === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{item.outcome}</span>
            </div>
            <div className="mt-1 text-sm text-text-2">{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
