import { useEffect, useMemo, useRef } from 'react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { AnalysisLoadingPanel } from './AnalysisLoadingPanel';
import { FallbackActionSection } from './FallbackActionSection';
import { IntentSummaryPanel } from './IntentSummaryPanel';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationDetailModal } from './RecommendationDetailModal';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { RecommendationErrorState } from './RecommendationErrorState';
import { RecommendationHero } from './RecommendationHero';
import { RecommendationSection } from './RecommendationSection';
import { RecommendationSummaryPanel } from './RecommendationSummaryPanel';
import { ResultLayerHint } from './ResultLayerHint';

export function RecommendationHomePanel() {
  const analysisPhase = useHeroRecommendStore((s) => s.analysisPhase);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (analysisPhase === 'ready' && resultRef.current && typeof resultRef.current.scrollIntoView === 'function') {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisPhase]);

  const defaultCards = useMemo(() => {
    if (!grouped) return [];
    return [...grouped.ready, ...grouped.adaptable];
  }, [grouped]);

  const handleRetryDescribe = () => {
    const heroInput = document.getElementById('recommendation-hero-input');
    if (heroInput && typeof heroInput.scrollIntoView === 'function') {
      heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.setTimeout(() => {
      if (heroInput instanceof HTMLTextAreaElement) {
        heroInput.focus();
      }
    }, 180);
  };

  return (
    <div id="recommendation-home-panel" className="space-y-5">
      <RecommendationHero />

      {analysisPhase === 'analyzing' ? <AnalysisLoadingPanel /> : null}
      {analysisPhase === 'error' ? <RecommendationErrorState /> : null}
      {analysisPhase === 'empty' ? <RecommendationEmptyState /> : null}

      {analysisPhase === 'ready' && grouped ? (
        <div ref={resultRef} className="space-y-4">
          <IntentSummaryPanel />
          <RecommendationSummaryPanel />
          <ResultLayerHint />
          <RecommendationSection
            group="ready"
            cards={grouped.ready}
            emptyFallback="暂未筛出可直接复用的资产，建议先看下方可加工方案或发起建设需求。"
          />
          <RecommendationSection
            group="adaptable"
            cards={grouped.adaptable}
            emptyFallback="暂未筛出可加工后使用的资产，若当前诉求较定制，可继续补充更多业务描述。"
          />
          <FallbackActionSection
            active={grouped.fallback.show}
            reason={grouped.fallback.reason}
            onRetryDescribe={handleRetryDescribe}
          />
        </div>
      ) : null}

      {analysisPhase === 'idle' && defaultCards.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-500">
            你可以先描述诉求进入智能推荐，也可以先浏览系统沉淀的默认推荐。
          </div>
          <div>
            <h3 className="mb-3 text-base font-semibold text-slate-700">默认推荐</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {defaultCards.map((card) => (
                <RecommendationCard key={card.id} card={card} emphasized={card.group === 'ready'} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <RecommendationDetailModal />
    </div>
  );
}
