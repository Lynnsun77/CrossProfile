import type { AssetDetailDistributionMini } from '../types';
import { EmptyState } from './EmptyState';

interface DistributionMiniProps {
  data?: AssetDetailDistributionMini;
  loading?: boolean;
  error?: string | null;
}

export function DistributionMini({ data, loading, error }: DistributionMiniProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="分布图加载失败" description={error} />;
  if (!data) return <EmptyState title="暂无分布信息" />;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">{data.title}</div>
        <div className="text-xs text-text-3">avg {data.average} / benchmark {data.benchmark}</div>
      </div>
      <div className="mt-4 flex h-28 items-end gap-2">
        {data.bins.map((bin) => (
          <div key={bin.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-lg bg-module-market/80" style={{ height: `${Math.max(bin.value * 2, 12)}px` }} />
            <div className="text-[11px] text-text-3">{bin.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
