import type { AssetDetailPersonalSample } from '../types';
import { EmptyState } from './EmptyState';

interface PersonalSamplesProps {
  items?: AssetDetailPersonalSample[];
  loading?: boolean;
  error?: string | null;
}

export function PersonalSamples({ items, loading, error }: PersonalSamplesProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="真实样例加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无真实样例" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">我范围内的真实样例</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-bg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-text-1">{item.label}</div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] text-text-2">{item.scopeTag}</span>
            </div>
            <div className="mt-1 text-sm text-text-2">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
