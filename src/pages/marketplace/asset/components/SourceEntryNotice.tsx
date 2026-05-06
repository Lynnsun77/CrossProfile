import type { AssetDetailSourceAwareness } from '../types';

interface SourceEntryNoticeProps {
  data?: AssetDetailSourceAwareness;
}

export function SourceEntryNotice({ data }: SourceEntryNoticeProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-module-market/20 bg-module-market/5 p-4">
      <div className="text-sm font-semibold text-text-1">{data.title}</div>
      <div className="mt-1 text-sm text-text-2">{data.description}</div>
    </div>
  );
}
