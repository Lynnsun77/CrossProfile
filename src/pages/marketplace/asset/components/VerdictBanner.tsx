import { EmptyState } from './EmptyState';
import type { AssetDetailVerdictBanner } from '../types';

interface VerdictBannerProps {
  banner?: AssetDetailVerdictBanner;
  loading?: boolean;
  error?: string | null;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const styleMap = {
  recommended: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  conditional: 'border-amber-200 bg-amber-50 text-amber-900',
  not_recommended: 'border-rose-200 bg-rose-50 text-rose-900',
};

export function VerdictBanner({ banner, loading, error, onPrimaryAction, onSecondaryAction }: VerdictBannerProps) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="Verdict 加载失败" description={error} />;
  }
  if (!banner) {
    return <EmptyState title="暂无 Verdict" />;
  }

  return (
    <div className={`rounded-2xl border p-5 ${styleMap[banner.level]}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] opacity-75">System Verdict</div>
          <div className="mt-2 text-xl font-semibold">{banner.title}</div>
          <p className="mt-2 text-sm leading-6 opacity-90">{banner.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {banner.reasons.map((reason) => (
              <span key={reason} className="rounded-full bg-white/70 px-3 py-1">{reason}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPrimaryAction} className="rounded-lg bg-text-1 px-4 py-2 text-sm font-medium text-white">
            {banner.primaryAction}
          </button>
          <button type="button" onClick={onSecondaryAction} className="rounded-lg border border-current/20 bg-white/70 px-4 py-2 text-sm font-medium">
            {banner.secondaryAction}
          </button>
        </div>
      </div>
    </div>
  );
}
