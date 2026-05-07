import type { ReactNode } from 'react';

interface Props {
  controls?: ReactNode;
  children: ReactNode;
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = '更多可浏览资产';
const DEFAULT_DESCRIPTION = '以下为未进入本次推荐结果分层的其他资产，可继续浏览探索。';

export function AssetLibrarySection({
  controls,
  children,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: Props) {
  return (
    <section id="asset-library-section" className="space-y-4" aria-label="更多可浏览资产">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div
            className="h-7 w-1 rounded-full bg-module-market"
            style={{ boxShadow: 'var(--page-header-glow-market)' }}
            aria-hidden
          />
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {controls ? <div>{controls}</div> : null}
      <div>{children}</div>
    </section>
  );
}
