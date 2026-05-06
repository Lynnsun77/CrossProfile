import { EmptyState } from './EmptyState';
import type { AssetDetailKnownIssue } from '../types';

interface KnownIssuesProps {
  items?: AssetDetailKnownIssue[];
  loading?: boolean;
  error?: string | null;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
}

const severityStyle = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function KnownIssues({ items, loading, error, onOpenDrilldown }: KnownIssuesProps) {
  if (loading) {
    return <div className="h-52 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="已知问题加载失败" description={error} />;
  }
  if (!items?.length) {
    return <EmptyState title="暂无已知问题" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">已知问题清单</div>
        <button type="button" className="text-xs text-module-market" onClick={() => onOpenDrilldown('issue_log', '问题日志')}>
          查看问题日志
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-bg px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-text-1">{item.title}</div>
                <div className="mt-1 text-sm text-text-2">{item.summary}</div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs ${severityStyle[item.severity]}`}>{item.severity}</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white px-3 py-2 text-sm text-text-2">影响: {item.impact}</div>
              <div className="rounded-xl bg-white px-3 py-2 text-sm text-text-2">建议: {item.suggestion}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
