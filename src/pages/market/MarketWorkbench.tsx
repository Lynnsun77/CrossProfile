import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { ViewSwitcher } from '../../components/layout/ViewSwitcher';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { mockDispatch } from '../../lib/fetcher';
import { formatLargeNumber } from '../../lib/format';
import type { ActionConfig } from '../../types';
import {
  domainLabels,
  focusMetricCopy,
  initialWorkbenchTasks,
  type WorkbenchDomain,
  type WorkbenchFocusMetric,
  type WorkbenchNode,
  type WorkbenchTask,
  type WorkbenchTaskStatus,
  type WorkbenchView,
  workbenchNodes,
  workbenchRelations,
} from './marketWorkbenchData';

const statusMeta: Record<WorkbenchTask['status'], { label: string; dot: string }> = {
  queued: { label: '排队中', dot: 'bg-slate-400' },
  running: { label: '执行中', dot: 'bg-amber-400 animate-pulse' },
  done: { label: '已完成', dot: 'bg-emerald-500' },
  completed: { label: '已完成', dot: 'bg-emerald-500' },
};

const touchpointLabels: Record<ActionConfig['touchpoints'][number], string> = {
  push: '推送',
  lifestyle_home: '生服首页',
  ecommerce_coupon: '电商优惠券',
};

const channelLabels: Record<ActionConfig['channels'][number], string> = {
  ldmp: '本地 DMP',
  ecommerce_dmp: '电商 DMP',
  policy_platform: '政策平台',
  money_eff: '资金效率',
  api: 'API',
};

function buildTaskTitle(config: ActionConfig) {
  const crowdLabel = config.crowd_id || '默认人群';
  const copywriting = config.copywriting_choice || '默认文案';
  return `${crowdLabel} x ${copywriting}`;
}

function getEntryMeta(pathname: string) {
  if (pathname.startsWith('/marketplace/action/new')) {
    return {
      label: '新建动作',
      description: '当前通过旧入口访问，已收敛到统一 workbench 页面。',
    };
  }

  if (pathname.startsWith('/marketplace/action/')) {
    return {
      label: '动作配置',
      description: '动态动作配置已并入统一 workbench，保留旧链接兼容访问。',
    };
  }

  if (pathname.startsWith('/marketplace/tasks')) {
    return {
      label: '任务监控',
      description: '任务列表已并入统一 workbench，保留旧链接兼容访问。',
    };
  }

  return {
    label: '下游消费方打通页',
    description: '统一承接动作配置、效果预估与任务监控。',
  };
}

function scoreNode(node: WorkbenchNode, focusMetric: WorkbenchFocusMetric) {
  if (focusMetric === 'reach') return node.metrics.reach;
  if (focusMetric === 'tasks') return node.metrics.activeTasks;
  if (focusMetric === 'risk') return node.metrics.riskCount;
  return node.metrics.estGmvLift;
}

export function MarketWorkbench() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeView, setActiveView] = useState<WorkbenchView>('consumer');
  const [domainFilter, setDomainFilter] = useState<'all' | WorkbenchDomain>('all');
  const [touchpointFilter, setTouchpointFilter] = useState<'all' | ActionConfig['touchpoints'][number]>('all');
  const [statusFilter, setStatusFilter] = useState<WorkbenchTaskStatus>('all');
  const [focusMetric, setFocusMetric] = useState<WorkbenchFocusMetric>('gmv');
  const [tasks, setTasks] = useState<WorkbenchTask[]>(() => initialWorkbenchTasks);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(() => initialWorkbenchTasks[0]?.id ?? null);
  const [config, setConfig] = useState<ActionConfig>(() => ({
    ...(workbenchNodes[0]?.recommendedConfig ?? {
      crowd_id: '',
      touchpoints: ['push'],
      subsidy_level: 'mid',
      budget: 500000,
      copywriting_choice: '默认运营文案',
      channels: ['ldmp'],
    }),
    crowd_id: id || workbenchNodes[0]?.recommendedConfig.crowd_id || '',
  }));

  const entryMeta = useMemo(() => getEntryMeta(location.pathname), [location.pathname]);

  useBreadcrumb([
    { label: '市集', to: '/marketplace' },
    { label: '下游消费方打通页' },
  ]);

  useEffect(() => {
    if (!id) return;
    setConfig((current) => ({ ...current, crowd_id: current.crowd_id || id }));
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((current) =>
        current.map((task) => {
          if (task.status === 'queued') return { ...task, status: 'running' };
          if (task.status === 'running') {
            return {
              ...task,
              status: 'done',
              result: task.result ?? {
                gmv_lift: 0.021,
                mac_change: -0.058,
                cvr: 0.017,
              },
            };
          }
          return task;
        }),
      );
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3500);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const visibleNodes = useMemo(
    () =>
      workbenchNodes
        .filter((node) => {
          if (!node.availableViews.includes(activeView)) return false;
          if (domainFilter !== 'all' && node.domain !== domainFilter) return false;
          if (touchpointFilter !== 'all' && node.touchpoint !== touchpointFilter) return false;
          return true;
        })
        .sort((left, right) => scoreNode(right, focusMetric) - scoreNode(left, focusMetric)),
    [activeView, domainFilter, focusMetric, touchpointFilter],
  );

  useEffect(() => {
    if (visibleNodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }
    if (!selectedNodeId || !visibleNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(visibleNodes[0].id);
    }
  }, [selectedNodeId, visibleNodes]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId) ?? visibleNodes[0] ?? null,
    [selectedNodeId, visibleNodes],
  );

  useEffect(() => {
    if (!selectedNode) return;
    setConfig(() => ({
      ...selectedNode.recommendedConfig,
      crowd_id: id || selectedNode.recommendedConfig.crowd_id,
    }));
  }, [id, selectedNode]);

  const baseFilteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.view !== activeView) return false;
        if (domainFilter !== 'all' && task.domain !== domainFilter) return false;
        if (touchpointFilter !== 'all' && task.touchpoint !== touchpointFilter) return false;
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        return true;
      }),
    [activeView, domainFilter, statusFilter, tasks, touchpointFilter],
  );

  const filteredTasks = useMemo(() => {
    if (!selectedNode) return baseFilteredTasks;
    return baseFilteredTasks.filter((task) => task.nodeId === selectedNode.id);
  }, [baseFilteredTasks, selectedNode]);

  useEffect(() => {
    if (filteredTasks.length === 0) {
      setExpandedId(null);
      return;
    }
    if (!expandedId || !filteredTasks.some((task) => task.id === expandedId)) {
      setExpandedId(filteredTasks[0].id);
    }
  }, [expandedId, filteredTasks]);

  const overview = useMemo(() => {
    const finishedTasks = baseFilteredTasks.filter((task) => task.result);
    const activeTasks = baseFilteredTasks.filter((task) => task.status === 'queued' || task.status === 'running');
    return {
      reachableAudience: visibleNodes.reduce((total, node) => total + node.metrics.reach, 0),
      activeTaskCount: activeTasks.length,
      estGmvLift:
        visibleNodes.length > 0
          ? visibleNodes.reduce((total, node) => total + node.metrics.estGmvLift, 0) / visibleNodes.length
          : 0,
      riskCount: visibleNodes.reduce((total, node) => total + node.metrics.riskCount, 0),
      avgCvr:
        finishedTasks.length > 0
          ? finishedTasks.reduce((total, task) => total + (task.result?.cvr ?? 0), 0) / finishedTasks.length
          : 0,
      completedCount: finishedTasks.length,
    };
  }, [baseFilteredTasks, visibleNodes]);

  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const relationIds = workbenchRelations
      .filter((relation) => relation.source === selectedNode.id || relation.target === selectedNode.id)
      .flatMap((relation) => [relation.source, relation.target]);
    return visibleNodes.filter((node) => relationIds.includes(node.id) && node.id !== selectedNode.id);
  }, [selectedNode, visibleNodes]);

  const selectedNodeTasks = selectedNode ? baseFilteredTasks.filter((task) => task.nodeId === selectedNode.id) : [];
  const estimatedExposure = Math.round(config.budget * (selectedNode?.domain === 'channel' ? 12.6 : 10.4));
  const estimatedCtr =
    config.subsidy_level === 'high' ? 0.036 : config.subsidy_level === 'mid' ? 0.032 : 0.027;
  const estimatedCvr =
    config.touchpoints.includes('ecommerce_coupon') ? 0.021 : selectedNode?.touchpoint === 'lifestyle_home' ? 0.017 : 0.018;
  const estimatedGmvLift = selectedNode?.metrics.estGmvLift ?? 0.019;

  const handleDispatch = async () => {
    setLoading(true);
    try {
      await mockDispatch();
      const nextTask: WorkbenchTask = {
        id: `task_local_${Date.now()}`,
        nodeId: selectedNode?.id ?? workbenchNodes[0].id,
        domain: selectedNode?.domain ?? 'strategy',
        touchpoint: config.touchpoints[0] ?? selectedNode?.touchpoint ?? 'push',
        view: activeView,
        priority: focusMetric === 'risk' ? 'high' : focusMetric === 'reach' ? 'mid' : 'high',
        crowdId: config.crowd_id || undefined,
        actionId: id || undefined,
        title: buildTaskTitle(config),
        created_at: new Intl.DateTimeFormat('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
          .format(new Date())
          .replace(/\//g, '-'),
        crowd_size: Math.max(120000, Math.round(config.budget * 2.4)),
        channels: config.channels.map((channel) => channelLabels[channel]),
        status: 'queued',
      };
      setTasks((current) => [nextTask, ...current]);
      setExpandedId(nextTask.id);
      setSelectedNodeId(nextTask.nodeId);
      setShowSuccess(true);
    } catch (error) {
      console.error('Dispatch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="下游消费方打通页"
        subtitle="单页 workbench 收敛 KPI、视角切换、全页筛选与三域拓扑联动"
        moduleTone="market"
        extra={
          <div className="w-[280px] max-w-full">
            <ViewSwitcher
              current_view={activeView}
              available_views={[
                { view: 'consumer', label: '消费', description: '看经营机会和动作承接' },
                { view: 'producer', label: '供给', description: '看供给链路和渠道治理' },
              ]}
              on_switch={(nextView) => setActiveView(nextView as WorkbenchView)}
              size="sm"
            />
          </div>
        }
      />

      <div className="mb-6 rounded-card border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium text-text-1">当前入口：{entryMeta.label}</div>
            <div className="text-sm text-text-3">{entryMeta.description}</div>
          </div>
          <div className="text-sm text-text-3">
            统一入口：
            <Link to="/marketplace/workbench" className="font-medium text-brand-600 hover:underline">
              /marketplace/workbench
            </Link>
          </div>
        </div>
      </div>

      {showSuccess ? (
        <div className="mb-6 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          动作已派发，新的任务已进入当前视角与筛选范围的联动监控列表。
        </div>
      ) : null}

      <section className="mb-6 rounded-card border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-1">F4 全页筛选器</h2>
            <p className="mt-1 text-sm text-text-3">筛选项同时作用于 KPI、拓扑、主区配置和右侧洞察。</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:min-w-[720px]">
            <label className="text-sm text-text-2">
              <span className="mb-2 block font-medium">域</span>
              <select
                value={domainFilter}
                onChange={(event) => setDomainFilter(event.target.value as 'all' | WorkbenchDomain)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-1 outline-none transition focus:border-brand-400"
                aria-label="域筛选"
              >
                <option value="all">全部域</option>
                <option value="crowd">人群域</option>
                <option value="strategy">策略域</option>
                <option value="channel">渠道域</option>
              </select>
            </label>
            <label className="text-sm text-text-2">
              <span className="mb-2 block font-medium">触点</span>
              <select
                value={touchpointFilter}
                onChange={(event) =>
                  setTouchpointFilter(event.target.value as 'all' | ActionConfig['touchpoints'][number])
                }
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-1 outline-none transition focus:border-brand-400"
                aria-label="触点筛选"
              >
                <option value="all">全部触点</option>
                <option value="push">推送</option>
                <option value="lifestyle_home">生服首页</option>
                <option value="ecommerce_coupon">电商优惠券</option>
              </select>
            </label>
            <label className="text-sm text-text-2">
              <span className="mb-2 block font-medium">任务状态</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as WorkbenchTaskStatus)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-1 outline-none transition focus:border-brand-400"
                aria-label="任务状态筛选"
              >
                <option value="all">全部状态</option>
                <option value="queued">排队中</option>
                <option value="running">执行中</option>
                <option value="done">已完成</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            key: 'reach' as const,
            title: 'F1 覆盖人群',
            value: formatLargeNumber(overview.reachableAudience),
            desc: '筛选后可触达人群总量',
          },
          {
            key: 'tasks' as const,
            title: 'F1 在途任务',
            value: `${overview.activeTaskCount}`,
            desc: `当前范围内活跃任务，已完成 ${overview.completedCount}`,
          },
          {
            key: 'gmv' as const,
            title: 'F1 预估 GMV',
            value: `+${(overview.estGmvLift * 100).toFixed(1)}%`,
            desc: `已完成任务平均 CVR ${(overview.avgCvr * 100).toFixed(1)}%`,
          },
          {
            key: 'risk' as const,
            title: 'F1 治理风险',
            value: `${overview.riskCount}`,
            desc: '点击查看风险优先节点与治理链路',
          },
        ].map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              setFocusMetric(card.key);
              setSelectedNodeId(null);
            }}
            className={`rounded-card border p-4 text-left transition ${
              focusMetric === card.key
                ? 'border-brand-400 bg-brand-50 shadow-sm'
                : 'border-border bg-surface hover:border-brand-200'
            }`}
          >
            <div className="text-sm text-text-3">{card.title}</div>
            <div className={`mt-2 text-2xl font-semibold ${card.key === 'gmv' ? 'text-emerald-600' : 'text-text-1'}`}>
              {card.value}
            </div>
            <div className="mt-1 text-xs text-text-3">{card.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6">
            <div>
              <h2 className="text-lg font-semibold text-text-1">F2 三域拓扑图</h2>
              <p className="mt-1 text-sm text-text-3">{focusMetricCopy[focusMetric].hint}，点击节点联动主区配置与右侧详情。</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(['crowd', 'strategy', 'channel'] as const).map((domain) => {
                const domainNodes = visibleNodes.filter((node) => node.domain === domain);
                return (
                  <div key={domain} className="rounded-xl bg-bg p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-1">{domainLabels[domain]}</h3>
                      <span className="text-xs text-text-3">{domainNodes.length} 个节点</span>
                    </div>
                    <div className="space-y-3">
                      {domainNodes.length > 0 ? (
                        domainNodes.map((node) => {
                          const isSelected = node.id === selectedNode?.id;
                          return (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                                isSelected
                                  ? 'border-brand-400 bg-white shadow-sm'
                                  : 'border-transparent bg-white/70 hover:border-brand-200'
                              }`}
                              aria-pressed={isSelected}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium text-text-1">{node.name}</div>
                                  <div className="mt-1 text-xs text-text-3">{node.description}</div>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-text-2">
                                  {focusMetric === 'reach'
                                    ? formatLargeNumber(node.metrics.reach)
                                    : focusMetric === 'tasks'
                                      ? `${node.metrics.activeTasks} 任务`
                                      : focusMetric === 'gmv'
                                        ? `+${(node.metrics.estGmvLift * 100).toFixed(1)}%`
                                        : `${node.metrics.riskCount} 风险`}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-3">
                          {focusMetricCopy[focusMetric].emptyHint}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border bg-white px-4 py-4">
              <div className="mb-2 text-sm font-medium text-text-1">链路关系</div>
              <div className="flex flex-wrap gap-2">
                {workbenchRelations
                  .filter((relation) => {
                    const scopedIds = new Set(visibleNodes.map((node) => node.id));
                    return scopedIds.has(relation.source) && scopedIds.has(relation.target);
                  })
                  .map((relation) => (
                    <span
                      key={`${relation.source}-${relation.target}`}
                      className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-2"
                    >
                      {workbenchNodes.find((node) => node.id === relation.source)?.name}
                      {' -> '}
                      {workbenchNodes.find((node) => node.id === relation.target)?.name}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-1">联动动作配置</h2>
                <p className="mt-1 text-sm text-text-3">
                  当前节点：
                  <span className="font-medium text-text-1">{selectedNode?.name ?? '暂无可用节点'}</span>
                  ，切换节点会同步重置推荐配置。
                </p>
              </div>
              <div className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">主区配置区</div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-2">人群 ID</label>
                <input
                  type="text"
                  value={config.crowd_id}
                  onChange={(event) => setConfig({ ...config, crowd_id: event.target.value })}
                  placeholder="输入资产 / 人群 ID"
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text-1 outline-none transition focus:border-brand-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-2">触达触点</label>
                <div className="flex flex-wrap gap-2">
                  {(['push', 'lifestyle_home', 'ecommerce_coupon'] as const).map((touchpoint) => (
                    <button
                      key={touchpoint}
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          touchpoints: current.touchpoints.includes(touchpoint)
                            ? current.touchpoints.filter((item) => item !== touchpoint)
                            : [...current.touchpoints, touchpoint],
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        config.touchpoints.includes(touchpoint)
                          ? 'bg-brand-500 text-white'
                          : 'border border-border bg-white text-text-2 hover:bg-bg'
                      }`}
                    >
                      {touchpointLabels[touchpoint]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-2">补贴水平</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'mid', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setConfig({ ...config, subsidy_level: level })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        config.subsidy_level === level
                          ? 'bg-brand-500 text-white'
                          : 'border border-border bg-white text-text-2 hover:bg-bg'
                      }`}
                    >
                      {level === 'low' ? '低' : level === 'mid' ? '中' : '高'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-2">预算（元）</label>
                  <input
                    type="number"
                    min={0}
                    value={config.budget}
                    onChange={(event) => setConfig({ ...config, budget: Number(event.target.value) || 0 })}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text-1 outline-none transition focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-2">文案策略</label>
                  <input
                    type="text"
                    value={config.copywriting_choice}
                    onChange={(event) => setConfig({ ...config, copywriting_choice: event.target.value })}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-text-1 outline-none transition focus:border-brand-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-2">下游渠道</label>
                <div className="flex flex-wrap gap-2">
                  {(['ldmp', 'ecommerce_dmp', 'policy_platform', 'money_eff', 'api'] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() =>
                        setConfig((current) => ({
                          ...current,
                          channels: current.channels.includes(channel)
                            ? current.channels.filter((item) => item !== channel)
                            : [...current.channels, channel],
                        }))
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        config.channels.includes(channel)
                          ? 'bg-brand-500 text-white'
                          : 'border border-border bg-white text-text-2 hover:bg-bg'
                      }`}
                    >
                      {channelLabels[channel]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Link
                to="/marketplace"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-2 transition hover:bg-bg"
              >
                返回市集
              </Link>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={loading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '派发中...' : '派发并加入监控'}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text-1">右侧联动洞察</h2>
            {selectedNode ? (
              <>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-text-3">{domainLabels[selectedNode.domain]}</div>
                    <div className="mt-1 text-xl font-semibold text-text-1">{selectedNode.name}</div>
                    <p className="mt-2 text-sm text-text-2">{selectedNode.detail}</p>
                  </div>
                  <span className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">负责人：{selectedNode.owner}</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-bg p-4">
                    <div className="text-xs text-text-3">可触达人群</div>
                    <div className="mt-1 text-xl font-semibold text-text-1">{formatLargeNumber(selectedNode.metrics.reach)}</div>
                  </div>
                  <div className="rounded-lg bg-bg p-4">
                    <div className="text-xs text-text-3">关联任务</div>
                    <div className="mt-1 text-xl font-semibold text-text-1">{selectedNodeTasks.length}</div>
                  </div>
                  <div className="rounded-lg bg-bg p-4">
                    <div className="text-xs text-text-3">预估 GMV 提升</div>
                    <div className="mt-1 text-xl font-semibold text-emerald-600">
                      +{(selectedNode.metrics.estGmvLift * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg p-4">
                    <div className="text-xs text-text-3">治理风险</div>
                    <div className="mt-1 text-xl font-semibold text-text-1">{selectedNode.metrics.riskCount}</div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-white p-4">
                  <div className="text-sm font-medium text-text-1">推荐信号</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedNode.signals.map((signal) => (
                      <span key={signal} className="rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-2">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-white p-4">
                  <div className="text-sm font-medium text-text-1">关联节点</div>
                  <div className="mt-3 space-y-2">
                    {relatedNodes.length > 0 ? (
                      relatedNodes.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          className="flex w-full items-center justify-between rounded-lg bg-bg px-3 py-2 text-left text-sm text-text-2 transition hover:bg-slate-100"
                        >
                          <span>{node.name}</span>
                          <span className="text-xs text-text-3">{domainLabels[node.domain]}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-text-3">当前节点暂无更多链路节点。</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 text-sm text-text-3">当前筛选下暂无可用节点，请调整筛选条件。</div>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-text-1">配置摘要与效果预估</h2>
            <div className="mt-4 space-y-3 text-sm text-text-2">
              <div className="flex items-center justify-between gap-4">
                <span>已选触点</span>
                <span className="font-medium text-text-1">
                  {config.touchpoints.map((item) => touchpointLabels[item]).join(' / ') || '未选择'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>已选渠道</span>
                <span className="font-medium text-text-1">
                  {config.channels.map((item) => channelLabels[item]).join(' / ') || '未选择'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>预算</span>
                <span className="font-medium text-text-1">{config.budget.toLocaleString('zh-CN')} 元</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-bg p-4">
                <div className="text-xs text-text-3">预估曝光</div>
                <div className="mt-1 text-xl font-semibold text-text-1">{formatLargeNumber(estimatedExposure)}</div>
              </div>
              <div className="rounded-lg bg-bg p-4">
                <div className="text-xs text-text-3">预估 CTR</div>
                <div className="mt-1 text-xl font-semibold text-text-1">{(estimatedCtr * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-lg bg-bg p-4">
                <div className="text-xs text-text-3">预估 CVR</div>
                <div className="mt-1 text-xl font-semibold text-text-1">{(estimatedCvr * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-lg bg-bg p-4">
                <div className="text-xs text-text-3">预估 GMV 提升</div>
                <div className="mt-1 text-xl font-semibold text-emerald-600">+{(estimatedGmvLift * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-text-2">
              当前主链路聚焦：
              <span className="font-medium text-text-1"> {focusMetricCopy[focusMetric].label}</span>
              ，已锁定
              <span className="font-medium text-text-1"> {selectedNode?.name ?? '无'} </span>
              节点，关联任务 {selectedNodeTasks.length} 个。
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-card border border-border bg-surface p-6">
        <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-1">任务监控</h2>
            <p className="mt-1 text-sm text-text-3">任务列表受视角、筛选、KPI 焦点和当前拓扑节点共同驱动。</p>
          </div>
          <div className="text-xs text-text-3">
            当前范围 {baseFilteredTasks.length} 个任务，当前节点 {filteredTasks.length} 个任务
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task.id} className="overflow-hidden rounded-card border border-border bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-bg"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`h-3 w-3 flex-none rounded-full ${statusMeta[task.status].dot}`} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-text-1">{task.title}</div>
                      <div className="mt-1 text-sm text-text-3">{task.created_at}</div>
                    </div>
                  </div>

                  <div className="flex flex-none items-center gap-8">
                    <div className="text-right">
                      <div className="text-xs text-text-3">归属域</div>
                      <div className="text-sm font-medium text-text-1">{domainLabels[task.domain]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-3">人群规模</div>
                      <div className="text-sm font-medium text-text-1">{formatLargeNumber(task.crowd_size)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-3">状态</div>
                      <div className="text-sm font-medium text-text-1">{statusMeta[task.status].label}</div>
                    </div>
                  </div>
                </button>

                {expandedId === task.id ? (
                  <div className="border-t border-border bg-bg px-4 py-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-2">
                        触点：{touchpointLabels[task.touchpoint]}
                      </span>
                      <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-2">
                        优先级：{task.priority === 'high' ? '高' : task.priority === 'mid' ? '中' : '低'}
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {task.channels.map((channel) => (
                        <span key={channel} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-2">
                          {channel}
                        </span>
                      ))}
                    </div>

                    {task.result ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-border bg-surface p-4">
                          <div className="text-sm text-text-3">GMV 提升</div>
                          <div className="mt-1 text-xl font-semibold text-emerald-600">
                            +{((task.result.gmv_lift ?? 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                          <div className="text-sm text-text-3">MAC 变化</div>
                          <div className="mt-1 text-xl font-semibold text-brand-500">
                            {((task.result.mac_change ?? 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                          <div className="text-sm text-text-3">CVR</div>
                          <div className="mt-1 text-xl font-semibold text-[#7B5BF5]">
                            {((task.result.cvr ?? 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-3">任务执行中，实时效果将自动刷新。</div>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-card border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-text-3">
              当前筛选与节点范围下暂无任务，可切换视角、筛选条件或重新派发任务。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
