import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import App from './App';
import { MarketAgent } from './pages/market/MarketAgent';
import { MarketFeatureP2 } from './pages/market/MarketFeatureP2';
import { CrowdDiagnosisPage } from './pages/CrowdDiagnosis';
import { MarketWorkbench } from './pages/market/MarketWorkbench';
import { FoundryHome } from './pages/foundry/FoundryHome';
import { FoundryResult } from './pages/foundry/FoundryResult';
import { FoundryFeature } from './pages/foundry/FoundryFeature';
import { FoundryExport } from './pages/foundry/FoundryExport';
import { FactoryPipelines } from './pages/foundry/FactoryPipelines';
import { FactoryFeatureConfigPage } from './pages/foundry/FactoryFeatureConfigPage';
import { FactorySimilaritySearchPage } from './pages/foundry/FactorySimilaritySearchPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { DashboardOppDetail } from './pages/dashboard/DashboardOppDetail';
import { OpsPlaceholder } from './pages/monitor/OpsPlaceholder';
import { MyPage } from './pages/MyPage';
import {
  MyAgentHistoryPage,
  MyAttributionPage,
  MyFavoritesPage,
  MyStrategiesPage,
  MySubscribersPage,
  MySubscriptionsPage,
} from './pages/my/MySubPages';
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { CatalogMyAssetsPage } from './pages/catalog/CatalogMyAssetsPage';
import { ModulePlaceholder } from './pages/placeholder/ModulePlaceholder';
import { MultiViewPlaceholder } from './pages/placeholder/MultiViewPlaceholder';
import { GapAnalysisPage } from './pages/recommender/GapAnalysisPage';
import { DrilldownProducerPage } from './pages/drilldown/DrilldownProducerPage';
import {
  QualityAutoBacktestPage,
  QualityConsumerBadgesPage,
  QualityAttributionDetailPage,
  QualityAttributionPage,
  QualityConsumerLanding,
  QualityGovernancePage,
  QualityHealthScorePage,
  QualityHubEntry,
  QualityP2PlaceholderPage,
  QualitySelfReviewPage,
  QualityTicketDetailPage,
  QualityTicketsPage,
} from './pages/quality/QualityWorkspace';
import {
  QualityLLMJudgePage,
  QualityLLMJudgeTemplatesPage,
  QualitySurveyPage,
} from './pages/quality/QualitySemanticPages';
import { legacyRoutes, legacyRoutePatterns } from './lib/runtimeTokens';
import { buildLandingUrlForView } from './lib/view';
import { useGlobalState } from './store/globalState';

const LazyMarketplaceAssetDetail = lazy(() =>
  import('./pages/marketplace/MarketplaceAssetDetail').then((module) => ({ default: module.MarketplaceAssetDetail })),
);
const LazyRecommendPage = lazy(() =>
  import('./features/recommend/pages/RecommendPage').then((module) => ({ default: module.RecommendPage })),
);

function withLazy(element: ReactNode) {
  return <Suspense fallback={<div className="p-6 text-sm text-text-3">加载中...</div>}>{element}</Suspense>;
}

function LegacySectionRedirect({ from, to }: { from: string; to: string }) {
  const location = useLocation();
  const rest = location.pathname.startsWith(from) ? location.pathname.slice(from.length) : location.pathname;
  const normalizedRest = rest.startsWith('/') ? rest : `/${rest}`;
  const nextPath = `${to}${normalizedRest}`.replace(/\/{2,}/g, '/');
  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
}

function FactoryIndexRedirect() {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);
  const defaultView = useGlobalState((s) => s.defaultView);
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  const resolvedView = view === 'producer' || view === 'consumer' || view === 'operator' ? view : currentView || defaultView;
  if (resolvedView === 'producer') {
    return <Navigate to={`/factory/pipelines${location.search}${location.hash}`} replace />;
  }
  return <Navigate to={`/factory/tracking${location.search}${location.hash}`} replace />;
}

function RootIndexRedirect() {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);
  return <Navigate to={`${buildLandingUrlForView(currentView, location.search)}${location.hash}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RootIndexRedirect /> },
      { path: 'my', element: <MyPage /> },
      { path: 'my/favorites', element: <MyFavoritesPage /> },
      { path: 'my/subscriptions', element: <MySubscriptionsPage /> },
      { path: 'my/strategies', element: <MyStrategiesPage /> },
      { path: 'my/agent-history', element: <MyAgentHistoryPage /> },
      { path: 'my/attribution', element: <MyAttributionPage /> },
      { path: 'my/subscribers', element: <MySubscribersPage /> },

      // Canonical routes (per spec.md)
      {
        path: 'marketplace',
        children: [
          { index: true, element: <MarketplacePage /> },
          { path: 'recommend', element: withLazy(<LazyRecommendPage />) },
          { path: 'asset/:id', element: withLazy(<LazyMarketplaceAssetDetail />) },
          { path: ':assetId', element: withLazy(<LazyMarketplaceAssetDetail />) },
          { path: 'agent', element: <MarketAgent /> },
          { path: 'crowd/:id', element: <CrowdDiagnosisPage /> },
          { path: 'feature/:id', element: <MarketFeatureP2 /> },
          { path: 'workbench', element: <MarketWorkbench /> },
          { path: 'action/:id', element: <MarketWorkbench /> },
          { path: 'action/new', element: <MarketWorkbench /> },
          { path: 'tasks', element: <MarketWorkbench /> },
        ],
      },
      {
        path: 'factory',
        children: [
          { index: true, element: <FactoryIndexRedirect /> },
          { path: 'tracking', element: <FoundryHome /> },
          { path: 'pack', element: <FoundryHome /> },
          { path: 'result/:packId', element: <FoundryResult /> },
          { path: 'feature/:id', element: <FoundryFeature /> },
          { path: 'export/:packId', element: <FoundryExport /> },
          { path: 'pipelines', element: <FactoryPipelines /> },
          { path: 'features/:id/config', element: <FactoryFeatureConfigPage /> },
          { path: 'similarity-search', element: <FactorySimilaritySearchPage /> },
        ]
      },
      {
        path: 'dashboard',
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'health', element: <DashboardHome /> },
          { path: 'opp/:id', element: <DashboardOppDetail /> },
          // Legacy: old /dashboard/* URLs collapse to /dashboard (keep known subroutes above working)
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ]
      },
      {
        // Ops placeholder per spec.md
        path: 'monitor',
        children: [
          { index: true, element: <OpsPlaceholder /> },
          // Preserve older /monitor/* URLs by redirecting into /dashboard/*
          { path: '*', element: <LegacySectionRedirect from="/monitor" to="/dashboard" /> },
        ]
      },

      {
        path: 'catalog',
        children: [
          { path: 'my-assets', element: <CatalogMyAssetsPage /> },
          { path: 'features/new', element: <MultiViewPlaceholder /> },
          { path: 'features/:id/edit', element: <MultiViewPlaceholder /> },
          { path: 'features/:id/publish-flow', element: <MultiViewPlaceholder /> },
          { path: 'evaluations/:eval_id', element: <MultiViewPlaceholder /> },
        ],
      },
      {
        path: 'recommender',
        children: [{ path: 'gap-analysis', element: <GapAnalysisPage /> }],
      },
      {
        path: 'quality',
        children: [
          { index: true, element: <QualityHubEntry /> },
          { path: 'precheck', element: <QualityConsumerLanding /> },
          { path: 'badges', element: <QualityConsumerBadgesPage /> },
          { path: 'governance', element: <QualityGovernancePage /> },
          { path: 'auto-backtest', element: <QualityAutoBacktestPage /> },
          { path: 'self-review', element: <QualitySelfReviewPage /> },
          { path: 'llm-judge', element: <QualityLLMJudgePage /> },
          { path: 'llm-judge/templates', element: <QualityLLMJudgeTemplatesPage /> },
          { path: 'survey', element: <QualitySurveyPage /> },
          { path: 'health-score/:feature_id', element: <QualityHealthScorePage /> },
          { path: 'human-eval', element: <QualityP2PlaceholderPage title="CQC 人工评估" routeLabel="/quality/human-eval" /> },
          {
            path: 'eval-orchestrator',
            element: <QualityP2PlaceholderPage title="评测任务编排" routeLabel="/quality/eval-orchestrator" />,
          },
          { path: 'tickets', element: <QualityTicketsPage /> },
          { path: 'tickets/:id', element: <QualityTicketDetailPage /> },
          { path: 'attribution', element: <QualityAttributionPage /> },
          { path: 'attribution/:feature_id', element: <QualityAttributionDetailPage /> },
        ],
      },
      {
        path: 'drilldown',
        children: [
          { path: ':id', element: <DrilldownProducerPage /> },
          { path: 'features/:id', element: <DrilldownProducerPage /> },
        ],
      },

      { path: 'placeholder/:module', element: <ModulePlaceholder /> },

      // Legacy routes - preserve old URLs by redirecting to canonical ones.
      { path: legacyRoutePatterns.marketWildcard.slice(1), element: <LegacySectionRedirect from={legacyRoutes.marketBase} to="/marketplace" /> },
      { path: 'foundry/*', element: <LegacySectionRedirect from="/foundry" to="/factory" /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ]
  }
]);
