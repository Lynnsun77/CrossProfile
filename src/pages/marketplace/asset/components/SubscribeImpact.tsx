import { EmptyState } from './EmptyState';
import type { AssetDetailSubscribeImpact } from '../types';

interface SubscribeImpactProps {
  data?: AssetDetailSubscribeImpact;
  loading?: boolean;
  error?: string | null;
}

export function SubscribeImpact({ data, loading, error }: SubscribeImpactProps) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="订阅影响加载失败" description={error} />;
  }
  if (!data) {
    return <EmptyState title="暂无订阅影响说明" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">订阅影响说明</div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-bg px-4 py-3">
            <div className="text-xs text-text-3">{metric.label}</div>
            <div className="mt-1 text-lg font-semibold text-text-1">{metric.value}</div>
            <div className="mt-1 text-xs text-text-2">{metric.hint}</div>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-text-2">
        {data.highlights.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
