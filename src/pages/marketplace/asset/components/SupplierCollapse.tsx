import { useState } from 'react';
import type { AssetDetailSupplierPanel } from '../types';
import { EmptyState } from './EmptyState';

interface SupplierCollapseProps {
  data?: AssetDetailSupplierPanel;
  visible?: boolean;
}

export function SupplierCollapse({ data, visible }: SupplierCollapseProps) {
  const [open, setOpen] = useState(false);
  if (!visible) return null;
  if (!data) return <EmptyState title="暂无供给方补充信息" />;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text-1">{data.title}</div>
          <div className="mt-1 text-sm text-text-2">{data.summary}</div>
        </div>
        <button type="button" onClick={() => setOpen((prev) => !prev)} className="rounded-lg border border-border px-3 py-2 text-sm text-text-2">
          {open ? '收起' : '展开'}
        </button>
      </div>
      {open ? (
        <ul className="mt-4 space-y-2 text-sm text-text-2">
          {data.bullets.map((bullet) => (
            <li key={bullet}>• {bullet}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
