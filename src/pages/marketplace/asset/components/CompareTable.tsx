import { EmptyState } from './EmptyState';
import type { AssetDetailCompareRow } from '../types';

interface CompareTableProps {
  rows?: AssetDetailCompareRow[];
  compareWith?: string | null;
  loading?: boolean;
  error?: string | null;
}

export function CompareTable({ rows, compareWith, loading, error }: CompareTableProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="对比面板加载失败" description={error} />;
  }
  if (!rows?.length) {
    return <EmptyState title="暂无对比数据" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border px-5 py-4 text-sm font-semibold text-text-1">横向对比面板</div>
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-bg text-left text-text-3">
            <tr>
              <th className="px-4 py-3 font-medium">资产</th>
              <th className="px-4 py-3 font-medium">适配度</th>
              <th className="px-4 py-3 font-medium">质量</th>
              <th className="px-4 py-3 font-medium">覆盖</th>
              <th className="px-4 py-3 font-medium">时效</th>
              <th className="px-4 py-3 font-medium">热度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white text-text-2">
            {rows.map((row) => {
              const highlighted = row.assetId === compareWith || row.recommended;
              return (
                <tr key={row.assetId} className={highlighted ? 'bg-module-market/5' : undefined}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-1">{row.name}</div>
                    <div className="mt-1 text-xs text-text-3">{row.assetId}</div>
                  </td>
                  <td className="px-4 py-3">{row.fitScore}</td>
                  <td className="px-4 py-3">{row.qualityScore}</td>
                  <td className="px-4 py-3">{row.coverage}%</td>
                  <td className="px-4 py-3">{row.timeliness}</td>
                  <td className="px-4 py-3">{row.subscriptionHeat}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
