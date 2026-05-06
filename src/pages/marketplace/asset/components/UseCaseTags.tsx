import { EmptyState } from './EmptyState';

interface UseCaseTagsProps {
  tags?: string[];
  loading?: boolean;
  error?: string | null;
}

export function UseCaseTags({ tags, loading, error }: UseCaseTagsProps) {
  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="场景标签加载失败" description={error} />;
  if (!tags?.length) return <EmptyState title="暂无场景标签" />;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">典型使用场景</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-text-2">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
