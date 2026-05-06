import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  claimProducerGapApi,
  getProducerDemandHeatmapApi,
  getProducerGapListApi,
  getProducerUnmatchedQueryRankingApi,
  unclaimProducerGapApi,
  type DemandGapSortBy,
} from '../../api/recommender';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatNumber } from '../../lib/format';
import { useGlobalState } from '../../store/globalState';
import type { AppView, DemandGap, DemandHeatmapCell, FeatureDomain, UnmatchedQueryRankingItem } from '../../types';
import { DEMAND_SCENARIOS, DEMAND_STATUSES, FEATURE_DOMAINS } from '../../types';

type DomainFilter = 'all' | FeatureDomain;
type StatusFilter = 'all' | DemandGap['status'];

function buildSearch(search: string, updates: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams(search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') params.delete(key);
    else params.set(key, String(value));
  });
  const next = params.toString();
  return next ? `?${next}` : '';
}

function labelOfView(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function domainLabel(domain: FeatureDomain) {
  if (domain === 'user_profile') return '用户画像';
  if (domain === 'merchant_profile') return '商家画像';
  if (domain === 'product_profile') return '商品画像';
  if (domain === 'content_profile') return '内容画像';
  if (domain === 'transaction') return '交易';
  return '跨域';
}

function sourceLabel(source: DemandGap['source'] | UnmatchedQueryRankingItem['source']) {
  if (source === 'consumer_feedback') return '消费反馈';
  if (source === 'sales_request') return '销售需求';
  if (source === 'strategy_project') return '策略项目';
  if (source === 'governance') return '治理回流';
  return 'AI 发现';
}

function statusLabel(status: DemandGap['status']) {
  if (status === 'open') return '待认领';
  if (status === 'claimed') return '已认领';
  if (status === 'planning') return '规划中';
  if (status === 'in_progress') return '进行中';
  if (status === 'completed') return '已完成';
  return '已拒绝';
}

function statusClass(status: DemandGap['status']) {
  if (status === 'open') return 'bg-amber-50 text-amber-700';
  if (status === 'claimed') return 'bg-blue-50 text-blue-700';
  if (status === 'planning') return 'bg-slate-100 text-slate-700';
  if (status === 'in_progress') return 'bg-indigo-50 text-indigo-700';
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  return 'bg-rose-50 text-rose-700';
}

function sortLabel(sortBy: DemandGapSortBy) {
  if (sortBy === 'due_at') return '按截止时间';
  if (sortBy === 'unmatched_query_count') return '按未匹配查询量';
  return '按业务价值';
}

function RestrictedPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const availableViews = useGlobalState((s) => s.availableViews);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="text-lg font-semibold text-text-1">缺口分析以供给视角为主</div>
      <div className="mt-2 text-sm text-text-2">
        当前是消费视角，缺口认领、缺口状态回写与下钻分析只在 `producer` 或 `operator` 视角开放。
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!availableViews.includes('producer')}
          onClick={() => {
            if (!availableViews.includes('producer')) return;
            setCurrentView('producer');
            navigate({ pathname: '/recommender/gap-analysis', search: buildSearch(location.search, { view: 'producer' }) });
          }}
          className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          切换到供给视角
        </button>
      </div>
    </div>
  );
}

export function GapAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const params = new URLSearchParams(location.search);
  const scenarioParam = params.get('scenario');
  const scenario: 'all' | (typeof DEMAND_SCENARIOS)[number] =
    scenarioParam && DEMAND_SCENARIOS.includes(scenarioParam as (typeof DEMAND_SCENARIOS)[number])
      ? (scenarioParam as (typeof DEMAND_SCENARIOS)[number])
      : 'all';
  const domain: DomainFilter =
    params.get('domain') && FEATURE_DOMAINS.includes(params.get('domain') as FeatureDomain)
      ? (params.get('domain') as FeatureDomain)
      : 'all';
  const status: StatusFilter =
    params.get('status') && DEMAND_STATUSES.includes(params.get('status') as DemandGap['status'])
      ? (params.get('status') as DemandGap['status'])
      : 'all';
  const keyword = params.get('keyword') ?? '';
  const sortBy: DemandGapSortBy =
    params.get('sortBy') === 'due_at' || params.get('sortBy') === 'unmatched_query_count'
      ? (params.get('sortBy') as DemandGapSortBy)
      : 'business_value';
  const page = Math.max(Number(params.get('page') ?? '1') || 1, 1);
  const pageSize = params.get('pageSize') === '5' ? 5 : 10;
  const highlightGap = params.get('highlightGap') ?? '';

  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [loading, setLoading] = useState(true);
  const [mutatingGapId, setMutatingGapId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heatmap, setHeatmap] = useState<DemandHeatmapCell[]>([]);
  const [unmatchedQueries, setUnmatchedQueries] = useState<UnmatchedQueryRankingItem[]>([]);
  const [gaps, setGaps] = useState<DemandGap[]>([]);
  const [total, setTotal] = useState(0);

  useBreadcrumb([
    { label: '缺口分析', to: '/recommender/gap-analysis' },
  ]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    if (currentView === 'consumer') return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getProducerDemandHeatmapApi(),
      getProducerUnmatchedQueryRankingApi(10),
      getProducerGapListApi({
        scenario: scenario === 'all' ? 'all' : scenario,
        domain,
        status,
        keyword,
        sortBy,
        page,
        pageSize,
      }),
    ])
      .then(([heatmapRes, unmatchedRes, gapRes]) => {
        if (cancelled) return;
        setHeatmap(heatmapRes.items);
        setUnmatchedQueries(unmatchedRes.items);
        setGaps(gapRes.items);
        setTotal(gapRes.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '缺口分析加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentView, domain, keyword, page, pageSize, scenario, sortBy, status]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const heatmapCells = useMemo(() => {
    const cellMap = new Map<string, DemandHeatmapCell>();
    heatmap.forEach((cell) => cellMap.set(`${cell.scenario}_${cell.domain}`, cell));
    return cellMap;
  }, [heatmap]);

  const reloadCurrentPage = async () => {
    const [heatmapRes, gapRes] = await Promise.all([
      getProducerDemandHeatmapApi(),
      getProducerGapListApi({
        scenario: scenario === 'all' ? 'all' : scenario,
        domain,
        status,
        keyword,
        sortBy,
        page,
        pageSize,
      }),
    ]);
    setHeatmap(heatmapRes.items);
    setGaps(gapRes.items);
    setTotal(gapRes.total);
  };

  const handleClaimToggle = async (gap: DemandGap) => {
    setMutatingGapId(gap.id);
    setError(null);
    try {
      if (gap.claimedByUserId === currentUser.id) {
        await unclaimProducerGapApi(gap.id, {
          operatorUserId: currentUser.id,
          operatorUserName: currentUser.name,
          operatorTeamName: currentUser.team,
        });
      } else {
        await claimProducerGapApi(gap.id, {
          operatorUserId: currentUser.id,
          operatorUserName: currentUser.name,
          operatorTeamName: currentUser.team,
        });
      }
      await reloadCurrentPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : '缺口状态更新失败');
    } finally {
      setMutatingGapId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="缺口分析"
          subtitle="需求热力图、未匹配查询排行、缺口列表与认领/取消认领"
          moduleTone="dashboard"
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前为
          <span className="mx-1 font-semibold text-text-1">{labelOfView(currentView)}</span>
          ，缺口认领与治理动作继续按该视角控制。
        </div>

        {currentView === 'consumer' ? (
          <RestrictedPanel />
        ) : (
          <>
            {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-lg font-semibold text-text-1">需求热力图</div>
                  <div className="mt-1 text-sm text-text-2">点击任意格子直接联动下方缺口列表的场景与域筛选。</div>
                </div>
                <div className="text-xs text-text-3">当前排序: {sortLabel(sortBy)} · 当前页 {page}/{totalPages}</div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[120px_repeat(6,minmax(0,1fr))] bg-bg text-xs font-medium text-text-3">
                  <div className="border-r border-border px-3 py-3">场景 \ 域</div>
                  {FEATURE_DOMAINS.map((item) => (
                    <div key={item} className="border-l border-border px-3 py-3 text-center">
                      {domainLabel(item)}
                    </div>
                  ))}
                </div>
                {DEMAND_SCENARIOS.map((scenarioItem) => (
                  <div key={scenarioItem} className="grid grid-cols-[120px_repeat(6,minmax(0,1fr))] border-t border-border bg-white">
                    <div className="border-r border-border px-3 py-4 text-sm font-medium text-text-1">{scenarioItem}</div>
                    {FEATURE_DOMAINS.map((domainItem) => {
                      const cell = heatmapCells.get(`${scenarioItem}_${domainItem}`);
                      const active = scenario === scenarioItem && domain === domainItem;
                      return (
                        <button
                          key={`${scenarioItem}_${domainItem}`}
                          type="button"
                          onClick={() =>
                            navigate({
                              pathname: location.pathname,
                              search: buildSearch(location.search, {
                                scenario: active ? null : scenarioItem,
                                domain: active ? null : domainItem,
                                page: 1,
                                view: currentView,
                              }),
                            })
                          }
                          className={`min-h-[98px] border-l border-border px-3 py-3 text-left transition ${
                            active ? 'bg-module-dashboard/5' : 'hover:bg-bg'
                          }`}
                        >
                          <div className="text-lg font-semibold text-text-1">{formatNumber(cell?.demandCount ?? 0)}</div>
                          <div className="mt-1 text-[11px] text-text-3">开放 {cell?.openGapCount ?? 0} / 认领中 {cell?.claimedGapCount ?? 0}</div>
                          <div className="mt-2 text-[11px] text-text-3">价值 {(cell?.totalBusinessValue ?? 0).toFixed(0)} 万</div>
                          <div className="mt-1 text-[11px] text-text-3">未匹配查询 {formatNumber(cell?.unmatchedQueryCount ?? 0)}</div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="text-lg font-semibold text-text-1">未匹配查询排行</div>
                <div className="mt-1 text-sm text-text-2">点击查询可把场景、域和关键词回填到缺口列表中。</div>
                <div className="mt-5 space-y-3">
                  {unmatchedQueries.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        navigate({
                          pathname: location.pathname,
                          search: buildSearch(location.search, {
                            scenario: item.scenario,
                            domain: item.domain,
                            keyword: item.queryText,
                            page: 1,
                            view: currentView,
                          }),
                        })
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left transition hover:border-module-dashboard/25"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-text-3">#{index + 1}</span>
                          <span className="truncate text-sm font-medium text-text-1">{item.queryText}</span>
                        </div>
                        <div className="mt-1 text-xs text-text-3">
                          {item.scenario} · {domainLabel(item.domain)} · {sourceLabel(item.source)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-text-3">
                        <div>{formatNumber(item.searchCount)} 次</div>
                        <div className="mt-1">{item.weeklyDelta >= 0 ? '+' : ''}{(item.weeklyDelta * 100).toFixed(1)}%</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-text-1">需求缺口列表</div>
                    <div className="mt-1 text-sm text-text-2">支持筛选、排序、分页，并对待认领/已认领状态做动作边界控制。</div>
                  </div>
                  <div className="text-xs text-text-3">共 {formatNumber(total)} 条</div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_180px]">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      navigate({
                        pathname: location.pathname,
                        search: buildSearch(location.search, { keyword: draftKeyword || null, page: 1, view: currentView }),
                      });
                    }}
                  >
                    <input
                      value={draftKeyword}
                      onChange={(e) => setDraftKeyword(e.target.value)}
                      placeholder="搜索缺口标题、查询词、提需团队"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
                    />
                    <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">
                      搜索
                    </button>
                  </form>

                  <select
                    value={status}
                    onChange={(e) =>
                      navigate({
                        pathname: location.pathname,
                        search: buildSearch(location.search, {
                          status: e.target.value === 'all' ? null : e.target.value,
                          page: 1,
                          view: currentView,
                        }),
                      })
                    }
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
                  >
                    <option value="all">全部状态</option>
                    {DEMAND_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {statusLabel(item)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      navigate({
                        pathname: location.pathname,
                        search: buildSearch(location.search, { sortBy: e.target.value, page: 1, view: currentView }),
                      })
                    }
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
                  >
                    <option value="business_value">按业务价值</option>
                    <option value="due_at">按截止时间</option>
                    <option value="unmatched_query_count">按未匹配查询量</option>
                  </select>

                  <select
                    value={pageSize}
                    onChange={(e) =>
                      navigate({
                        pathname: location.pathname,
                        search: buildSearch(location.search, { pageSize: Number(e.target.value), page: 1, view: currentView }),
                      })
                    }
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
                  >
                    <option value={10}>每页 10 条</option>
                    <option value={5}>每页 5 条</option>
                  </select>
                </div>

                {loading ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载缺口列表...</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {gaps.map((gap) => {
                      const canClaim = gap.status === 'open';
                      const canUnclaim = gap.status === 'claimed' && gap.claimedByUserId === currentUser.id;
                      const highlighted = highlightGap === gap.id;
                      return (
                        <div
                          key={gap.id}
                          className={`rounded-xl border p-4 ${
                            highlighted ? 'border-module-dashboard bg-module-dashboard/5' : 'border-border bg-white'
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-medium text-text-1">{gap.title}</div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(gap.status)}`}>{statusLabel(gap.status)}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-3">
                                <span>{gap.id}</span>
                                <span>{gap.scenario ?? '未分类'}</span>
                                <span>{domainLabel(gap.relatedDomain)}</span>
                                <span>{sourceLabel(gap.source)}</span>
                                <span>提需团队 {gap.requestedByTeam}</span>
                              </div>
                              <div className="mt-3 text-sm text-text-2">
                                查询词: {gap.queryText ?? '--'}，未匹配查询量 {formatNumber(gap.unmetQueryCount ?? 0)}
                              </div>
                              <div className="mt-2 text-sm text-text-2">
                                当前负责人: {gap.claimedByUserName ?? '--'} / {gap.claimedByTeamName ?? '--'}，截止时间 {gap.dueAt ?? '--'}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="rounded-xl bg-bg px-4 py-3 text-right">
                                <div className="text-xs text-text-3">预估业务价值</div>
                                <div className="mt-1 text-2xl font-semibold text-text-1">{gap.expectedBusinessValue} 万</div>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                {(canClaim || canUnclaim) ? (
                                  <button
                                    type="button"
                                    disabled={mutatingGapId === gap.id}
                                    onClick={() => void handleClaimToggle(gap)}
                                    className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                                  >
                                    {mutatingGapId === gap.id ? '处理中...' : canClaim ? '认领缺口' : '取消认领'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-400"
                                  >
                                    {gap.status === 'in_progress'
                                      ? '进行中不可取消'
                                      : gap.status === 'completed'
                                        ? '已完成'
                                        : gap.status === 'planning'
                                          ? '规划中'
                                          : '当前状态不可操作'}
                                  </button>
                                )}
                                {gap.relatedFeatureIds?.[0] ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate({
                                        pathname: `/drilldown/${gap.relatedFeatureIds?.[0]}`,
                                        search: buildSearch(location.search, { view: 'producer', tab: 'attribution' }),
                                      })
                                    }
                                    className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                                  >
                                    查看单特征下钻
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {gaps.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-center text-sm text-text-3">当前筛选下暂无缺口。</div> : null}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-xs text-text-3">
                    当前页 {page} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        navigate({
                          pathname: location.pathname,
                          search: buildSearch(location.search, { page: page - 1, view: currentView }),
                        })
                      }
                      className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() =>
                        navigate({
                          pathname: location.pathname,
                          search: buildSearch(location.search, { page: page + 1, view: currentView }),
                        })
                      }
                      className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
