import { Tooltip } from '../../../../components/common/Tooltip';
import type { AssetDetailGlossaryTerm } from '../types';

interface DefinitionTooltipProps {
  termId: string;
  glossary: Record<string, AssetDetailGlossaryTerm>;
  children: React.ReactNode;
}

export function DefinitionTooltip({ termId, glossary, children }: DefinitionTooltipProps) {
  const item = glossary[termId];
  if (!item) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <div className="font-semibold">{item.term}</div>
          <div className="text-xs leading-5 text-white/90">{item.definition}</div>
          {item.formula ? <div className="text-xs text-white/80">公式: {item.formula}</div> : null}
          {item.source ? <div className="text-xs text-white/70">来源: {item.source}</div> : null}
        </div>
      }
      maxWidth={320}
    >
      <span>{children}</span>
    </Tooltip>
  );
}
