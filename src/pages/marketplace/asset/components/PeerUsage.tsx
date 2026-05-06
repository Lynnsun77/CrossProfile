import type { AssetDetailPeerUsage } from '../types';
import { EmptyState } from './EmptyState';

interface PeerUsageProps {
  items?: AssetDetailPeerUsage[];
  loading?: boolean;
  error?: string | null;
}

export function PeerUsage({ items, loading, error }: PeerUsageProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="同类用户行为加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无同类用户行为" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">同类用户订阅行为</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${item.team}-${item.scenario}`} className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-text-1">{item.team}</div>
              <span className="rounded-full bg-bg px-2 py-1 text-[11px] text-text-2">{item.status}</span>
            </div>
            <div className="mt-1 text-sm text-text-2">{item.scenario}</div>
            <div className="mt-1 text-xs text-text-3">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
