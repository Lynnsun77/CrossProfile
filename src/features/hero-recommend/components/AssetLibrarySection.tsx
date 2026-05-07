import type { ReactNode } from 'react';

interface Props {
  controls: ReactNode;
  children: ReactNode;
}

export function AssetLibrarySection({ controls, children }: Props) {
  return (
    <section className="space-y-4" aria-label="更多可浏览资产">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">更多可浏览资产</h2>
          <p className="text-sm leading-6 text-slate-500">以下为未进入本次推荐结果分层的其他资产，可继续浏览探索。</p>
        </div>
      </div>
      {controls}
      <div>{children}</div>
    </section>
  );
}
