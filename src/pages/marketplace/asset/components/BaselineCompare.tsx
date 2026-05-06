import type { AssetDetailBaselineCompareRow } from '../types';
import { EmptyState } from './EmptyState';

interface BaselineCompareProps {
  rows?: AssetDetailBaselineCompareRow[];
  loading?: boolean;
  error?: string | null;
}

export function BaselineCompare({ rows, loading, error }: BaselineCompareProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="基准线对照加载失败" description={error} />;
  if (!rows?.length) return <EmptyState title="暂无基准线对照" />;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border px-5 py-4 text-sm font-semibold text-text-1">分场景基准线对照</div>
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-bg text-left text-text-3">
          <tr>
            <th className="px-4 py-3 font-medium">场景</th>
            <th className="px-4 py-3 font-medium">基线</th>
            <th className="px-4 py-3 font-medium">实际</th>
            <th className="px-4 py-3 font-medium">结果</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white text-text-2">
          {rows.map((row) => (
            <tr key={row.scenario}>
              <td className="px-4 py-3">{row.scenario}</td>
              <td className="px-4 py-3">{row.baseline}%</td>
              <td className="px-4 py-3">{row.actual}%</td>
              <td className="px-4 py-3">{row.passed ? '通过' : '未达标'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
