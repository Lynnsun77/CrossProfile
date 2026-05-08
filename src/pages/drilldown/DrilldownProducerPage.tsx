import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getDrilldownFusionComparisonApi,
  getDrilldownFusionEvaluationResultApi,
  getDrilldownFusionGraphApi,
  getDrilldownQualityAttributionApi,
  runDrilldownFusionEvaluationApi,
} from '../../api/drilldown';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatDate, formatLargeNumber } from '../../lib/format';
import { useGlobalState } from '../../store/globalState';
import type {
  AppView,
  DrilldownQualityAttributionAnalysis,
  FusionEvaluationResult,
  FusionGraphData,
  FusionQualityCompareRow,
  GovernanceSeverity,
} from '../../types';

type DrilldownTab = 'attribution' | 'fusion';

function buildSearch(search: string, updates: Record<string, string | null | undefined>) {
  const params = new URLSearchParams(search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') params.delete(key);
    else params.set(key, value);
  });
  const next = params.toString();
  return next ? `?${next}` : '';
}

function labelOfView(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function domainLabel(value?: string | null) {
  if (value === 'user_profile') return '用户画像';
  if (value === 'merchant_profile') return '商家画像';
  if (value === 'product_profile') return '商品画像';
  if (value === 'content_profile') return '内容画像';
  if (value === 'transaction') return '交易';
  if (value === 'cross_domain') return '跨域';
  return '--';
}

function featureTypeLabel(value?: string | null) {
  if (value === 'rule') return '规则';
  if (value === 'sequence') return '序列';
  if (value === 'algo') return '算法';
  if (value === 'vector') return '向量';
  if (value === 'llm_intent') return 'LLM';
  return '--';
}

function severityLabel(value: GovernanceSeverity) {
  if (value === 'critical') return '严重';
  if (value === 'high') return '高';
  if (value === 'medium') return '中';
  return '低';
}

function severityClass(value: GovernanceSeverity) {
  if (value === 'critical') return 'bg-rose-50 text-rose-700';
  if (value === 'high') return 'bg-orange-50 text-orange-700';
  if (value === 'medium') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function relationTypeLabel(value: FusionQualityCompareRow['relationType']) {
  if (value === 'derived_from') return '派生';
  if (value === 'paired_with') return '配对';
  if (value === 'overlaps_with') return '重叠';
  if (value === 'replaces') return '替代';
  return '目标特征';
}

function decisionLabel(value: FusionEvaluationResult['decision']) {
  if (value === 'promote') return '建议推广';
  if (value === 'observe') return '继续观察';
  return '建议回滚';
}

function decisionClass(value: FusionEvaluationResult['decision']) {
  if (value === 'promote') return 'bg-emerald-50 text-emerald-700';
  if (value === 'observe') return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

function RestrictedPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const availableViews = useGlobalState((s) => s.availableViews);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="text-lg font-semibold text-text-1">单特征下钻以供给侧诊断为主</div>
      <div className="mt-2 text-sm text-text-2">
        归因分析与融合关系页需要 `producer` 或 `operator` 视角，消费视角保留原消费链路，不在此页展开。
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!availableViews.includes('producer')}
          onClick={() => {
            if (!availableViews.includes('producer')) return;
            setCurrentView('producer');
            navigate({
              pathname: location.pathname,
              search: buildSearch(location.search, { view: 'producer' }),
            });
          }}
          className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          切换到供给视角
        </button>
      </div>
    </div>
  );
}

export function DrilldownProducerPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const tab: DrilldownTab = location.search.includes('tab=fusion') ? 'fusion' : 'attribution';

  const [loading, setLoading] = useState(true);
  const [runningEval, setRunningEval] = useState(false);
  const [refreshingEval, setRefreshingEval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DrilldownQualityAttributionAnalysis | null>(null);
  const [fusionGraph, setFusionGraph] = useState<FusionGraphData | null>(null);
  const [compareRows, setCompareRows] = useState<FusionQualityCompareRow[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<FusionEvaluationResult | null>(null);

  useBreadcrumb([
    { label: '单特征下钻', to: id ? `/drilldown/${id}` : '/drilldown' },
    { label: id ?? '详情' },
  ]);

  useEffect(() => {
    if (!id || currentView === 'consumer') return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getDrilldownQualityAttributionApi(id),
      getDrilldownFusionGraphApi(id),
      getDrilldownFusionComparisonApi(id),
    ])
      .then(([analysisRes, graphRes, compareRes]) => {
        if (cancelled) return;
        setAnalysis(analysisRes);
        setFusionGraph(graphRes);
        setCompareRows(compareRes);
        setSelectedCompareIds(compareRes.filter((item) => item.featureId !== id).slice(0, 2).map((item) => item.featureId));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '特征下钻加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentView, id]);

  const handleRunEvaluation = async () => {
    if (!id) return;
    setRunningEval(true);
    setError(null);
    try {
      const run = await runDrilldownFusionEvaluationApi(id, {
        comparedFeatureIds: selectedCompareIds,
      });
      if (!run) {
        setError('融合测评触发失败');
        return;
      }
      const result = await getDrilldownFusionEvaluationResultApi(run.evalRunId);
      setEvaluationResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '融合测评触发失败');
    } finally {
      setRunningEval(false);
    }
  };

  const handleRefreshEvaluation = async () => {
    if (!evaluationResult) return;
    setRefreshingEval(true);
    setError(null);
    try {
      const result = await getDrilldownFusionEvaluationResultApi(evaluationResult.evalRunId);
      setEvaluationResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '测评结果刷新失败');
    } finally {
      setRefreshingEval(false);
    }
  };

  const targetFeature = analysis?.feature;
  const compareCandidates = useMemo(
    () => compareRows.filter((item) => item.featureId !== id),
    [compareRows, id]
  );
  const maxTrendScore = useMemo(
    () => Math.max(1, ...(analysis?.qualityTrend.map((item) => item.score) ?? [1])),
    [analysis]
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={targetFeature ? `${targetFeature.name} 下钻分析` : '单特征下钻'}
          subtitle="producer 视角下接入归因分析与融合关系两个 Tab，并兼容旧 drilldown 路径"
          moduleTone="dashboard"
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前为
          <span className="mx-1 font-semibold text-text-1">{labelOfView(currentView)}</span>
          ，单特征下钻继续按该视角呈现归因和融合分析内容。
        </div>

        {currentView === 'consumer' ? (
          <RestrictedPanel />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {([
                { key: 'attribution', label: '归因分析' },
                { key: 'fusion', label: '融合关系' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: location.pathname,
                      search: buildSearch(location.search, { tab: item.key, view: currentView }),
                    })
                  }
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === item.key ? 'bg-blue-600 text-white' : 'border border-border bg-white text-text-2'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            {loading ? (
              <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">正在加载单特征下钻...</div>
            ) : !analysis || !targetFeature ? (
              <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">未找到对应特征。</div>
            ) : (
              <>
                <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-4">
                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="text-xs text-text-3">特征类型</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{featureTypeLabel(targetFeature.type)}</div>
                  </div>
                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="text-xs text-text-3">归属域</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{domainLabel(targetFeature.domain)}</div>
                  </div>
                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="text-xs text-text-3">最新健康度</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{analysis.latestSnapshot?.score ?? '--'}</div>
                  </div>
                  <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                    <div className="text-xs text-text-3">消费团队</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{targetFeature.attributionSummary?.totalConsumptionTeams ?? 0}</div>
                  </div>
                </section>

                {tab === 'attribution' ? (
                  <div className="space-y-6">
                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-text-1">质量趋势</div>
                            <div className="mt-1 text-sm text-text-2">近 30 天质量分、覆盖率与稳定性变化。</div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                pathname: `/quality/attribution/${targetFeature.id}`,
                                search: buildSearch(location.search, { view: 'producer' }),
                              })
                            }
                            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white"
                          >
                            查看归因卡
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                          {analysis.qualityTrend.map((item) => (
                            <div key={item.date} className="rounded-xl border border-border bg-white p-3">
                              <div className="text-xs text-text-3">{formatDate(item.date)}</div>
                              <div className="mt-2 text-lg font-semibold text-text-1">{item.score}</div>
                              <div className="mt-3 h-2 rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-module-dashboard"
                                  style={{ width: `${Math.max(12, (item.score / maxTrendScore) * 100)}%` }}
                                />
                              </div>
                              <div className="mt-2 space-y-1 text-[11px] text-text-3">
                                <div>覆盖率 {(item.coverageRate * 100).toFixed(1)}%</div>
                                <div>稳定性 {(item.stabilityRate * 100).toFixed(1)}%</div>
                                <div>告警 {item.alertCount}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="text-lg font-semibold text-text-1">分群准确率分析</div>
                        <div className="mt-1 text-sm text-text-2">按典型人群切片展示准确率差异，定位需要重点回收的分群。</div>
                        <div className="mt-5 space-y-3">
                          {analysis.segmentAccuracy.map((item) => (
                            <div key={item.segment} className="rounded-xl border border-border bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-text-1">{item.segment}</div>
                                  <div className="mt-1 text-xs text-text-3">样本量 {formatLargeNumber(item.sampleSize)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-text-1">{(item.accuracyRate * 100).toFixed(1)}%</div>
                                  <div className={`mt-1 text-xs ${item.deltaVsBaseline >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.deltaVsBaseline >= 0 ? '+' : ''}{(item.deltaVsBaseline * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
                      <div className="text-lg font-semibold text-text-1">根因定位</div>
                      <div className="mt-1 text-sm text-text-2">从质量、流水线、融合与覆盖四类根因卡，直接跳转到后续治理动作。</div>
                      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {analysis.rootCauses.map((item) => (
                          <div key={item.id} className="rounded-xl border border-border bg-white p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-text-1">{item.title}</div>
                                <div className="mt-2 text-sm text-text-2">{item.summary}</div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(item.severity)}`}>
                                {severityLabel(item.severity)}
                              </span>
                            </div>
                            <div className="mt-3 text-sm text-text-2">{item.impactScope}</div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.relatedPipelineRunId ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate({
                                      pathname: '/factory/pipelines',
                                      search: buildSearch(location.search, {
                                        view: 'producer',
                                        featureId: targetFeature.id,
                                      }),
                                    })
                                  }
                                  className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                                >
                                  查看流水线
                                </button>
                              ) : null}
                              {item.relatedTicketId ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate({
                                      pathname: `/quality/tickets/${item.relatedTicketId}`,
                                      search: buildSearch(location.search, { view: 'producer' }),
                                    })
                                  }
                                  className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                                >
                                  打开治理工单
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate({
                                      pathname: '/quality/governance',
                                      search: buildSearch(location.search, { view: 'producer', feature: targetFeature.id }),
                                    })
                                  }
                                  className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                                >
                                  进入治理看板
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="text-lg font-semibold text-text-1">融合关系图谱</div>
                        <div className="mt-1 text-sm text-text-2">用节点角色与关系类型表示主特征的上下游、配对和替代关系。</div>
                        <div className="mt-5 space-y-3">
                          {(fusionGraph?.nodes ?? []).map((node) => (
                            <div key={node.featureId} className="rounded-xl border border-border bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-text-1">{node.featureName}</div>
                                  <div className="mt-1 text-xs text-text-3">
                                    {featureTypeLabel(node.featureType)} · {domainLabel(node.featureDomain)} · {node.role}
                                  </div>
                                </div>
                                <div className="rounded-lg bg-bg px-3 py-2 text-sm font-semibold text-text-1">{node.healthScore}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-xl bg-bg p-4">
                          <div className="text-sm font-medium text-text-1">关系列表</div>
                          <div className="mt-3 space-y-2">
                            {(fusionGraph?.relations ?? []).map((relation) => (
                              <div key={relation.id} className="rounded-lg bg-white px-3 py-2 text-sm text-text-2">
                                {relation.sourceFeatureId} → {relation.targetFeatureId} · {relationTypeLabel(relation.relationType)} · 置信度 {(relation.confidence * 100).toFixed(0)}%
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-text-1">融合质量对比</div>
                            <div className="mt-1 text-sm text-text-2">支持选择对比特征后触发融合测评，并刷新结果。</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={runningEval}
                              onClick={() => void handleRunEvaluation()}
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                              {runningEval ? '测评中...' : '触发融合测评'}
                            </button>
                            <button
                              type="button"
                              disabled={!evaluationResult || refreshingEval}
                              onClick={() => void handleRefreshEvaluation()}
                              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 disabled:opacity-50"
                            >
                              {refreshingEval ? '刷新中...' : '刷新结果'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                          <div className="grid grid-cols-[48px_1.2fr_100px_120px_120px_110px] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                            <div />
                            <div>特征</div>
                            <div>关系</div>
                            <div>健康分</div>
                            <div>收益</div>
                            <div>消费团队</div>
                          </div>
                          {compareRows.map((row) => (
                            <div key={row.featureId} className="grid grid-cols-[48px_1.2fr_100px_120px_120px_110px] items-center gap-3 border-t border-border bg-white px-4 py-4 text-sm">
                              <div>
                                {row.featureId === id ? null : (
                                  <input
                                    type="checkbox"
                                    checked={selectedCompareIds.includes(row.featureId)}
                                    onChange={(e) =>
                                      setSelectedCompareIds((current) =>
                                        e.target.checked
                                          ? [...current, row.featureId]
                                          : current.filter((item) => item !== row.featureId)
                                      )
                                    }
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-medium text-text-1">{row.featureName}</div>
                                <div className="mt-1 text-xs text-text-3">{featureTypeLabel(row.featureType)} · {domainLabel(row.featureDomain)}</div>
                              </div>
                              <div className="text-text-2">{relationTypeLabel(row.relationType)}</div>
                              <div className="font-semibold text-text-1">{row.qualitySnapshot.score}</div>
                              <div className="text-text-1">{(row.attributedRevenue / 10000).toFixed(1)} 万</div>
                              <div className="text-text-2">{row.consumptionTeams}</div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 text-xs text-text-3">
                          已选择 {selectedCompareIds.length} 个候选特征，默认从图谱中预选最相关的 2 个。
                        </div>
                      </div>
                    </section>

                    {evaluationResult ? (
                      <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-text-1">融合测评结果</div>
                            <div className="mt-1 text-sm text-text-2">{evaluationResult.summary}</div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm font-medium ${decisionClass(evaluationResult.decision)}`}>
                            {decisionLabel(evaluationResult.decision)}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div className="rounded-xl bg-bg p-4">
                            <div className="text-xs text-text-3">综合得分</div>
                            <div className="mt-2 text-2xl font-semibold text-text-1">{evaluationResult.overallScore}</div>
                          </div>
                          <div className="rounded-xl bg-bg p-4">
                            <div className="text-xs text-text-3">对比特征数</div>
                            <div className="mt-2 text-2xl font-semibold text-text-1">{evaluationResult.comparedFeatureIds.length}</div>
                          </div>
                          <div className="rounded-xl bg-bg p-4">
                            <div className="text-xs text-text-3">创建时间</div>
                            <div className="mt-2 text-sm font-semibold text-text-1">{formatDate(evaluationResult.createdAt)}</div>
                          </div>
                          <div className="rounded-xl bg-bg p-4">
                            <div className="text-xs text-text-3">完成时间</div>
                            <div className="mt-2 text-sm font-semibold text-text-1">{formatDate(evaluationResult.finishedAt)}</div>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {evaluationResult.dimensions.map((item) => (
                            <div key={item.dimension} className="rounded-xl border border-border bg-white p-4">
                              <div className="text-sm font-medium text-text-1">{item.dimension}</div>
                              <div className="mt-2 text-xl font-semibold text-text-1">{(item.score * 100).toFixed(1)}</div>
                              <div className="mt-1 text-xs text-text-3">基线 {(item.baselineScore ?? 0) * 100}</div>
                              <div className="mt-2 text-sm text-text-2">{item.summary}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {compareCandidates.length > 0 ? (
                      <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
                        <div className="text-lg font-semibold text-text-1">候选特征快捷下钻</div>
                        <div className="mt-1 text-sm text-text-2">从融合关系页切换到其他候选特征，继续查看归因或融合情况。</div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          {compareCandidates.map((item) => (
                            <button
                              key={item.featureId}
                              type="button"
                              onClick={() =>
                                navigate({
                                  pathname: `/drilldown/${item.featureId}`,
                                  search: buildSearch(location.search, { view: 'producer', tab: 'fusion' }),
                                })
                              }
                              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                            >
                              {item.featureName}
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
