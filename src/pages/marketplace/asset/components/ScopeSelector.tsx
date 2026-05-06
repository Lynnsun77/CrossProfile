import { EmptyState } from './EmptyState';
import type { AssetDetailScopeSelector } from '../types';
import { useState } from 'react';

interface ScopeSelectorProps {
  data?: AssetDetailScopeSelector;
  loading?: boolean;
  error?: string | null;
  onApply?: (scope: string) => void;
}

export function ScopeSelector({ data, loading, error, onApply }: ScopeSelectorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.scopeLabel || '');
  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="范围信息加载失败" description={error} />;
  }
  if (!data) {
    return <EmptyState title="暂无范围信息" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">我的范围</div>
        {data.editable ? (
          <button
            type="button"
            onClick={() => {
              setDraft(data.scopeLabel);
              setEditing((prev) => !prev);
            }}
            className="rounded-full bg-bg px-3 py-1 text-xs text-text-3"
          >
            {editing ? '取消' : '编辑'}
          </button>
        ) : (
          <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-3">只读</span>
        )}
      </div>
      {editing ? (
        <div className="mt-3 space-y-3 rounded-xl bg-bg px-4 py-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[84px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-1 outline-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onApply?.(draft);
                setEditing(false);
              }}
              className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white"
            >
              应用并重算
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-bg px-4 py-3 text-sm text-text-1">{data.scopeLabel}</div>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.dimensions.map((item) => (
          <div key={item.label} className="rounded-xl border border-border px-4 py-3">
            <div className="text-xs text-text-3">{item.label}</div>
            <div className="mt-1 text-sm font-medium text-text-1">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
