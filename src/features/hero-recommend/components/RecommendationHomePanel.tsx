import { useEffect, useRef } from 'react';
import { DeployConfigModal } from '../../recommend/components/DeployConfigModal';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { AnalysisLoadingPanel } from './AnalysisLoadingPanel';
import { FallbackActionSection } from './FallbackActionSection';
import { IntentSummaryPanel } from './IntentSummaryPanel';
import { RecommendationDetailModal } from './RecommendationDetailModal';
import { RecommendationEmptyState } from './RecommendationEmptyState';
import { RecommendationErrorState } from './RecommendationErrorState';
import { RecommendationHero } from './RecommendationHero';
import { RecommendationSection } from './RecommendationSection';
import { RecommendationSummaryPanel } from './RecommendationSummaryPanel';
import { ResultLayerHint } from './ResultLayerHint';
import { focusRecommendationHeroInput } from './heroInput';

export function RecommendationHomePanel() {
  const analysisPhase = useHeroRecommendStore((s) => s.analysisPhase);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const deploy = useHeroRecommendStore((s) => s.deploy);
  const closeDeploy = useHeroRecommendStore((s) => s.closeDeploy);
  const setDeployField = useHeroRecommendStore((s) => s.setDeployField);
  const submitDeploy = useHeroRecommendStore((s) => s.submitDeploy);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (analysisPhase === 'ready' && resultRef.current && typeof resultRef.current.scrollIntoView === 'function') {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisPhase]);

  const handleRetryDescribe = () => {
    focusRecommendationHeroInput();
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

      <RecommendationDetailModal />
      <DeployConfigModal
        title="一键配置"
        ariaLabel="一键配置"
        successToastText="已提交配置请求"
        workbenchLabel="去工作台编辑 →"
        bindings={{
          deploy,
          closeDeploy,
          setDeployField,
          submitDeploy,
        }}
      />
    </div>
  );
}
