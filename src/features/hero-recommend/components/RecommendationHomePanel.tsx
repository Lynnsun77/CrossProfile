import { useEffect, useMemo, useRef } from 'react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { AnalysisLoadingPanel } from './AnalysisLoadingPanel';
import { IntentSummaryPanel } from './IntentSummaryPanel';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationDetailModal } from './RecommendationDetailModal';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { RecommendationErrorState } from './RecommendationErrorState';
import { RecommendationHero } from './RecommendationHero';
import { RecommendationSection } from './RecommendationSection';
import { RecommendationSummaryPanel } from './RecommendationSummaryPanel';

export function RecommendationHomePanel() {
  const analysisPhase = useHeroRecommendStore((s) => s.analysisPhase);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (analysisPhase === 'ready' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisPhase]);

  const defaultCards = useMemo(() => {
    if (!grouped) return [];
    return [...grouped.priority, ...grouped.expandable];
  }, [grouped]);

  return (
    <div className="space-y-5">
      <RecommendationHero />

      {analysisPhase === 'analyzing' ? <AnalysisLoadingPanel /> : null}

      {analysisPhase === 'error' ? <RecommendationErrorState /> : null}

      {analysisPhase === 'empty' ? <RecommendationEmptyState /> : null}

      {analysisPhase === 'ready' && grouped ? (
        <div ref={resultRef} className="space-y-4">
          <IntentSummaryPanel />
          <RecommendationSummaryPanel />
          <RecommendationSection group="priority" cards={grouped.priority} />
          <RecommendationSection group="expandable" cards={grouped.expandable} />
          <RecommendationSection group="similar" cards={grouped.similar} />
        </div>
      ) : null}

      {analysisPhase === 'idle' && defaultCards.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-500">
            你可以描述目标生成推荐，也可先浏览系统推荐内容。
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold text-slate-700">系统推荐</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {defaultCards.map((c) => (
                <RecommendationCard key={c.id} card={c} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <RecommendationDetailModal />
    </div>
  );
}
