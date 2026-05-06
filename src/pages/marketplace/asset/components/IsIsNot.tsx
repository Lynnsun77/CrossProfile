import { EmptyState } from './EmptyState';
import type { AssetDetailIsIsNot } from '../types';

interface IsIsNotProps {
  data?: AssetDetailIsIsNot;
  loading?: boolean;
  error?: string | null;
}

export function IsIsNot({ data, loading, error }: IsIsNotProps) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="是 / 不是加载失败" description={error} />;
  }
  if (!data) {
    return <EmptyState title="暂无是 / 不是信息" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-sm font-semibold text-emerald-700">它是</div>
        <ul className="mt-3 space-y-2 text-sm text-emerald-900">
          {data.isItems.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="text-sm font-semibold text-rose-700">它不是</div>
        <ul className="mt-3 space-y-2 text-sm text-rose-900">
          {data.isNotItems.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
