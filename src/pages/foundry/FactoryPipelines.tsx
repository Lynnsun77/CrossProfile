import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getFactoryGanttApi,
  getFactoryLaunchCycleStatsApi,
  getFactoryOverviewApi,
} from '../../api/factory';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatDate } from '../../lib/format';
import { updateSearchParam } from '../../lib/view';
import { useGlobalState } from '../../store/globalState';
import type {
  AppView,
  FactoryLaunchCycleStats,
  FactoryOverviewCard,
  FactoryPipelineRunStatus,
  FactoryPipelineRunWithFeature,
  FeatureType,
} from '../../types';
import { FEATURE_TYPE_TO_FACTORY_LABEL_MAP } from '../../types';

type FactoryFilterType = 'all' | FeatureType;

const FACTORY_TYPES: FeatureType[] = ['rule', 'sequence', 'algo', 'vector', 'llm_intent'];
const RUN_STATUS_ORDER: FactoryPipelineRunStatus[] = ['running', 'completed', 'failed', 'pending'];

function labelOfView(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function statusLabel(status: FactoryPipelineRunStatus) {
  if (status === 'running') return '运行中';
  if (status === 'completed') return '已完成';
  if (status === 'failed') return '失败';
  return '待处理';
}

function stageStatusClass(status: string) {
  if (status === 'completed') return 'bg-emerald-500 text-white';
  if (status === 'running') return 'bg-blue-600 text-white';
  if (status === 'failed') return 'bg-rose-500 text-white';
  return 'bg-gray-200 text-gray-500';
}

function scoreClass(status: FactoryPipelineRunStatus) {
  if (status === 'running') return 'bg-blue-50 text-blue-700';
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-gray-100 text-gray-600';
}

function durationText(startedAt: string, finishedAt: string | null) {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const minutes = Math.max(1, Math.round((end - start) / 1000 / 60));
  if (minutes < 60) return `${minutes} 分钟`;
  return `${(minutes / 60).toFixed(1)} 小时`;
}

function normalizeOverviewCards(cards: FactoryOverviewCard[]) {
  const cardMap = new Map(cards.map((item) => [item.featureType, item]));
  return FACTORY_TYPES.map(
    (featureType) =>
      cardMap.get(featureType) ?? {
        featureType,
        label: FEATURE_TYPE_TO_FACTORY_LABEL_MAP[featureType],
        total: 0,
        medianLaunchDays: 0,
        runStatusCounts: {
          completed: 0,
          running: 0,
          failed: 0,
          pending: 0,
        },
      },
  );
}

export function FactoryPipelines() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const availableViews = useGlobalState((s) => s.availableViews);

  const [overviewCards, setOverviewCards] = useState<FactoryOverviewCard[]>([]);
  const [stats, setStats] = useState<FactoryLaunchCycleStats | null>(null);
  const [rows, setRows] = useState<FactoryPipelineRunWithFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const featureTypeParam = location.search ? new URLSearchParams(location.search).get('featureType') : null;
  const selectedType: FactoryFilterType =
    featureTypeParam != null && FACTORY_TYPES.includes(featureTypeParam as FeatureType)
      ? (featureTypeParam as FeatureType)
      : 'all';

  useBreadcrumb([
    { label: '工坊', to: '/factory' },
    { label: '产线总览' },
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getFactoryOverviewApi(), getFactoryLaunchCycleStatsApi()])
      .then(([overviewRes, launchStats]) => {
        if (cancelled) return;
        setOverviewCards(normalizeOverviewCards(overviewRes.items));
        setStats(launchStats);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '产线数据加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRowsLoading(true);
    getFactoryGanttApi({ featureType: selectedType })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '产线明细加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setRowsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedType]);

  const distribution = useMemo(() => {
    const base =
      overviewCards.find((item) => item.featureType === selectedType)?.runStatusCounts ??
      overviewCards.reduce(
        (acc, item) => {
          RUN_STATUS_ORDER.forEach((status) => {
            acc[status] += item.runStatusCounts[status];
          });
          return acc;
        },
        { completed: 0, running: 0, failed: 0, pending: 0 } as Record<FactoryPipelineRunStatus, number>,
      );

    return RUN_STATUS_ORDER.map((status) => ({
      status,
      label: statusLabel(status),
      count: base[status],
    }));
  }, [overviewCards, selectedType]);

  const visibleSamples = useMemo(() => {
    const samples = stats?.samples ?? [];
    const filtered =
      selectedType === 'all' ? samples : samples.filter((sample) => sample.pipelineType === selectedType);
    return filtered.slice(0, 8);
  }, [selectedType, stats]);

  const maxLaunchDays = useMemo(
    () => Math.max(1, ...visibleSamples.map((sample) => sample.launchDays), stats?.targetDays ?? 1),
    [stats?.targetDays, visibleSamples],
  );

  const handleFilterChange = (nextType: FactoryFilterType) => {
    navigate(
      {
        pathname: location.pathname,
        search: updateSearchParam(
          updateSearchParam(location.search, 'featureType', nextType === 'all' ? null : nextType),
          'view',
          'producer',
        ),
      },
      { replace: true },
    );
  };

  const goToConfig = (featureId: string) => {
    navigate({
      pathname: `/factory/features/${featureId}/config`,
      search: updateSearchParam(location.search, 'view', 'producer'),
    });
  };

  const goToSimilaritySearch = () => {
    navigate({
      pathname: '/factory/similarity-search',
      search: updateSearchParam(location.search, 'view', 'producer'),
    });
  };

  if (currentView !== 'producer') {
    return (
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader
            title="产线总览"
            subtitle="该页面承接供给视角的特征产线状态、配置链路与复用检索。"
            moduleTone="foundry"
          />

          <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
            当前为
            <span className="mx-1 font-semibold text-text-1">{labelOfView(currentView)}</span>
            ，供给视角的产线总览改由顶导统一切换进入。
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-base font-semibold text-text-1">当前是 {labelOfView(currentView)}</div>
            <div className="mt-2 text-sm text-text-2">
              `/factory/pipelines` 已切到供给方产线总览；消费视角仍走原有工坊挑选链路。
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    pathname: '/factory/pipelines',
                    search: updateSearchParam(location.search, 'view', 'producer'),
                  })
                }
                disabled={!availableViews.includes('producer')}
                className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                切换到供给视角
              </button>
              <button
                type="button"
                onClick={() => navigate({ pathname: '/factory', search: updateSearchParam(location.search, 'view', 'consumer') })}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
              >
                返回工坊
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="产线总览"
          subtitle="五类产线状态、甘特图进度、上线周期与复用性检索入口"
          moduleTone="foundry"
          action={
            <button
              type="button"
              onClick={goToSimilaritySearch}
              className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              进入复用检索
            </button>
          }
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前为
          <span className="mx-1 font-semibold text-text-1">{labelOfView(currentView)}</span>
          ，供给角色访问 `/factory` 时默认落到当前页。
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">
            正在加载产线概览...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`rounded-card border p-5 text-left shadow-sm transition ${
                  selectedType === 'all' ? 'border-module-workshop/40 bg-module-workshop/5' : 'border-border bg-surface'
                }`}
              >
                <div className="text-sm font-medium text-text-3">全部产线</div>
                <div className="mt-2 text-3xl font-semibold text-text-1">
                  {overviewCards.reduce((sum, item) => sum + item.total, 0)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {distribution.map((item) => (
                    <span key={item.status} className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreClass(item.status)}`}>
                      {item.label} {item.count}
                    </span>
                  ))}
                </div>
              </button>

              {overviewCards.map((card) => (
                <button
                  key={card.featureType}
                  type="button"
                  onClick={() => handleFilterChange(card.featureType)}
                  className={`rounded-card border p-5 text-left shadow-sm transition ${
                    selectedType === card.featureType ? 'border-module-workshop/40 bg-module-workshop/5' : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-text-3">{card.label}</div>
                    <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">{card.featureType}</span>
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-text-1">{card.total}</div>
                  <div className="mt-1 text-sm text-text-2">中位上线周期 {card.medianLaunchDays} 天</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RUN_STATUS_ORDER.map((status) => (
                      <span key={status} className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreClass(status)}`}>
                        {statusLabel(status)} {card.runStatusCounts[status]}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-text-1">供应链甘特图</div>
                    <div className="mt-1 text-sm text-text-2">
                      当前筛选: {selectedType === 'all' ? '全部产线' : FEATURE_TYPE_TO_FACTORY_LABEL_MAP[selectedType]}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {RUN_STATUS_ORDER.map((status) => (
                      <span key={status} className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreClass(status)}`}>
                        {statusLabel(status)}
                      </span>
                    ))}
                  </div>
                </div>

                {rowsLoading ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                    正在加载产线明细...
                  </div>
                ) : rows.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                    当前筛选下暂无流水线记录。
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => goToConfig(row.featureId)}
                        className="w-full rounded-2xl border border-border bg-white p-4 text-left transition hover:border-module-workshop/30 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-base font-semibold text-text-1">{row.feature.name}</div>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreClass(row.runStatus)}`}>
                                {statusLabel(row.runStatus)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm text-text-2">
                              <span>{row.pipelineLabel} 产线</span>
                              <span>当前阶段 {row.currentStageName}</span>
                              <span>耗时 {durationText(row.startedAt, row.finishedAt)}</span>
                            </div>
                          </div>
                          <div className="text-sm text-text-3">点击进入配置页</div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
                          {row.stages.map((stage) => (
                            <div key={`${row.id}-${stage.name}`} className="rounded-xl bg-bg p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-text-1">{stage.label}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${stageStatusClass(stage.status)}`}>
                                  {stage.status}
                                </span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-gray-200">
                                <div
                                  className={`h-2 rounded-full ${
                                    stage.status === 'completed'
                                      ? 'w-full bg-emerald-500'
                                      : stage.status === 'running'
                                        ? 'w-2/3 bg-blue-600'
                                        : stage.status === 'failed'
                                          ? 'w-full bg-rose-500'
                                          : 'w-1/4 bg-gray-300'
                                  }`}
                                />
                              </div>
                              <div className="mt-2 text-xs text-text-3">{stage.ownerTeamName}</div>
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-text-1">上线周期追踪</div>
                    <div className="mt-1 text-sm text-text-2">KPI 与样本分布共用当前产线筛选。</div>
                  </div>
                  <button
                    type="button"
                    onClick={goToSimilaritySearch}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
                  >
                    复用性检索
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">中位周期</div>
                    <div className="mt-2 text-2xl font-semibold text-text-1">{stats?.medianDays ?? '--'} 天</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">基线周期</div>
                    <div className="mt-2 text-2xl font-semibold text-text-1">{stats?.baselineDays ?? '--'} 天</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">目标周期</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-600">{stats?.targetDays ?? '--'} 天</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {visibleSamples.map((sample) => (
                    <div key={sample.featureId} className="rounded-xl border border-border bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-text-1">{sample.featureName}</div>
                          <div className="mt-1 text-xs text-text-3">{formatDate(sample.releasedAt)}</div>
                        </div>
                        <div className="text-sm font-semibold text-text-1">{sample.launchDays} 天</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-module-workshop"
                          style={{ width: `${Math.max(12, (sample.launchDays / maxLaunchDays) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {visibleSamples.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
                      当前筛选下暂无上线周期样本。
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
