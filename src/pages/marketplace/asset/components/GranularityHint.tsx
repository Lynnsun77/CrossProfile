import type { AssetDetailGranularityHint } from '../types';
import { EmptyState } from './EmptyState';

interface GranularityHintProps {
  data?: AssetDetailGranularityHint;
  loading?: boolean;
  error?: string | null;
}

export function GranularityHint({ data, loading, error }: GranularityHintProps) {
  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="粒度提示加载失败" description={error} />;
  if (!data) return <EmptyState title="暂无粒度提示" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">{data.title}</div>
      <p className="mt-2 text-sm text-text-2">{data.summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-text-2">
        {data.suggestions.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
