import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { HealthBadge } from '../../../components/common/HealthBadge';
import { useBreadcrumb } from '../../../hooks/useBreadcrumb';
import { updateSearchParam } from '../../../lib/view';
import { ErrorState } from './components/ErrorState';
import { DrillDownDrawer } from './components/DrillDownDrawer';
import { P2PlaceholderGrid } from './components/P2PlaceholderGrid';
import { QuickActionBar } from './components/QuickActionBar';
import { SourceEntryNotice } from './components/SourceEntryNotice';
import { useAssetDetail } from './hooks/useAssetDetail';
import { Layer0Identity } from './layers/Layer0Identity';
import { Layer1Personalized } from './layers/Layer1Personalized';
import { Layer2Falsifiability } from './layers/Layer2Falsifiability';
import { Layer3Decision } from './layers/Layer3Decision';
import { useAssetDetailScopeStore } from './stores/scopeStore';
import { useAssetDetailUiStore } from './stores/uiStore';
import { useAssetDetailViewStore } from './stores/viewStore';
import type { AssetDetailQueryState } from './types';
import { recordVisit } from '../../../components/nav/useRecentVisits';

function parseQueryState(searchParams: URLSearchParams): AssetDetailQueryState {
  const view = searchParams.get('view');
  const source = searchParams.get('source');

  return {
    view: view === 'producer' || view === 'operator' ? view : 'consumer',
    source:
      source === 'recommender' || source === 'alert' || source === 'compare' || source === 'direct'
        ? source
        : 'marketplace',
    scope: searchParams.get('scope'),
    useCase: searchParams.get('useCase'),
    compareWith: searchParams.get('compareWith'),
    mockError:
      searchParams.get('mockError') === '401' ||
      searchParams.get('mockError') === '403' ||
      searchParams.get('mockError') === '404' ||
      searchParams.get('mockError') === '500' ||
      searchParams.get('mockError') === 'random'
        ? (searchParams.get('mockError') as '401' | '403' | '404' | '500' | 'random')
        : null,
    chaos: searchParams.get('chaos') === '1',
  };
}

export function AssetDiagnosticDetailPage() {
  const params = useParams<{ assetId?: string; id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeAssetId = params.id || params.assetId;
  const query = useMemo(() => parseQueryState(searchParams), [searchParams]);
  const { data, loading, error, timedOut, retry } = useAssetDetail(routeAssetId, query);
  const setRouteContext = useAssetDetailViewStore((s) => s.setRouteContext);
  const hydrateScope = useAssetDetailScopeStore((s) => s.hydrateFromQuery);
  const activeLayer = useAssetDetailUiStore((s) => s.activeLayer);
  const setActiveLayer = useAssetDetailUiStore((s) => s.setActiveLayer);
  const drilldownOpen = useAssetDetailUiStore((s) => s.drilldownOpen);
  const activeDrilldownId = useAssetDetailUiStore((s) => s.activeDrilldownId);
  const openDrilldown = useAssetDetailUiStore((s) => s.openDrilldown);
  const closeDrilldown = useAssetDetailUiStore((s) => s.closeDrilldown);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const sourceAwareKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setRouteContext({ view: query.view, source: query.source, useCase: query.useCase });
    hydrateScope({ scope: query.scope, compareWith: query.compareWith });
    if (import.meta.env.DEV) {
      console.log('[asset-detail] query params', {
        assetId: routeAssetId,
        ...query,
      });
    }
  }, [hydrateScope, query, routeAssetId, setRouteContext]);

  useEffect(() => {
    if (!routeAssetId || !data?.identity.displayName) return;
    recordVisit('consumer-market-recent', {
      id: `asset-${routeAssetId}`,
      label: data.identity.displayName,
      to: `${location.pathname}${location.search}`,
      matchPath: '/marketplace/asset/:id',
    });
  }, [data?.identity.displayName, location.pathname, location.search, routeAssetId]);

  const breadcrumb = useMemo(() => {
    const label = data?.identity.displayName || routeAssetId || '诊断详情';
    return [{ label: '市集', to: '/marketplace' }, { label }];
  }, [data?.identity.displayName, routeAssetId]);
  useBreadcrumb(breadcrumb);

  const activeDrilldown = activeDrilldownId ? data?.drilldowns[activeDrilldownId] : undefined;
  const effectiveLoading = loading || recalculating;
  const errorStatus = error && error.includes('mock') ? Number(error.match(/\d{3}/)?.[0] || 500) as 401 | 403 | 404 | 500 : undefined;

  function scrollToLayer(layer: 'layer0' | 'layer1' | 'layer2' | 'layer3') {
    setActiveLayer(layer);
    const target = document.getElementById(`asset-${layer.replace('layer', 'layer-')}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOpenDrilldown(drilldownId: string, title?: string) {
    if (!data?.drilldowns[drilldownId]) return;
    openDrilldown(drilldownId);
    if (import.meta.env.DEV) {
      console.log('[asset-detail] open drilldown', { drilldownId, title });
    }
  }

  useEffect(() => {
    const nextLayer = data?.sourceAwareness?.defaultLayer;
    const nextKey = `${query.source}:${nextLayer || 'layer0'}`;
    if (!nextLayer || sourceAwareKeyRef.current === nextKey) return;
    sourceAwareKeyRef.current = nextKey;
    window.setTimeout(() => scrollToLayer(nextLayer), 80);
  }, [data?.sourceAwareness?.defaultLayer, query.source]);

  function navigateWithSearch(updateKey: string, value: string | null) {
    const nextSearch = updateSearchParam(location.search, updateKey, value);
    navigate({ pathname: location.pathname, search: nextSearch });
  }

  function handleApplyScope(scope: string) {
    setRecalculating(true);
    navigateWithSearch('scope', scope);
    setFlashMessage('已应用新范围，正在重算关键指标...');
    window.setTimeout(() => setRecalculating(false), 1200);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${location.pathname}${location.search}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setFlashMessage('已复制当前详情页链接');
      });
      return;
    }
    window.prompt('复制当前链接', url);
    setFlashMessage('已生成当前详情页链接');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={data?.identity.displayName || routeAssetId || '诊断详情页'}
          subtitle="P0 组件已接入 Layer 0-3，支持范围解读、覆盖瀑布、试算、对比与订阅决策。"
          moduleTone="market"
          action={
            data?.asset ? (
              <HealthBadge level={data.asset.health.level} score={data.asset.health.score} />
            ) : loading ? (
              <span className="text-sm text-text-3">加载中...</span>
            ) : error ? (
              <span className="text-sm text-rose-600">{error}</span>
            ) : null
          }
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <SourceEntryNotice data={data?.sourceAwareness} />
          <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
            当前按
            <span className="mx-1 font-semibold text-text-1">
              {query.view === 'producer' ? '供给视角' : query.view === 'operator' ? '运营视角' : '消费视角'}
            </span>
            浏览诊断详情；公开切换入口仅保留在顶导。
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <QuickActionBar
            onCopyLink={handleCopyLink}
            onFocusDecision={() => scrollToLayer('layer3')}
            onOpenDrilldown={() => handleOpenDrilldown('coverage_breakdown', '覆盖瀑布')}
          />
          {flashMessage ? <div className="text-sm text-module-market">{flashMessage}</div> : null}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-white p-5">
          <div className="text-sm font-semibold text-text-1">Demo 动线</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-bg px-4 py-3 text-sm text-text-2">消费方: 推荐页 → 诊断详情 → 试算 → 订阅</div>
            <div className="rounded-xl bg-bg px-4 py-3 text-sm text-text-2">供给方: 质量看板 → 诊断详情 → Layer 2 展开 → P2 派工占位</div>
            <div className="rounded-xl bg-bg px-4 py-3 text-sm text-text-2">运维方: 告警 → 诊断详情 → 稳定性曲线 → P2 工单占位</div>
          </div>
        </div>

        <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-text-3">Asset Diagnostic</div>
              <h2 className="mt-2 text-xl font-semibold text-text-1">{data?.identity.technicalName || 'diagnostic.placeholder'}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-2">
                {data?.identity.summary || '诊断详情页骨架阶段，后续将在此接入对象定义、个性化覆盖、证伪信息与订阅决策。'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/marketplace"
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
              >
                返回市集
              </Link>
              {data?.asset?.id ? (
                <Link
                  to={`/marketplace/asset/${data.asset.id}`}
                  className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  使用标准详情路由
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">view={query.view}</span>
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">source={query.source}</span>
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">scope={query.scope || '-'}</span>
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">useCase={query.useCase || '-'}</span>
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">compareWith={query.compareWith || '-'}</span>
            <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">activeLayer={activeLayer}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => scrollToLayer('layer0')} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-text-2">
              Layer 0
            </button>
            <button type="button" onClick={() => scrollToLayer('layer1')} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-text-2">
              Layer 1
            </button>
            <button type="button" onClick={() => scrollToLayer('layer2')} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-text-2">
              Layer 2
            </button>
            <button type="button" onClick={() => scrollToLayer('layer3')} className="rounded-full border border-border bg-white px-3 py-1 text-xs text-text-2">
              Layer 3
            </button>
          </div>

          {data?.identity.scenarios?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.identity.scenarios.map((scenario) => (
                <span key={scenario} className="rounded-full border border-border px-3 py-1 text-xs text-text-2">
                  {scenario}
                </span>
              ))}
            </div>
          ) : null}

          {timedOut ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-800">加载超过 3 秒</div>
              <div className="mt-1 text-sm text-amber-700">可以继续等待，也可以立即重试当前诊断请求。</div>
              <div className="mt-3">
                <button type="button" onClick={retry} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">
                  立即重试
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {error && !data ? (
          <div className="mt-6">
            <ErrorState status={errorStatus} description={error} onRetry={retry} />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6">
          <Layer0Identity
            asset={data?.asset}
            identity={data?.identity}
            query={query}
            definition={data?.definition}
            isIsNot={data?.isIsNot}
            useCaseTags={data?.useCaseTags}
            samplePreview={data?.samplePreview}
            distributionMini={data?.distributionMini}
            quantSummary={data?.quantSummary}
            recommendReason={data?.recommendReason}
            verdictBanner={data?.verdictBanner}
            supplierPanel={data?.supplierPanel}
            showSupplierPanel={query.view === 'producer'}
            glossary={data?.glossary || {}}
            loading={effectiveLoading}
            error={error}
            onOpenDrilldown={handleOpenDrilldown}
            onPrimaryAction={() => scrollToLayer('layer3')}
            onSecondaryAction={() => scrollToLayer('layer2')}
          />
          <Layer1Personalized
            scopeSelector={data?.scopeSelector}
            coverageGapAlert={data?.coverageGapAlert}
            granularityHint={data?.granularityHint}
            coverageWaterfall={data?.coverageWaterfall}
            usageSelector={data?.usageSelector}
            qualityVerdict={data?.qualityVerdict}
            qualityBadges={data?.qualityBadges}
            personalSamples={data?.personalSamples}
            peerUsage={data?.peerUsage}
            sliceDistribution={data?.sliceDistribution}
            loading={effectiveLoading}
            error={error}
            onOpenDrilldown={handleOpenDrilldown}
            onApplyScope={handleApplyScope}
          />
          <Layer2Falsifiability
            knownIssues={data?.knownIssues}
            stabilityCurve={data?.stabilityCurve}
            boundaryCases={data?.boundaryCases}
            definitionChangelog={data?.definitionChangelog}
            lineageDiagram={data?.lineageDiagram}
            baselineCompare={data?.baselineCompare}
            loading={effectiveLoading}
            error={error}
            onOpenDrilldown={handleOpenDrilldown}
          />
          <Layer3Decision
            assetId={data?.asset.id}
            subscribeImpact={data?.subscribeImpact}
            tryRun={data?.tryRun}
            compareTable={data?.compareTable}
            roiEstimator={data?.roiEstimator}
            preflightCheck={data?.preflightCheck}
            subscribeCta={data?.subscribeCta}
            compareWith={query.compareWith}
            loading={effectiveLoading}
            error={error}
            onPrimaryAction={() => scrollToLayer('layer3')}
            onCreateAb={() => setFlashMessage('AB 实验入口已创建占位，PRD-4 可继续深化联调')}
          />
          <P2PlaceholderGrid />
        </div>
      </div>
      <DrillDownDrawer open={drilldownOpen} payload={activeDrilldown} onClose={closeDrilldown} />
    </div>
  );
}
