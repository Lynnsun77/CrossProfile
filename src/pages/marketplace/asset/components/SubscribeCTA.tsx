import { useState } from 'react';
import { useAssetDetailShortlistStore } from '../stores/shortlistStore';
import type { AssetDetailSubscribeCta } from '../types';
import { EmptyState } from './EmptyState';

interface SubscribeCTAProps {
  data?: AssetDetailSubscribeCta;
  assetId?: string;
  loading?: boolean;
  error?: string | null;
  onPrimaryAction?: () => void;
}

export function SubscribeCTA({ data, assetId, loading, error, onPrimaryAction }: SubscribeCTAProps) {
  const toggle = useAssetDetailShortlistStore((s) => s.toggle);
  const assetIds = useAssetDetailShortlistStore((s) => s.assetIds);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return <div className="h-36 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="订阅 CTA 加载失败" description={error} />;
  }
  if (!data || !assetId) {
    return <EmptyState title="暂无订阅 CTA" />;
  }

  const shortlisted = assetIds.includes(assetId);

  return (
    <div className="rounded-2xl border border-module-market/20 bg-module-market/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-text-1">{data.title}</div>
          <p className="mt-1 text-sm text-text-2">{data.subtitle}</p>
          {message ? <div className="mt-2 text-xs text-module-market">{message}</div> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrimaryAction} className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            {data.primaryAction}
          </button>
          <button
            type="button"
            onClick={() => {
              toggle(assetId);
              setMessage(shortlisted ? '已从待选中移除' : '已加入待选');
            }}
            className="rounded-lg border border-module-market/20 bg-white px-4 py-2 text-sm font-medium text-module-market"
          >
            {shortlisted ? '移出待选' : data.secondaryAction}
          </button>
        </div>
      </div>
    </div>
  );
}
