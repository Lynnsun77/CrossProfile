import type { AssetDetailChangelogItem } from '../types';
import { EmptyState } from './EmptyState';

interface DefinitionChangelogProps {
  items?: AssetDetailChangelogItem[];
  loading?: boolean;
  error?: string | null;
}

export function DefinitionChangelog({ items, loading, error }: DefinitionChangelogProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="口径变更日志加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无口径变更日志" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">口径变更日志</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${item.date}-${item.change}`} className="rounded-xl bg-bg px-4 py-3">
            <div className="text-xs text-text-3">{item.date}</div>
            <div className="mt-1 text-sm font-medium text-text-1">{item.change}</div>
            <div className="mt-1 text-sm text-text-2">{item.impact}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
