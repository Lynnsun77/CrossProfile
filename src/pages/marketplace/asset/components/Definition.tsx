import { DefinitionTooltip } from './DefinitionTooltip';
import { EmptyState } from './EmptyState';
import type { AssetDetailDefinition, AssetDetailGlossaryTerm } from '../types';

interface DefinitionProps {
  definition?: AssetDetailDefinition;
  glossary: Record<string, AssetDetailGlossaryTerm>;
  loading?: boolean;
  error?: string | null;
}

export function Definition({ definition, glossary, loading, error }: DefinitionProps) {
  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="定义卡加载失败" description={error} />;
  }
  if (!definition) {
    return <EmptyState title="暂无定义信息" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">一句话定义</div>
      <p className="mt-2 text-base leading-7 text-text-1">{definition.oneLiner}</p>
      <p className="mt-3 text-sm leading-6 text-text-2">{definition.longText}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {definition.tooltipTermIds.map((termId) => (
          <DefinitionTooltip key={termId} termId={termId} glossary={glossary}>
            <span className="cursor-help rounded-full bg-bg px-3 py-1 text-xs text-text-2">查看{glossary[termId]?.term || termId}</span>
          </DefinitionTooltip>
        ))}
      </div>
    </div>
  );
}
