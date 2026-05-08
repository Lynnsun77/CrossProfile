import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getProducerDashboardConsumptionRankingApi,
  getProducerDashboardGapTopApi,
  getProducerDashboardHealthHeatmapApi,
  getProducerDashboardPipelineOverviewApi,
  getProducerDashboardRevenueLoopApi,
  getProducerDashboardSupplyCoverageApi,
} from '../../api/dashboard';
import { OpportunityCard } from '../../components/common/OpportunityCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Waterfall } from '../../components/common/Waterfall';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatNumber } from '../../lib/format';
import { updateSearchParam } from '../../lib/view';
import { mockKpis, mockOpportunities } from '../../mock';
import { useGlobalState } from '../../store/globalState';
import type {
  FeatureDomain,
  ProducerDashboardPipelineOverview,
  ProducerDashboardSupplyCoverage,
  ProducerRevenueLoop,
  QualityHealthHeatmapPoint,
  QualityValueRankingItem,
  DemandGap,
} from '../../types';
import { FEATURE_DOMAINS } from '../../types';

function domainLabel(domain: FeatureDomain) {
  if (domain === 'user_profile') return '用户画像';
  if (domain === 'merchant_profile') return '商家画像';
  if (domain === 'product_profile') return '商品画像';
  if (domain === 'content_profile') return '内容画像';
  if (domain === 'transaction') return '交易';
  return '跨域';
}

function pipelineStatusLabel(status: keyof ProducerDashboardPipelineOverview['runStatusCounts']) {
  if (status === 'completed') return '已完成';
  if (status === 'running') return '运行中';
  if (status === 'failed') return '失败';
  return '待启动';
}

function buildSearch(search: string, updates: Record<string, string | null | undefined>) {
  const params = new URLSearchParams(search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') params.delete(key);
    else params.set(key, value);
  });
  const next = params.toString();
  return next ? `?${next}` : '';
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrencyWan(value: number) {
  return `${(value / 10000).toFixed(1)} 万`;
}

export function DashboardHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const latestKpi = mockKpis[mockKpis.length - 1];
  const healthValue = Math.round(latestKpi.avg_health);
  const params = new URLSearchParams(location.search);
  const domainFilter =
    params.get('domain') && FEATURE_DOMAINS.includes(params.get('domain') as FeatureDomain)
      ? (params.get('domain') as FeatureDomain)
      : 'all';
  const timeWindow = params.get('time') === '7d' || params.get('time') === '90d' ? params.get('time') : '30d';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<ProducerDashboardSupplyCoverage | null>(null);
  const [pipelineOverview, setPipelineOverview] = useState<ProducerDashboardPipelineOverview | null>(null);
  const [healthHeatmap, setHealthHeatmap] = useState<QualityHealthHeatmapPoint[]>([]);
  const [consumptionRanking, setConsumptionRanking] = useState<QualityValueRankingItem[]>([]);
  const [revenueLoop, setRevenueLoop] = useState<ProducerRevenueLoop | null>(null);
  const [gapTop, setGapTop] = useState<DemandGap[]>([]);

  useBreadcrumb([{ label: '大盘', to: '/dashboard' }]);

  useEffect(() => {
    if (currentView !== 'producer') return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getProducerDashboardSupplyCoverageApi(),
      getProducerDashboardPipelineOverviewApi(),
      getProducerDashboardHealthHeatmapApi(),
      getProducerDashboardConsumptionRankingApi({ limit: 8 }),
      getProducerDashboardRevenueLoopApi({ limit: 4 }),
      getProducerDashboardGapTopApi({ limit: 6 }),
    ])
      .then(([coverageRes, pipelineRes, heatmapRes, rankingRes, revenueRes, gapRes]) => {
        if (cancelled) return;
        setCoverage(coverageRes);
        setPipelineOverview(pipelineRes);
        setHealthHeatmap(heatmapRes.items);
        setConsumptionRanking(rankingRes.items);
        setRevenueLoop(revenueRes);
        setGapTop(gapRes.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '供给方大盘加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentView]);

  const filteredHeatmap = useMemo(
    () =>
      healthHeatmap.filter((item) => (domainFilter === 'all' ? true : item.featureDomain === domainFilter)).slice(0, 6),
    [domainFilter, healthHeatmap]
  );

  const filteredRanking = useMemo(
    () =>
      consumptionRanking
        .filter((item) => (domainFilter === 'all' ? true : item.featureDomain === domainFilter))
        .slice(0, 6),
    [consumptionRanking, domainFilter]
  );

  const filteredGapTop = useMemo(
    () => gapTop.filter((item) => (domainFilter === 'all' ? true : item.relatedDomain === domainFilter)).slice(0, 5),
    [domainFilter, gapTop]
  );

  const coverageBreakdown = useMemo(
    () =>
      (coverage?.domainBreakdown ?? []).filter((item) => (domainFilter === 'all' ? true : item.domain === domainFilter)),
    [coverage, domainFilter]
  );

  const healthRingOption = {
    series: [
      {
        type: 'pie',
        radius: ['70%', '88%'],
        silent: true,
        label: { show: false },
        data: [
          { value: healthValue, itemStyle: { color: '#10B981' } },
          { value: 100 - healthValue, itemStyle: { color: '#E5E7EB' } },
        ],
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: { text: `${healthValue}`, fill: '#0B1220', fontSize: 32, fontWeight: 700 },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: { text: '健康度', fill: '#8A94A6', fontSize: 12 },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={
          currentView === 'consumer' ? '大盘' : currentView === 'producer' ? '供给方大盘' : '运营大盘'
        }
        subtitle={
          currentView === 'consumer'
            ? '健康圆环 + 机会卡流 + 归因瀑布'
            : currentView === 'producer'
              ? '覆盖率、流水线状态、健康度、收益与需求缺口概览。'
              : '查看运营侧相关模块与核心入口。'
        }
        moduleTone="dashboard"
      />

      {currentView === 'producer' && (
        <>
          <div className="mb-6 flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-text-1">筛选条件</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['7d', '30d', '90d'] as const).map((window) => (
                <button
                  key={window}
                  type="button"
                  onClick={() =>
                    navigate({
                      pathname: location.pathname,
                      search: buildSearch(location.search, { time: window, view: 'producer' }),
                    })
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    timeWindow === window ? 'bg-blue-600 text-white' : 'border border-border bg-white text-text-2'
                  }`}
                >
                  近 {window.slice(0, -1)} 天
                </button>
              ))}
              <select
                value={domainFilter}
                onChange={(e) =>
                  navigate({
                    pathname: location.pathname,
                    search: buildSearch(location.search, {
                      domain: e.target.value === 'all' ? null : e.target.value,
                      view: 'producer',
                    }),
                  })
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
              >
                <option value="all">全部域</option>
                {FEATURE_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domainLabel(domain)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="rounded-card border border-dashed border-border bg-surface px-4 py-10 text-sm text-text-3">
              正在加载供给视角大盘...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-text-1">供给覆盖率</div>
                      <div className="mt-1 text-sm text-text-2">聚合需求缺口覆盖情况，帮助确认现有供给与目标需求的匹配程度。</div>
                    </div>
                    <div className="rounded-xl bg-bg px-4 py-3 text-right">
                      <div className="text-xs text-text-3">覆盖率</div>
                      <div className="mt-1 text-2xl font-semibold text-text-1">{formatPercent(coverage?.coverageRate ?? 0)}</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div className="rounded-xl bg-bg p-4">
                      <div className="text-xs text-text-3">已覆盖缺口</div>
                      <div className="mt-2 text-2xl font-semibold text-text-1">{formatNumber(coverage?.coveredGapCount ?? 0)}</div>
                    </div>
                    <div className="rounded-xl bg-bg p-4">
                      <div className="text-xs text-text-3">总缺口数</div>
                      <div className="mt-2 text-2xl font-semibold text-text-1">{formatNumber(coverage?.totalGapCount ?? 0)}</div>
                    </div>
                    <div className="rounded-xl bg-bg p-4">
                      <div className="text-xs text-text-3">活跃特征</div>
                      <div className="mt-2 text-2xl font-semibold text-text-1">{formatNumber(coverage?.activeFeatureCount ?? 0)}</div>
                    </div>
                    <div className="rounded-xl bg-bg p-4">
                      <div className="text-xs text-text-3">全量特征</div>
                      <div className="mt-2 text-2xl font-semibold text-text-1">{formatNumber(coverage?.totalFeatureCount ?? 0)}</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {coverageBreakdown.map((item) => (
                      <div key={item.domain} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-text-1">{domainLabel(item.domain)}</div>
                          <div className="text-xs text-text-3">{formatPercent(item.coverageRate)}</div>
                        </div>
                        <div className="mt-2 text-xs text-text-3">
                          缺口覆盖 {item.coveredGapCount}/{item.totalGapCount}，特征供给 {item.featureCount}
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(item.coverageRate * 100, 12)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-text-1">流水线状态</div>
                      <div className="mt-1 text-sm text-text-2">快速查看各产线运行状态，并跳转到工坊继续排查。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: '/factory/pipelines',
                          search: buildSearch(location.search, { view: 'producer' }),
                        })
                      }
                      className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white"
                    >
                      进入产线总览
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {pipelineOverview
                      ? (Object.entries(pipelineOverview.runStatusCounts) as Array<
                          [keyof ProducerDashboardPipelineOverview['runStatusCounts'], number]
                        >).map(([status, count]) => (
                          <div key={status} className="rounded-xl bg-bg p-4">
                            <div className="text-xs text-text-3">{pipelineStatusLabel(status)}</div>
                            <div className="mt-2 text-2xl font-semibold text-text-1">{formatNumber(count)}</div>
                          </div>
                        ))
                      : null}
                  </div>

                  <div className="mt-5 space-y-3">
                    {(pipelineOverview?.attentionRuns ?? []).slice(0, 4).map((run) => (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() =>
                          navigate({
                            pathname: '/factory/pipelines',
                            search: buildSearch(location.search, { view: 'producer', featureId: run.featureId }),
                          })
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left transition hover:border-module-workshop/30"
                      >
                        <div>
                          <div className="text-sm font-medium text-text-1">{run.feature.name}</div>
                          <div className="mt-1 text-xs text-text-3">
                            {run.pipelineLabel} · 当前阶段 {run.currentStageName}
                          </div>
                        </div>
                        <div className="text-right text-xs text-text-3">
                          <div>{pipelineStatusLabel(run.runStatus)}</div>
                          <div className="mt-1">{run.featureId}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">我的健康度热力图</div>
                  <div className="mt-1 text-sm text-text-2">优先显示当前域下低分特征，点击可直达单特征归因分析。</div>
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredHeatmap.map((item) => (
                      <button
                        key={item.featureId}
                        type="button"
                        onClick={() =>
                          navigate({
                            pathname: `/drilldown/${item.featureId}`,
                            search: buildSearch(location.search, { view: 'producer', tab: 'attribution' }),
                          })
                        }
                        className="rounded-xl border border-border bg-white p-4 text-left transition hover:border-module-dashboard/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-text-1">{item.featureName}</div>
                            <div className="mt-1 text-xs text-text-3">{domainLabel(item.featureDomain)} · {item.ownerTeamName}</div>
                          </div>
                          <div className="rounded-lg bg-bg px-3 py-2 text-right">
                            <div className="text-[11px] text-text-3">健康分</div>
                            <div className="mt-1 text-lg font-semibold text-text-1">{item.score}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-text-3">
                          <div className="rounded-lg bg-bg p-2">覆盖率 {formatPercent(item.coverageRate)}</div>
                          <div className="rounded-lg bg-bg p-2">稳定性 {formatPercent(item.stabilityRate)}</div>
                          <div className="rounded-lg bg-bg p-2">时效 {item.freshnessHours}h</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="text-lg font-semibold text-text-1">被消费排行</div>
                  <div className="mt-1 text-sm text-text-2">结合收益归因榜单挑出高复用特征，便于继续下钻分析。</div>
                  <div className="mt-5 space-y-3">
                    {filteredRanking.map((item) => (
                      <div key={item.featureId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-text-3">#{item.rank}</span>
                            <button
                              type="button"
                              onClick={() =>
                                navigate({
                                  pathname: `/drilldown/${item.featureId}`,
                                  search: buildSearch(location.search, { view: 'producer', tab: 'attribution' }),
                                })
                              }
                              className="truncate text-left text-sm font-medium text-text-1 hover:text-module-dashboard"
                            >
                              {item.featureName}
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-text-3">
                            {domainLabel(item.featureDomain)} · {item.totalConsumptionTeams} 个消费团队
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-text-1">{formatCurrencyWan(item.totalRevenue)}</div>
                          <div className="mt-1 text-xs text-text-3">GMV 归因</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-text-1">收益闭环</div>
                      <div className="mt-1 text-sm text-text-2">从业务收益 KPI 回跳到归因工作台，继续查看特征级明细。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: '/quality/attribution',
                          search: buildSearch(location.search, { view: 'producer' }),
                        })
                      }
                      className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white"
                    >
                      查看收益归因
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {(revenueLoop?.kpis ?? []).map((item) => (
                      <div key={item.key} className="rounded-xl bg-bg p-4">
                        <div className="text-xs text-text-3">{item.label}</div>
                        <div className="mt-2 text-2xl font-semibold text-text-1">
                          {item.unit === '万元'
                            ? `${item.value.toFixed(1)} 万元`
                            : item.unit === '%'
                              ? `${item.value.toFixed(1)}%`
                              : item.unit === 'x'
                                ? `${item.value.toFixed(2)} x`
                                : `${item.value.toFixed(1)} bp`}
                        </div>
                        <div className="mt-1 text-xs text-emerald-600">较基线 +{item.delta}%</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {(revenueLoop?.topConsumers ?? []).map((item) => (
                      <div key={item.featureId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-text-1">{item.featureName}</div>
                          <div className="mt-1 text-xs text-text-3">{item.ownerTeamName}</div>
                        </div>
                        <div className="text-right text-xs text-text-3">
                          <div>{item.metricBreakdown.GMV ?? (item.totalRevenue / 10000).toFixed(1)} 万 GMV</div>
                          <div className="mt-1">{item.totalConsumptionTeams} 个团队复用</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-text-1">需求缺口洞察</div>
                      <div className="mt-1 text-sm text-text-2">聚焦高业务价值缺口，直达缺口分析继续认领与排序筛选。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: '/recommender/gap-analysis',
                          search: buildSearch(location.search, { view: 'producer', domain: domainFilter === 'all' ? null : domainFilter }),
                        })
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      打开缺口分析
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {filteredGapTop.map((gap) => (
                      <div key={gap.id} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-text-1">{gap.title}</div>
                            <div className="mt-1 text-xs text-text-3">
                              {gap.scenario ?? '未分类'} · {domainLabel(gap.relatedDomain)} · {gap.requestedByTeam}
                            </div>
                          </div>
                          <div className="rounded-lg bg-bg px-3 py-2 text-right">
                            <div className="text-[11px] text-text-3">预估价值</div>
                            <div className="mt-1 text-lg font-semibold text-text-1">{gap.expectedBusinessValue} 万</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                pathname: '/recommender/gap-analysis',
                                search: buildSearch(location.search, {
                                  view: 'producer',
                                  domain: gap.relatedDomain,
                                  scenario: gap.scenario ?? null,
                                  highlightGap: gap.id,
                                }),
                              })
                            }
                            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                          >
                            查看缺口详情
                          </button>
                          {gap.relatedFeatureIds?.[0] ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate({
                                  pathname: `/drilldown/${gap.relatedFeatureIds?.[0]}`,
                                  search: buildSearch(location.search, { view: 'producer', tab: 'fusion' }),
                                })
                              }
                              className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                            >
                              查看关联特征
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {currentView === 'operator' && (
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-lg font-semibold text-text-1">运营视角内容建设中</div>
          <div className="mt-2 text-sm text-text-2">
            你可以先前往资产目录、缺口分析或质量治理模块继续查看。
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(location.search);
                next.set('view', 'producer');
                next.set('scope', 'owned');
                navigate({ pathname: '/catalog/my-assets', search: `?${next.toString()}` });
              }}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-dashboard/20 hover:text-module-dashboard"
            >
              前往资产目录
            </button>
            <button
              type="button"
              onClick={() => navigate({ pathname: '/recommender/gap-analysis', search: updateSearchParam(location.search, 'view', currentView === 'operator' ? 'operator' : 'producer') })}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-dashboard/20 hover:text-module-dashboard"
            >
              前往缺口分析
            </button>
            <button
              type="button"
              onClick={() => navigate({ pathname: '/quality/governance', search: updateSearchParam(location.search, 'view', currentView) })}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-dashboard/20 hover:text-module-dashboard"
            >
              前往质量治理
            </button>
          </div>
        </div>
      )}

      {currentView === 'consumer' && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-3 text-lg font-semibold text-text-1">资产健康圆环</div>
          <ReactECharts option={healthRingOption} style={{ height: 260 }} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-bg p-3">
              <div className="text-text-3">跨域占比</div>
              <div className="mt-1 font-semibold text-text-1">{(latestKpi.cross_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-bg p-3">
              <div className="text-text-3">运行实验</div>
              <div className="mt-1 font-semibold text-text-1">{latestKpi.ab_running}</div>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-3 text-lg font-semibold text-text-1">归因瀑布</div>
          <Waterfall
            data={[
              { name: '基线GMV', value: 1200 },
              { name: '人群扩容', value: 180 },
              { name: '券提效', value: 240 },
              { name: '跨域联动', value: 160 },
              { name: '成本抵扣', value: -110 },
            ]}
          />
        </div>
      </div>

          <div className="rounded-card border border-border bg-surface p-6">
            <div className="mb-4 text-lg font-semibold text-text-1">机会卡流</div>
            <div className="space-y-3">
              {mockOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} onClick={() => navigate(`/dashboard/opp/${opp.id}`)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
