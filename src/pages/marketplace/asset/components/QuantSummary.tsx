import { DefinitionTooltip } from './DefinitionTooltip';
import { EmptyState } from './EmptyState';
import type { AssetDetailGlossaryTerm, AssetDetailQuantMetric } from '../types';

interface QuantSummaryProps {
  metrics?: AssetDetailQuantMetric[];
  glossary: Record<string, AssetDetailGlossaryTerm>;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
  loading?: boolean;
  error?: string | null;
}

const trendLabel = {
  up: '↑',
  down: '↓',
  flat: '→',
};

export function QuantSummary({ metrics, glossary, onOpenDrilldown, loading, error }: QuantSummaryProps) {
  if (loading) {
    return <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-bg" />)}</div>;
  }
  if (error) {
    return <EmptyState title="定量摘要加载失败" description={error} />;
  }
  if (!metrics?.length) {
    return <EmptyState title="暂无定量摘要" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const content = (
          <div className="rounded-2xl border border-border bg-white p-4 transition hover:border-module-market/30">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-text-3">{metric.label}</div>
              <span className="text-sm text-module-market">{trendLabel[metric.trend]}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-text-1">{metric.value}</div>
            <div className="mt-2 text-sm text-text-2">{metric.hint}</div>
          </div>
        );
        const inner = metric.drilldownId ? (
          <button type="button" className="w-full text-left" onClick={() => onOpenDrilldown(metric.drilldownId!, metric.label)}>
            {content}
          </button>
        ) : (
          content
        );
        if (!metric.tooltipTermId) return <div key={metric.key}>{inner}</div>;
        return (
          <DefinitionTooltip key={metric.key} termId={metric.tooltipTermId} glossary={glossary}>
            {inner}
          </DefinitionTooltip>
        );
      })}
    </div>
  );
}
