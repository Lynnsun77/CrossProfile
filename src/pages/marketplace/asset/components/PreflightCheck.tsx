import type { AssetDetailPreflightCheckItem } from '../types';
import { EmptyState } from './EmptyState';

interface PreflightCheckProps {
  items?: AssetDetailPreflightCheckItem[];
  loading?: boolean;
  error?: string | null;
}

const badge = { pass: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700', fail: 'bg-rose-50 text-rose-700' };

export function PreflightCheck({ items, loading, error }: PreflightCheckProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="预检加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无预检信息" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">订阅前预检</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-text-1">{item.label}</div>
              <span className={`rounded-full px-2 py-1 text-[11px] ${badge[item.status]}`}>{item.status}</span>
            </div>
            <div className="mt-1 text-sm text-text-2">{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
