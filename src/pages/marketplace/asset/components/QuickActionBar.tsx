interface QuickActionBarProps {
  onCopyLink: () => void;
  onFocusDecision: () => void;
  onOpenDrilldown: () => void;
}

export function QuickActionBar({ onCopyLink, onFocusDecision, onOpenDrilldown }: QuickActionBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onCopyLink} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2">复制链接</button>
      <button type="button" onClick={onFocusDecision} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2">跳到决策层</button>
      <button type="button" onClick={onOpenDrilldown} className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2">打开覆盖下钻</button>
    </div>
  );
}
