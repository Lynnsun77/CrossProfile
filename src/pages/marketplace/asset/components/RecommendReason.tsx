import { EmptyState } from './EmptyState';
import type { AssetDetailReasonItem } from '../types';

interface RecommendReasonProps {
  data?: {
    confidence: number;
    summary: string;
    items: AssetDetailReasonItem[];
  };
  loading?: boolean;
  error?: string | null;
}

export function RecommendReason({ data, loading, error }: RecommendReasonProps) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="推荐理由加载失败" description={error} />;
  }
  if (!data) {
    return <EmptyState title="暂无推荐理由" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">推荐理由透明化</div>
        <span className="rounded-full bg-module-market/10 px-3 py-1 text-xs font-medium text-module-market">
          置信度 {(data.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-text-2">{data.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {data.items.map((item) => (
          <div key={item.label} className="rounded-xl bg-bg px-4 py-3">
            <div className="text-xs text-text-3">{item.label}</div>
            <div className="mt-1 text-base font-semibold text-text-1">{item.value}</div>
            <div className="mt-2 text-xs leading-5 text-text-2">{item.evidence}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
