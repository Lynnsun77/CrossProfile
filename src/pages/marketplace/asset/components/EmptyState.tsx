interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = '暂无数据',
  description = '当前 mock 未提供该模块所需数据。',
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-center">
      <div className="text-sm font-medium text-text-2">{title}</div>
      <p className="mt-1 text-sm text-text-3">{description}</p>
    </div>
  );
}
