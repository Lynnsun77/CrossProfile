import type { ReactNode } from 'react';

interface LayerPlaceholderCardProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function LayerPlaceholderCard({ title, subtitle, children }: LayerPlaceholderCardProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-1">{title}</div>
          <p className="mt-1 text-sm text-text-3">{subtitle}</p>
        </div>
        <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-text-3">PRD-1 骨架</span>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-4 text-sm text-text-3">
        {children}
      </div>
    </section>
  );
}
