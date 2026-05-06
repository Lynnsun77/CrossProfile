import { EmptyState } from './EmptyState';
import type { AssetDetailUseCaseVerdict } from '../types';

interface QualityVerdictProps {
  items?: AssetDetailUseCaseVerdict[];
  selectedKey?: string;
  loading?: boolean;
  error?: string | null;
}

const verdictStyles = {
  recommended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  conditional: 'bg-amber-50 text-amber-700 border-amber-200',
  not_recommended: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function QualityVerdict({ items, selectedKey, loading, error }: QualityVerdictProps) {
  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="红线判定加载失败" description={error} />;
  }
  if (!items?.length) {
    return <EmptyState title="暂无红线判定" />;
  }

  const current = items.find((item) => item.useCaseKey === selectedKey) || items[0];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">质量红线判定</div>
        <span className={`rounded-full border px-3 py-1 text-xs ${verdictStyles[current.verdict]}`}>{current.label}</span>
      </div>
      <div className="mt-3 text-sm leading-6 text-text-2">{current.summary}</div>
      <div className="mt-4 space-y-2">
        {current.blockedBy.length ? current.blockedBy.map((item) => (
          <div key={item} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{item}</div>
        )) : <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">当前用途没有红线阻塞项</div>}
      </div>
    </div>
  );
}
