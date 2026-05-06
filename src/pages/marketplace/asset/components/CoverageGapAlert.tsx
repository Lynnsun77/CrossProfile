import type { AssetDetailCoverageGapAlert } from '../types';
import { EmptyState } from './EmptyState';

interface CoverageGapAlertProps {
  data?: AssetDetailCoverageGapAlert;
  loading?: boolean;
  error?: string | null;
}

export function CoverageGapAlert({ data, loading, error }: CoverageGapAlertProps) {
  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="覆盖缺口提示加载失败" description={error} />;
  if (!data) return <EmptyState title="暂无覆盖缺口提示" />;
  return (
    <div className={`rounded-2xl border p-4 ${data.level === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-sky-200 bg-sky-50'}`}>
      <div className="text-sm font-semibold text-text-1">{data.title}</div>
      <div className="mt-1 text-sm text-text-2">{data.description}</div>
    </div>
  );
}
