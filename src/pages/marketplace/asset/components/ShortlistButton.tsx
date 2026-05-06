import { useAssetDetailShortlistStore } from '../stores/shortlistStore';

interface ShortlistButtonProps {
  assetId?: string;
}

export function ShortlistButton({ assetId }: ShortlistButtonProps) {
  const toggle = useAssetDetailShortlistStore((s) => s.toggle);
  const assetIds = useAssetDetailShortlistStore((s) => s.assetIds);
  if (!assetId) return null;
  const active = assetIds.includes(assetId);
  return (
    <button type="button" onClick={() => toggle(assetId)} className={`rounded-lg px-4 py-2 text-sm font-medium ${active ? 'bg-amber-100 text-amber-700' : 'border border-border bg-white text-text-2'}`}>
      {active ? '已加入 Shortlist' : '加入 Shortlist'}
    </button>
  );
}
