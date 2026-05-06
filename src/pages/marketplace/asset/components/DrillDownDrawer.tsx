import type { AssetDetailDrilldownPayload } from '../types';
import { EmptyState } from './EmptyState';

interface DrillDownDrawerProps {
  open: boolean;
  title?: string;
  payload?: AssetDetailDrilldownPayload;
  onClose: () => void;
}

export function DrillDownDrawer({ open, title, payload, onClose }: DrillDownDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="关闭下钻抽屉" />
      <aside className="relative h-full w-full max-w-2xl overflow-auto border-l border-border bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-text-3">Drilldown</div>
            <div className="mt-1 text-lg font-semibold text-text-1">{title || payload?.title || '数值下钻'}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2 transition hover:border-module-market/30 hover:text-module-market"
          >
            关闭
          </button>
        </div>

        <div className="p-6">
          {payload ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-bg text-left text-text-3">
                  <tr>
                    {payload.columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white text-text-2">
                  {payload.rows.map((row, rowIndex) => (
                    <tr key={`${payload.title}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${payload.title}-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无下钻内容" description="当前指标没有附带 drilldown 数据。" />
          )}
        </div>
      </aside>
    </div>
  );
}
