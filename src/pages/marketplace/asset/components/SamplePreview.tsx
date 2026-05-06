import type { AssetDetailSamplePreview } from '../types';
import { EmptyState } from './EmptyState';

interface SamplePreviewProps {
  items?: AssetDetailSamplePreview[];
  loading?: boolean;
  error?: string | null;
}

export function SamplePreview({ items, loading, error }: SamplePreviewProps) {
  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="样例预览加载失败" description={error} />;
  if (!items?.length) return <EmptyState title="暂无样例预览" />;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">样例对象预览</div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-bg px-4 py-3">
            <div className="text-sm font-medium text-text-1">{item.title}</div>
            <div className="mt-1 text-xs text-text-3">{item.subtitle}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] text-text-2">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
