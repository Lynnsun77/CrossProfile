import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getBacktestJobDetailApi,
  getBacktestJobsApi,
  getBacktestOverviewApi,
  getGovernanceTicketDetailApi,
  getGovernanceTicketsApi,
  getHealthScoreBreakdownApi,
  getHealthScoreTrendApi,
  getQualityDegradationEventsApi,
  getQualityAlertOverviewApi,
  getQualityAlertRulesApi,
  getQualityAlertsApi,
  getQualityAttributionKpisApi,
  getQualityConsumptionApi,
  getQualityExportApi,
  getQualityFeatureAttributionApi,
  getQualityHealthListApi,
  getQualityHealthReportApi,
  getQualityHeatmapApi,
  getSelfReviewAiSuggestionsApi,
  getSelfReviewRecordsApi,
  getSelfReviewTemplateByFeatureTypeApi,
  getQualityTrendApi,
  getQualityValueRankingApi,
  postGovernanceTicketCommentApi,
  updateGovernanceTicketStatusApi,
} from '../../api/quality';
import { MY_ASSIGNEE_FILTER, MY_ASSIGNEE_TEAM_ID } from '../../api/my';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatDate, formatLargeNumber, formatNumber } from '../../lib/format';
import { getPreferredView, parseViewFromSearch } from '../../lib/view';
import { useGlobalState } from '../../store/globalState';
import type {
  AppView,
  BacktestJob,
  BacktestJobStatus,
  BacktestScenario,
  ConsumptionRecord,
  FeatureDomain,
  FeatureType,
  GovernanceSeverity,
  GovernanceTicket,
  GovernanceTicketComment,
  GovernanceTicketDetail,
  HealthScoreBreakdown,
  HealthScoreTrendPoint,
  GovernanceTicketType,
  QualityAlert,
  QualityAlertRule,
  QualityAttributionKpi,
  QualityDegradationEvent,
  QualityExportEntry,
  QualityFeatureAttributionDetail,
  QualityHealthHeatmapPoint,
  QualityHealthListItem,
  QualityHealthStatus,
  QualityMetricKey,
  QualityTrendPoint,
  QualityValueRankingItem,
  SelfReviewItem,
  SelfReviewRecord,
  SelfReviewTemplate,
} from '../../types';
import {
  ALERT_TYPES,
  BACKTEST_JOB_STATUSES,
  BACKTEST_SCENARIOS,
  FEATURE_DOMAINS,
  GOVERNANCE_SEVERITIES,
  GOVERNANCE_TICKET_TYPES,
  QUALITY_HEALTH_STATUSES,
  QUALITY_METRIC_KEYS,
} from '../../types';

type QualitySection =
  | 'landing'
  | 'governance'
  | 'auto-backtest'
  | 'self-review'
  | 'llm-judge'
  | 'survey'
  | 'tickets'
  | 'attribution';
type GovernanceBoardMode = 'list' | 'heatmap';
type GovernanceSortKey = 'score' | 'freshness' | 'alerts' | 'tickets';
type SortOrder = 'asc' | 'desc';
type TicketStatus = GovernanceTicket['status'];
type TicketStatusFilter = 'all' | TicketStatus;
type QualityStatusFilter = 'all' | QualityHealthStatus;
type DomainFilter = 'all' | FeatureDomain;
type AlertTypeFilter = 'all' | (typeof ALERT_TYPES)[number];
type TicketTypeFilter = 'all' | GovernanceTicketType;
type SeverityFilter = 'all' | GovernanceSeverity;
type PeriodFilter = 30 | 60 | 90;
type ExportFormat = 'csv' | 'xlsx';
type ConsumerEntryKey = 'precheck' | 'badges';

const TICKET_STATUSES: TicketStatus[] = ['open', 'processing', 'resolved', 'closed'];
const FEATURE_TYPE_OPTIONS: FeatureType[] = ['rule', 'sequence', 'algo', 'vector', 'llm_intent'];
const QUALITY_ACTIONS = {
  backtestView: 'quality.backtest.view',
  backtestCreate: 'quality.backtest.create',
  backtestScheduleManage: 'quality.backtest.schedule.manage',
  selfReviewView: 'quality.self_review.view',
  selfReviewSubmit: 'quality.self_review.submit',
  selfReviewTemplateManage: 'quality.self_review.template.manage',
  llmJudgeView: 'quality.llm_judge.view',
  llmJudgeCreate: 'quality.llm_judge.create',
  llmJudgeTemplateManage: 'quality.llm_judge.template.manage',
  surveyView: 'quality.survey.view',
  surveyDispatchCreate: 'quality.survey.dispatch.create',
  healthScoreView: 'quality.health_score.view',
  healthScoreWeightManage: 'quality.health_score.weight.manage',
} as const;

function buildSearch(search: string, updates: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams(search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') params.delete(key);
    else params.set(key, String(value));
  });
  const next = params.toString();
  return next ? `?${next}` : '';
}

function hasAction(enabledActions: string[], action: string) {
  return enabledActions.includes(action);
}

function hasAnyAction(enabledActions: string[], actions: readonly string[]) {
  return actions.some((action) => hasAction(enabledActions, action));
}

function getLatestCompletedBacktest(jobs: BacktestJob[], featureId: string) {
  return (
    jobs
      .filter((item) => item.featureId === featureId && item.status === 'completed' && item.metrics)
      .sort((a, b) => {
        const aTime = new Date(a.finishedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.finishedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      })[0] ?? null
  );
}

function getBacktestGateEvaluation(job: BacktestJob | null) {
  if (!job?.metrics) {
    return {
      available: false,
      passed: true,
      badge: '待补回测',
      detail: '当前特征还没有已完成的自动回测结果，Part 2 门禁暂按“静态评测 + 自评阈值”解释。',
    };
  }

  const passed = job.metrics.accuracy >= job.metrics.gateThreshold;
  return {
    available: true,
    passed,
    badge: passed ? '回测达标' : '回测拦截',
    detail: `最近一次回测准确率 ${(job.metrics.accuracy * 100).toFixed(1)}%，门禁阈值 ${(job.metrics.gateThreshold * 100).toFixed(1)}%。`,
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '--';
  const date = new Date(value);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRatio(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function viewLabel(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function featureDomainLabel(value: FeatureDomain) {
  if (value === 'user_profile') return '用户画像';
  if (value === 'merchant_profile') return '商家画像';
  if (value === 'product_profile') return '商品画像';
  if (value === 'content_profile') return '内容画像';
  if (value === 'transaction') return '交易';
  return '跨域';
}

function featureTypeLabel(value: string) {
  if (value === 'rule') return '规则';
  if (value === 'sequence') return '序列';
  if (value === 'algo') return '算法';
  if (value === 'vector') return '向量';
  return 'LLM';
}

function backtestScenarioLabel(value: BacktestScenario) {
  return value === 'future_behavior' ? '未来行为' : '兴趣遮罩';
}

function backtestStatusLabel(value: BacktestJobStatus) {
  if (value === 'pending') return '待执行';
  if (value === 'running') return '执行中';
  if (value === 'completed') return '已完成';
  return '执行失败';
}

function backtestStatusClass(value: BacktestJobStatus) {
  if (value === 'pending') return 'bg-slate-100 text-slate-700';
  if (value === 'running') return 'bg-blue-50 text-blue-700';
  if (value === 'completed') return 'bg-emerald-50 text-emerald-700';
  return 'bg-rose-50 text-rose-700';
}

function backtestTriggerLabel(value: BacktestJob['triggerType']) {
  if (value === 'scheduled') return '定时巡检';
  if (value === 'manual') return '人工触发';
  return '门禁触发';
}

function formatHealthStatus(status: QualityHealthStatus) {
  if (status === 'critical') return '严重';
  if (status === 'warning') return '警告';
  return '健康';
}

function healthStatusClass(status: QualityHealthStatus) {
  if (status === 'critical') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function alertTypeLabel(value: string) {
  if (value === 'freshness') return '新鲜度';
  if (value === 'coverage') return '覆盖率';
  if (value === 'drift') return '分布漂移';
  if (value === 'latency') return '延迟';
  if (value === 'schema_change') return 'Schema 变更';
  return '成本';
}

function ticketTypeLabel(value: GovernanceTicketType) {
  if (value === 'quality_fix') return '质量修复';
  if (value === 'schema_review') return 'Schema 评审';
  if (value === 'publish_review') return '发布复核';
  if (value === 'appeal') return '申诉复核';
  return '合规治理';
}

function ticketStatusLabel(status: TicketStatus) {
  if (status === 'open') return '待处理';
  if (status === 'processing') return '处理中';
  if (status === 'resolved') return '已解决';
  return '已关闭';
}

function ticketStatusClass(status: TicketStatus) {
  if (status === 'open') return 'bg-amber-50 text-amber-700';
  if (status === 'processing') return 'bg-blue-50 text-blue-700';
  if (status === 'resolved') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function severityLabel(value: GovernanceSeverity | undefined) {
  if (!value) return '--';
  if (value === 'critical') return '严重';
  if (value === 'high') return '高';
  if (value === 'medium') return '中';
  return '低';
}

function severityClass(value: GovernanceSeverity | undefined) {
  if (value === 'critical') return 'bg-rose-50 text-rose-700';
  if (value === 'high') return 'bg-orange-50 text-orange-700';
  if (value === 'medium') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function metricValue(value: number, unit: '%' | '万元' | 'bp' | 'x') {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '万元') return `${value.toFixed(1)} 万元`;
  if (unit === 'bp') return `${value.toFixed(1)} bp`;
  return `${value.toFixed(2)} x`;
}

function selfReviewStatusLabel(value: SelfReviewRecord['status']) {
  if (value === 'draft') return '草稿';
  if (value === 'submitted') return '已提交';
  if (value === 'passed') return '已通过';
  return '未通过';
}

function selfReviewStatusClass(value: SelfReviewRecord['status']) {
  if (value === 'draft') return 'bg-slate-100 text-slate-700';
  if (value === 'submitted') return 'bg-blue-50 text-blue-700';
  if (value === 'passed') return 'bg-emerald-50 text-emerald-700';
  return 'bg-rose-50 text-rose-700';
}

function autoCheckStatusLabel(value: SelfReviewItem['autoCheckStatus']) {
  if (value === 'pass') return '通过';
  if (value === 'warn') return '提醒';
  return '失败';
}

function autoCheckStatusClass(value: SelfReviewItem['autoCheckStatus']) {
  if (value === 'pass') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (value === 'warn') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function healthSourceLabel(value: HealthScoreBreakdown['sources'][number]['source']) {
  if (value === 'static_evaluation') return '静态评测';
  if (value === 'auto_backtest') return '自动回测';
  if (value === 'self_review') return '结构化自评';
  if (value === 'llm_judgement') return 'LLM 评判';
  if (value === 'human_eval') return '人工评估';
  return '问卷反馈';
}

function formatContribution(value: number) {
  return value.toFixed(1);
}

function formatScore(value: number) {
  return value.toFixed(1);
}

function formatSignedScore(value: number, digits = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function channelLabel(channel: ConsumptionRecord['channel']) {
  if (channel === 'marketplace') return '智能推荐';
  if (channel === 'api') return 'API';
  if (channel === 'batch') return '批量';
  if (channel === 'foundry') return '工坊';
  return '内部';
}

function MetricCard({
  title,
  value,
  hint,
  active = false,
  onClick,
}: {
  title: string;
  value: string;
  hint: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = `rounded-card border p-5 text-left shadow-sm transition ${
    active ? 'border-module-dashboard/40 bg-module-dashboard/5' : 'border-border bg-surface'
  } ${onClick ? 'hover:border-module-dashboard/30' : ''}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <div className="text-sm font-medium text-text-3">{title}</div>
        <div className="mt-2 text-3xl font-semibold text-text-1">{value}</div>
        <div className="mt-2 text-sm text-text-2">{hint}</div>
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm font-medium text-text-3">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-text-1">{value}</div>
      <div className="mt-2 text-sm text-text-2">{hint}</div>
    </div>
  );
}

function ConsumerEntryCards({ current }: { current: ConsumerEntryKey }) {
  const location = useLocation();

  const entries = [
    {
      key: 'precheck',
      label: '质量预检',
      description: '在消费接入前核对特征可用性、字段约束与发布状态。',
      to: '/quality/precheck',
    },
    {
      key: 'badges',
      label: '质量徽章',
      description: '查看消费侧沿用的质量信号说明与问题反馈入口。',
      to: '/quality/badges',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <Link
          key={entry.key}
          to={{ pathname: entry.to, search: buildSearch(location.search, { view: 'consumer' }) }}
          className={`rounded-card border p-5 shadow-sm transition ${
            current === entry.key
              ? 'border-transparent bg-module-dashboard/5 ring-1 ring-module-dashboard/25'
              : 'border-border bg-surface hover:border-gray-300'
          }`}
        >
          <div className="text-base font-semibold text-text-1">{entry.label}</div>
          <div className="mt-2 text-sm text-text-2">{entry.description}</div>
        </Link>
      ))}
    </div>
  );
}

function SectionTabs({ section }: { section: QualitySection }) {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);

  if (currentView === 'consumer') return null;

  const tabs = [
    { key: 'governance', label: '治理看板', to: '/quality/governance' },
    { key: 'auto-backtest', label: '自动回测', to: '/quality/auto-backtest' },
    { key: 'self-review', label: '结构化自评', to: '/quality/self-review' },
    { key: 'llm-judge', label: 'LLM 评判', to: '/quality/llm-judge' },
    { key: 'survey', label: '问卷反馈', to: '/quality/survey' },
    { key: 'tickets', label: '治理工单', to: '/quality/tickets' },
    { key: 'attribution', label: '收益归因', to: '/quality/attribution' },
  ] as const;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          to={{ pathname: tab.to, search: buildSearch(location.search, { view: currentView }) }}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            tab.key === section
              ? 'border-transparent bg-gray-900 text-white shadow-sm'
              : 'border-border bg-white text-text-2 hover:border-gray-300 hover:text-text-1'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function QualityPageFrame({
  section,
  title,
  subtitle,
  action,
  hideTabs = false,
  children,
}: {
  section: QualitySection;
  title: string;
  subtitle: string;
  action?: ReactNode;
  hideTabs?: boolean;
  children: ReactNode;
}) {
  const currentView = useGlobalState((s) => s.currentView);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title={title} subtitle={subtitle} moduleTone="dashboard" action={action} />
        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前为
          <span className="mx-1 font-semibold text-text-1">{viewLabel(currentView)}</span>
          ，页面内容会随顶导中的全局视角切换同步更新。
        </div>
        {!hideTabs ? <SectionTabs section={section} /> : null}
        {children}
      </div>
    </div>
  );
}

function RestrictedViewPanel({
  title = '当前视角暂不可用',
  description = '治理看板、治理工单和收益归因仅在 `producer` 或 `operator` 视角下可用；消费视角仍保持原有质量入口心智。',
  producerTarget = '/quality/governance',
  producerButtonLabel = '切换到供给视角',
  fallbackTarget = '/quality/precheck',
  fallbackButtonLabel = '返回消费入口',
}: {
  title?: string;
  description?: string;
  producerTarget?: string;
  producerButtonLabel?: string;
  fallbackTarget?: string;
  fallbackButtonLabel?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const availableViews = useGlobalState((s) => s.availableViews);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="text-lg font-semibold text-text-1">{title}</div>
      <div className="mt-2 text-sm text-text-2">{description}</div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!availableViews.includes('producer')}
          onClick={() => {
            if (!availableViews.includes('producer')) return;
            setCurrentView('producer');
            navigate({ pathname: producerTarget, search: buildSearch(location.search, { view: 'producer' }) });
          }}
          className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {producerButtonLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate({ pathname: fallbackTarget, search: buildSearch(location.search, { view: 'consumer' }) })}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
        >
          {fallbackButtonLabel}
        </button>
      </div>
    </div>
  );
}

function DetailMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-bg p-4">
      <div className="text-xs text-text-3">{label}</div>
      <div className="mt-2 text-sm font-medium text-text-1">{value}</div>
    </div>
  );
}

function ScoreRing({ score, label, hint }: { score: number; label: string; hint: string }) {
  const normalized = Math.max(0, Math.min(score, 100));
  const style = {
    background: `conic-gradient(rgb(17 24 39) ${normalized * 3.6}deg, rgb(226 232 240) 0deg)`,
  };

  return (
    <div className="flex flex-col items-center rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full" style={style}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
          <div className="text-3xl font-semibold text-text-1">{formatScore(score)}</div>
          <div className="mt-1 text-xs text-text-3">{label}</div>
        </div>
      </div>
      <div className="mt-4 text-sm text-text-2">{hint}</div>
    </div>
  );
}

function RadarChart({ points }: { points: Array<{ label: string; score: number }> }) {
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const polygon = points
    .map((point, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(points.length, 1);
      const valueRadius = radius * Math.max(0.1, Math.min(point.score, 100) / 100);
      const x = center + Math.cos(angle) * valueRadius;
      const y = center + Math.sin(angle) * valueRadius;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="text-lg font-semibold text-text-1">来源雷达图</div>
      <div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          {[25, 50, 75, 100].map((level) => {
            const levelPoints = points
              .map((_, index) => {
                const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(points.length, 1);
                const levelRadius = radius * (level / 100);
                const x = center + Math.cos(angle) * levelRadius;
                const y = center + Math.sin(angle) * levelRadius;
                return `${x},${y}`;
              })
              .join(' ');
            return <polygon key={level} points={levelPoints} fill="none" stroke="rgb(226 232 240)" strokeWidth="1" />;
          })}
          {points.map((_, index) => {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(points.length, 1);
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="rgb(203 213 225)" strokeWidth="1" />;
          })}
          <polygon points={polygon} fill="rgba(17,24,39,0.12)" stroke="rgb(17 24 39)" strokeWidth="2" />
          {points.map((point, index) => {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(points.length, 1);
            const x = center + Math.cos(angle) * (radius + 22);
            const y = center + Math.sin(angle) * (radius + 22);
            return (
              <text key={point.label} x={x} y={y} textAnchor="middle" fontSize="11" fill="rgb(100 116 139)">
                {point.label}
              </text>
            );
          })}
        </svg>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          {points.map((point) => (
            <div key={point.label} className="rounded-xl bg-bg p-4">
              <div className="text-xs text-text-3">{point.label}</div>
              <div className="mt-2 text-xl font-semibold text-text-1">{formatScore(point.score)}</div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(point.score, 8)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StarScoreInput({
  value,
  maxScore,
  onChange,
}: {
  value: number;
  maxScore: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: maxScore }, (_, index) => {
        const score = index + 1;
        const active = value >= score;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`text-lg transition ${active ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            ★
          </button>
        );
      })}
      <span className="ml-2 text-xs text-text-3">
        {value}/{maxScore}
      </span>
    </div>
  );
}

function scaleByPeriod(base: number, period: PeriodFilter) {
  if (period === 30) return base;
  if (period === 60) return base * 1.8;
  return base * 2.5;
}

function buildDerivedKpis(items: QualityValueRankingItem[], period: PeriodFilter, fallback: QualityAttributionKpi[]) {
  if (!items.length) return fallback;
  const avgMac = items.reduce((sum, item) => sum + Math.abs(item.metricBreakdown.MAC ?? 0), 0) / Math.max(items.length, 1);
  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0) / 10000;
  const totalAb = items.reduce((sum, item) => sum + (item.metricBreakdown['AB收益'] ?? 0), 0);

  return fallback.map((item) => {
    if (item.key === 'MAC') return { ...item, value: Number(scaleByPeriod(avgMac, period).toFixed(1)) };
    if (item.key === 'GMV') return { ...item, value: Number(scaleByPeriod(totalRevenue, period).toFixed(1)) };
    if (item.key === 'AB收益') return { ...item, value: Number(scaleByPeriod(totalAb, period).toFixed(1)) };
    return item;
  });
}

export function QualityHubEntry() {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);
  const defaultView = useGlobalState((s) => s.defaultView);
  const availableViews = useGlobalState((s) => s.availableViews);
  const requestedView = parseViewFromSearch(location.search);
  const resolvedView = getPreferredView(requestedView, currentView, defaultView, availableViews, [
    'consumer',
    'producer',
    'operator',
  ]);

  if (resolvedView === 'consumer') return <Navigate to={`/quality/precheck${location.search}${location.hash}`} replace />;
  return <Navigate to={`/quality/governance${location.search}${location.hash}`} replace />;
}

export function QualityConsumerLanding() {
  const location = useLocation();
  useBreadcrumb([
    { label: '质量', to: '/quality/precheck' },
    { label: '质量预检' },
  ]);

  return (
    <QualityPageFrame
      section="landing"
      title="质量预检"
      subtitle="消费视角默认落到预检入口，继续承接接入前核验、质量徽章和问题反馈。"
      hideTabs
    >
      <div className="space-y-6">
        <ConsumerEntryCards current="precheck" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">预检入口说明</div>
            <div className="mt-2 text-sm text-text-2">
              `/quality` 在消费视角下会默认进入这里，用于承接消费前的接入核验和问题反馈，不改动供给/运营侧 spec。
            </div>
            <div className="mt-4 rounded-xl bg-bg p-4 text-sm text-text-2">
              建议先确认特征状态、字段完整性和调用约束，再进入下游消费链路。
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">质量徽章入口</div>
            <div className="mt-2 text-sm text-text-2">如需查看消费侧沿用的质量信号说明，可直接进入质量徽章页。</div>
            <Link
              to={{ pathname: '/quality/badges', search: buildSearch(location.search, { view: 'consumer' }) }}
              className="mt-4 inline-flex rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
            >
              打开质量徽章
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">消费侧兼容入口</div>
            <div className="mt-2 text-sm text-text-2">本次只在供给/运营视角扩展治理与收益归因能力，不回归消费侧原有质量入口心智。</div>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">供给方新增工作台</div>
            <div className="mt-2 text-sm text-text-2">切到供给或运营视角后，`/quality` 会默认进入治理看板，并保留收益归因与工单入口。</div>
          </div>
        </div>
      </div>
    </QualityPageFrame>
  );
}

export function QualityConsumerBadgesPage() {
  const location = useLocation();
  useBreadcrumb([
    { label: '质量', to: '/quality/precheck' },
    { label: '质量徽章' },
  ]);

  return (
    <QualityPageFrame
      section="landing"
      title="质量徽章"
      subtitle="消费视角保留质量徽章入口，用于解释质量信号和问题反馈方式。"
      hideTabs
    >
      <div className="space-y-6">
        <ConsumerEntryCards current="badges" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">徽章说明</div>
            <div className="mt-2 text-sm text-text-2">这里保留消费侧对质量徽章的理解入口，帮助业务方快速判断特征是否适合继续使用。</div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-bg p-4">
                <div className="text-sm font-medium text-text-1">健康</div>
                <div className="mt-1 text-sm text-text-2">数据稳定、覆盖正常，可继续消费。</div>
              </div>
              <div className="rounded-xl bg-bg p-4">
                <div className="text-sm font-medium text-text-1">警告</div>
                <div className="mt-1 text-sm text-text-2">建议先回到预检入口核对变更说明与影响范围。</div>
              </div>
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">返回预检</div>
            <div className="mt-2 text-sm text-text-2">如果需要继续做消费前确认，可回到默认预检页。</div>
            <Link
              to={{ pathname: '/quality/precheck', search: buildSearch(location.search, { view: 'consumer' }) }}
              className="mt-4 inline-flex rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
            >
              回到质量预检
            </Link>
          </div>
        </div>
      </div>
    </QualityPageFrame>
  );
}

export function QualityGovernancePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const params = new URLSearchParams(location.search);

  const boardMode: GovernanceBoardMode = params.get('board') === 'heatmap' ? 'heatmap' : 'list';
  const statusFilter: QualityStatusFilter =
    params.get('status') && QUALITY_HEALTH_STATUSES.includes(params.get('status') as QualityHealthStatus)
      ? (params.get('status') as QualityHealthStatus)
      : 'all';
  const domainFilter: DomainFilter =
    params.get('domain') && FEATURE_DOMAINS.includes(params.get('domain') as FeatureDomain)
      ? (params.get('domain') as FeatureDomain)
      : 'all';
  const alertTypeFilter: AlertTypeFilter =
    params.get('alertType') && ALERT_TYPES.includes(params.get('alertType') as (typeof ALERT_TYPES)[number])
      ? (params.get('alertType') as (typeof ALERT_TYPES)[number])
      : 'all';
  const sortBy: GovernanceSortKey =
    params.get('sortBy') === 'freshness' ||
    params.get('sortBy') === 'alerts' ||
    params.get('sortBy') === 'tickets' ||
    params.get('sortBy') === 'score'
      ? (params.get('sortBy') as GovernanceSortKey)
      : 'score';
  const sortOrder: SortOrder = params.get('sortOrder') === 'asc' ? 'asc' : 'desc';
  const expandedFeatureId = params.get('feature') ?? '';
  const trendWindow: PeriodFilter = params.get('trendWindow') === '60' ? 60 : params.get('trendWindow') === '90' ? 90 : 30;
  const keyword = params.get('keyword') ?? '';

  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getQualityAlertOverviewApi>> | null>(null);
  const [report, setReport] = useState<Awaited<ReturnType<typeof getQualityHealthReportApi>> | null>(null);
  const [rules, setRules] = useState<QualityAlertRule[]>([]);
  const [healthList, setHealthList] = useState<QualityHealthListItem[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<QualityHealthHeatmapPoint[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [trend, setTrend] = useState<QualityTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [ruleStatusMap, setRuleStatusMap] = useState<Record<string, QualityAlertRule['status']>>({});

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '治理看板' },
  ]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getQualityAlertOverviewApi(), getQualityHealthReportApi(), getQualityAlertRulesApi()])
      .then(([overviewRes, reportRes, rulesRes]) => {
        if (cancelled) return;
        setOverview(overviewRes);
        setReport(reportRes);
        setRules(rulesRes);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '治理看板加载失败');
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
    setBoardLoading(true);
    setError(null);

    Promise.all([
      getQualityHealthListApi({ status: statusFilter, domain: domainFilter, keyword }),
      getQualityHeatmapApi({ status: statusFilter, domain: domainFilter, keyword }),
      getQualityAlertsApi({ healthStatus: statusFilter, alertType: alertTypeFilter }),
    ])
      .then(([healthRes, heatmapRes, alertRes]) => {
        if (cancelled) return;
        setHealthList(healthRes.items);
        setHeatmapPoints(heatmapRes.items);
        setAlerts(alertRes.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '健康度数据加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setBoardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [alertTypeFilter, domainFilter, keyword, statusFilter]);

  useEffect(() => {
    if (!expandedFeatureId) {
      setTrend([]);
      return;
    }

    let cancelled = false;
    setTrendLoading(true);
    getQualityTrendApi({ featureId: expandedFeatureId, windowDays: trendWindow })
      .then((res) => {
        if (cancelled) return;
        setTrend(res.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '质量趋势加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setTrendLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expandedFeatureId, trendWindow]);

  const effectiveRules = useMemo(
    () => rules.map((rule) => ({ ...rule, status: ruleStatusMap[rule.id] ?? rule.status })),
    [ruleStatusMap, rules],
  );

  const sortedHealthList = useMemo(() => {
    const list = [...healthList];
    list.sort((a, b) => {
      const left =
        sortBy === 'score'
          ? a.latestSnapshot.score
          : sortBy === 'freshness'
            ? a.latestSnapshot.freshnessHours
            : sortBy === 'alerts'
              ? a.activeAlertCount
              : a.activeTicketCount;
      const right =
        sortBy === 'score'
          ? b.latestSnapshot.score
          : sortBy === 'freshness'
            ? b.latestSnapshot.freshnessHours
            : sortBy === 'alerts'
              ? b.activeAlertCount
              : b.activeTicketCount;
      return sortOrder === 'asc' ? left - right : right - left;
    });
    return list;
  }, [healthList, sortBy, sortOrder]);

  const selectedFeature = useMemo(() => {
    const healthItem = healthList.find((item) => item.featureId === expandedFeatureId);
    if (healthItem) return healthItem;
    const point = heatmapPoints.find((item) => item.featureId === expandedFeatureId);
    if (!point) return null;
    return {
      featureId: point.featureId,
      featureName: point.featureName,
      featureType: point.featureType,
      featureDomain: point.featureDomain,
      ownerTeamId: 'virtual_team',
      ownerTeamName: point.ownerTeamName,
      updateFrequency: 'daily',
      status: point.status,
      latestSnapshot: {
        id: `${point.featureId}_snapshot`,
        featureId: point.featureId,
        snapshotAt: '',
        score: point.score,
        freshnessHours: point.freshnessHours,
        coverageRate: point.coverageRate,
        stabilityRate: point.stabilityRate,
        latestAlertType: null,
        latestAlertMessage: null,
      },
      latestAlertTitle: null,
      activeAlertCount: 0,
      activeTicketCount: 0,
    } satisfies QualityHealthListItem;
  }, [expandedFeatureId, healthList, heatmapPoints]);

  const maxTrendScore = useMemo(() => Math.max(1, ...trend.map((item) => item.score), 100), [trend]);

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="governance" title="治理看板" subtitle="治理看板承接供给方质量治理、工单入口和告警规则。">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="governance"
      title="治理看板"
      subtitle="告警概览、健康度列表/热力图、工单入口、健康度报告"
      action={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate({ pathname: '/quality/auto-backtest', search: buildSearch(location.search, { view: currentView }) })}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            自动回测
          </button>
          <button
            type="button"
            onClick={() => navigate({ pathname: '/quality/self-review', search: buildSearch(location.search, { view: currentView }) })}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            结构化自评
          </button>
          <button
            type="button"
            onClick={() => navigate({ pathname: '/quality/tickets', search: buildSearch(location.search, { view: currentView }) })}
            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            查看治理工单
          </button>
        </div>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">正在加载治理看板...</div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-6">
            <MetricCard title="全量特征" value={formatNumber(overview?.totalFeatures ?? 0)} hint="纳入质量治理覆盖范围" />
            <MetricCard
              title="健康"
              value={formatNumber(overview?.healthyCount ?? 0)}
              hint="点击联动健康状态筛选"
              active={statusFilter === 'healthy'}
              onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'healthy' ? null : 'healthy' }) })}
            />
            <MetricCard
              title="警告"
              value={formatNumber(overview?.warningCount ?? 0)}
              hint="点击联动健康状态筛选"
              active={statusFilter === 'warning'}
              onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'warning' ? null : 'warning' }) })}
            />
            <MetricCard
              title="严重"
              value={formatNumber(overview?.criticalCount ?? 0)}
              hint="点击联动健康状态筛选"
              active={statusFilter === 'critical'}
              onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'critical' ? null : 'critical' }) })}
            />
            <MetricCard title="待处理告警" value={formatNumber(overview?.openAlertCount ?? 0)} hint="当前仍需排查的告警数" />
            <MetricCard title="平均分" value={`${overview?.avgScore ?? 0}`} hint="全局健康度均值" />
          </section>

          <section className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-lg font-semibold text-text-1">健康度看板</div>
                <div className="mt-1 text-sm text-text-2">列表与热力图共用同一批数据，点击特征可展开近 30/60/90 天趋势。</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { board: 'list' }) })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${boardMode === 'list' ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
                >
                  列表
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { board: 'heatmap' }) })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${boardMode === 'heatmap' ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
                >
                  热力图
                </button>
                <button
                  type="button"
                  onClick={() => setRulesOpen((value) => !value)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                >
                  {rulesOpen ? '收起告警规则' : '配置告警规则'}
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_1fr]">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate({ pathname: location.pathname, search: buildSearch(location.search, { keyword: draftKeyword || null }) });
                }}
              >
                <input
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  placeholder="搜特征、团队"
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
                />
                <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">
                  搜索
                </button>
              </form>

              <select
                value={domainFilter}
                onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { domain: e.target.value === 'all' ? null : e.target.value }) })}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
              >
                <option value="all">全部域</option>
                {FEATURE_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {featureDomainLabel(domain)}
                  </option>
                ))}
              </select>

              <select
                value={alertTypeFilter}
                onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { alertType: e.target.value === 'all' ? null : e.target.value }) })}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
              >
                <option value="all">全部告警类型</option>
                {ALERT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {alertTypeLabel(item)}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                {(['score', 'freshness', 'alerts', 'tickets'] as GovernanceSortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      navigate({
                        pathname: location.pathname,
                        search: buildSearch(location.search, {
                          sortBy: key,
                          sortOrder: sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc',
                        }),
                      })
                    }
                    className={`rounded-lg px-3 py-2 font-medium ${
                      sortBy === key ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'
                    }`}
                  >
                    {key === 'score' ? '按分数' : key === 'freshness' ? '按时效' : key === 'alerts' ? '按告警' : '按工单'}
                    {sortBy === key ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : ''}
                  </button>
                ))}
              </div>
            </div>

            {rulesOpen ? (
              <div className="mt-5 rounded-2xl border border-border bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-1">告警规则配置</div>
                    <div className="mt-1 text-xs text-text-3">提供最小启停交互，不修改现有规则阈值结构。</div>
                  </div>
                  <div className="text-xs text-text-3">
                    已启用 {effectiveRules.filter((rule) => rule.status === 'enabled').length} / {effectiveRules.length}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {effectiveRules.map((rule) => (
                    <div key={rule.id} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-text-1">{rule.name}</div>
                          <div className="mt-1 text-xs text-text-3">
                            {alertTypeLabel(rule.alertType)} · {rule.metricLabel} {rule.comparator} {rule.thresholdValue}
                          </div>
                          <div className="mt-2 text-xs text-text-3">归属团队 {rule.ownerTeamName}，最近触发 {formatDateTime(rule.latestTriggeredAt)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setRuleStatusMap((current) => ({
                              ...current,
                              [rule.id]: (current[rule.id] ?? rule.status) === 'enabled' ? 'disabled' : 'enabled',
                            }))
                          }
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            (ruleStatusMap[rule.id] ?? rule.status) === 'enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {(ruleStatusMap[rule.id] ?? rule.status) === 'enabled' ? '已启用' : '已停用'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {boardLoading ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载健康度数据...</div>
            ) : boardMode === 'list' ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1.4fr_1fr_100px_90px_90px_110px] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                  <div>特征</div>
                  <div>域 / 团队</div>
                  <div>健康度</div>
                  <div>时效</div>
                  <div>告警/工单</div>
                  <div />
                </div>
                {sortedHealthList.map((item) => {
                  const expanded = expandedFeatureId === item.featureId;
                  return (
                    <div key={item.featureId} className="border-t border-border bg-white px-4 py-4">
                      <div className="grid grid-cols-[1.4fr_1fr_100px_90px_90px_110px] items-center gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-text-1">{item.featureName}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-3">
                            <span>{item.featureId}</span>
                            <span>{featureTypeLabel(item.featureType)}</span>
                            <span className={`rounded-full border px-2 py-0.5 ${healthStatusClass(item.status)}`}>{formatHealthStatus(item.status)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-text-2">
                          <div>{featureDomainLabel(item.featureDomain)}</div>
                          <div className="mt-1 text-xs text-text-3">{item.ownerTeamName}</div>
                        </div>
                        <div className="text-sm font-semibold text-text-1">{item.latestSnapshot.score}</div>
                        <div className="text-sm text-text-2">{item.latestSnapshot.freshnessHours}h</div>
                        <div className="text-sm text-text-2">{item.activeAlertCount} / {item.activeTicketCount}</div>
                        <div className="flex justify-end gap-2">
                          <Link
                            to={{ pathname: `/quality/health-score/${item.featureId}`, search: buildSearch(location.search, { view: currentView }) }}
                            className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                          >
                            健康度分解
                          </Link>
                          <button
                            type="button"
                            onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { feature: expanded ? null : item.featureId }) })}
                            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                          >
                            {expanded ? '收起趋势' : '展开趋势'}
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="mt-4 rounded-xl bg-bg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-text-1">{item.featureName} 质量趋势</div>
                              <div className="mt-1 text-xs text-text-3">
                                覆盖率 {formatRatio(item.latestSnapshot.coverageRate)}，稳定性 {formatRatio(item.latestSnapshot.stabilityRate)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {[30, 60, 90].map((window) => (
                                <button
                                  key={window}
                                  type="button"
                                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { feature: item.featureId, trendWindow: window }) })}
                                  className={`rounded-lg px-3 py-2 text-xs font-medium ${trendWindow === window ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
                                >
                                  近 {window} 天
                                </button>
                              ))}
                            </div>
                          </div>

                          {trendLoading ? (
                            <div className="mt-4 text-sm text-text-3">正在加载趋势...</div>
                          ) : (
                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                              {trend.map((point) => (
                                <div key={point.date} className="rounded-xl border border-border bg-white p-3">
                                  <div className="text-xs text-text-3">{formatDate(point.date)}</div>
                                  <div className="mt-2 text-lg font-semibold text-text-1">{point.score}</div>
                                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                                    <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(12, (point.score / maxTrendScore) * 100)}%` }} />
                                  </div>
                                  <div className="mt-2 space-y-1 text-[11px] text-text-3">
                                    <div>覆盖率 {formatRatio(point.coverageRate)}</div>
                                    <div>稳定性 {formatRatio(point.stabilityRate)}</div>
                                    <div>告警 {point.alertCount}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {sortedHealthList.length === 0 ? <div className="border-t border-border bg-white px-4 py-8 text-center text-sm text-text-3">当前筛选下暂无特征。</div> : null}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {heatmapPoints.map((item) => (
                  <button
                    key={item.featureId}
                    type="button"
                    onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { feature: expandedFeatureId === item.featureId ? null : item.featureId }) })}
                    className={`rounded-card border p-4 text-left shadow-sm transition ${
                      expandedFeatureId === item.featureId ? 'border-module-dashboard/40 bg-module-dashboard/5' : 'border-border bg-white hover:border-module-dashboard/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-1">{item.featureName}</div>
                        <div className="mt-1 text-xs text-text-3">{featureDomainLabel(item.featureDomain)} · {item.ownerTeamName}</div>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${healthStatusClass(item.status)}`}>{formatHealthStatus(item.status)}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-bg p-2">
                        <div className="text-[11px] text-text-3">分数</div>
                        <div className="mt-1 text-sm font-semibold text-text-1">{item.score}</div>
                      </div>
                      <div className="rounded-lg bg-bg p-2">
                        <div className="text-[11px] text-text-3">覆盖率</div>
                        <div className="mt-1 text-sm font-semibold text-text-1">{formatRatio(item.coverageRate)}</div>
                      </div>
                      <div className="rounded-lg bg-bg p-2">
                        <div className="text-[11px] text-text-3">时效</div>
                        <div className="mt-1 text-sm font-semibold text-text-1">{item.freshnessHours}h</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedFeature && boardMode === 'heatmap' ? (
              <div className="mt-5 rounded-2xl border border-border bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-1">{selectedFeature.featureName} 质量趋势</div>
                    <div className="mt-1 text-xs text-text-3">从热力图直接展开趋势与最近快照指标。</div>
                  </div>
                  <div className="flex gap-2">
                    {[30, 60, 90].map((window) => (
                      <button
                        key={window}
                        type="button"
                        onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { feature: selectedFeature.featureId, trendWindow: window }) })}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${trendWindow === window ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
                      >
                        近 {window} 天
                      </button>
                    ))}
                  </div>
                </div>
                {trendLoading ? (
                  <div className="mt-4 text-sm text-text-3">正在加载趋势...</div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {trend.map((point) => (
                      <div key={point.date} className="rounded-xl border border-border bg-white p-3">
                        <div className="text-xs text-text-3">{formatDate(point.date)}</div>
                        <div className="mt-2 text-lg font-semibold text-text-1">{point.score}</div>
                        <div className="mt-1 text-xs text-text-3">覆盖率 {formatRatio(point.coverageRate)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-text-1">告警列表</div>
                  <div className="mt-1 text-sm text-text-2">已按当前健康状态和告警类型联动筛选，共 {alerts.length} 条。</div>
                </div>
                <div className="text-xs text-text-3">筛选状态: {statusFilter === 'all' ? '全部' : formatHealthStatus(statusFilter)}</div>
              </div>

              <div className="mt-5 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-medium text-text-1">{alert.title}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${healthStatusClass(alert.healthStatus)}`}>{formatHealthStatus(alert.healthStatus)}</span>
                        </div>
                        <div className="mt-1 text-xs text-text-3">{alert.featureName} · {alert.ownerTeamName} · {alertTypeLabel(alert.alertType)}</div>
                        <div className="mt-2 text-sm text-text-2">{alert.summary}</div>
                      </div>
                      <div className="text-right text-xs text-text-3">
                        <div>{formatDateTime(alert.triggeredAt)}</div>
                        <div className="mt-1">当前值 {alert.currentValue} / 阈值 {alert.thresholdValue}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {alert.relatedTicketId ? (
                        <Link
                          to={{ pathname: `/quality/tickets/${alert.relatedTicketId}`, search: buildSearch(location.search, { view: currentView }) }}
                          className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                        >
                          查看关联工单
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { feature: alert.featureId }) })}
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                      >
                        展开特征趋势
                      </button>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">当前筛选下暂无告警。</div> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div id="ticket-entry" className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="text-lg font-semibold text-text-1">工单入口</div>
                <div className="mt-2 text-sm text-text-2">当前打开/处理中工单 {overview?.openTicketCount ?? 0} 条，治理动作统一进入工单中心。</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">启用规则</div>
                    <div className="mt-2 text-2xl font-semibold text-text-1">{overview?.enabledRuleCount ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">活跃工单</div>
                    <div className="mt-2 text-2xl font-semibold text-text-1">{overview?.openTicketCount ?? 0}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate({ pathname: '/quality/auto-backtest', search: buildSearch(location.search, { view: currentView }) })}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                  >
                    查看自动回测
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ pathname: '/quality/tickets', search: buildSearch(location.search, { view: currentView }) })}
                    className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    进入工单列表
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ pathname: '/quality/tickets', search: buildSearch(location.search, { view: currentView, status: 'open' }) })}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                  >
                    查看待处理工单
                  </button>
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="text-lg font-semibold text-text-1">健康度报告</div>
                <div className="mt-2 text-sm text-text-2">最近 {report?.windowDays ?? 30} 天均分 {report?.avgScore ?? '--'}，报告生成于 {formatDateTime(report?.generatedAt ?? null)}。</div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">健康</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-600">{report?.healthyCount ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">警告</div>
                    <div className="mt-2 text-2xl font-semibold text-amber-600">{report?.warningCount ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">严重</div>
                    <div className="mt-2 text-2xl font-semibold text-rose-600">{report?.criticalCount ?? 0}</div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-medium text-text-1">Top 风险</div>
                  <div className="mt-3 space-y-3">
                    {report?.topRisks.map((risk) => (
                      <div key={risk.featureId} className="rounded-xl border border-border bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-text-1">{risk.featureName}</div>
                            <div className="mt-1 text-xs text-text-3">{risk.ownerTeamName}</div>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${healthStatusClass(risk.status)}`}>{formatHealthStatus(risk.status)}</span>
                        </div>
                        <div className="mt-2 text-sm text-text-2">{risk.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-medium text-text-1">建议动作</div>
                  <div className="mt-3 space-y-2 text-sm text-text-2">
                    {report?.recommendations.map((item) => (
                      <div key={item} className="rounded-xl bg-bg px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </QualityPageFrame>
  );
}

export function QualityAutoBacktestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const userPermission = useGlobalState((s) => s.userPermission);
  const params = new URLSearchParams(location.search);

  const statusFilter =
    params.get('status') && BACKTEST_JOB_STATUSES.includes(params.get('status') as BacktestJobStatus)
      ? (params.get('status') as BacktestJobStatus)
      : 'all';
  const scenarioFilter =
    params.get('scenario') && BACKTEST_SCENARIOS.includes(params.get('scenario') as BacktestScenario)
      ? (params.get('scenario') as BacktestScenario)
      : 'all';
  const featureTypeFilter =
    params.get('featureType') && FEATURE_TYPE_OPTIONS.includes(params.get('featureType') as FeatureType)
      ? (params.get('featureType') as FeatureType)
      : 'all';
  const keyword = params.get('keyword') ?? '';
  const page = Math.max(Number(params.get('page') ?? '1') || 1, 1);
  const pageSize = params.get('pageSize') === '20' ? 20 : 10;
  const selectedJobId = params.get('job') ?? '';

  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getBacktestOverviewApi>> | null>(null);
  const [jobs, setJobs] = useState<BacktestJob[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<BacktestJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    featureType: featureTypeFilter === 'all' ? 'rule' : featureTypeFilter,
    scenario: scenarioFilter === 'all' ? 'future_behavior' : scenarioFilter,
    sampleWindowDays: '14',
  });
  const enabledActions = userPermission?.enabledActions ?? [];

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '自动回测' },
  ]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getBacktestOverviewApi(),
      getBacktestJobsApi({
        status: statusFilter,
        scenario: scenarioFilter,
        featureType: featureTypeFilter,
        keyword,
        page,
        pageSize,
      }),
    ])
      .then(([overviewRes, jobsRes]) => {
        if (cancelled) return;
        setOverview(overviewRes);
        setJobs(jobsRes.items);
        setTotal(jobsRes.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '自动回测加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureTypeFilter, keyword, page, pageSize, scenarioFilter, statusFilter]);

  useEffect(() => {
    if (!selectedJobId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    getBacktestJobDetailApi(selectedJobId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '回测详情加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canViewBacktest = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.backtestView,
    QUALITY_ACTIONS.backtestCreate,
    QUALITY_ACTIONS.backtestScheduleManage,
  ]);
  const canCreate = hasAction(enabledActions, QUALITY_ACTIONS.backtestCreate);
  const canManageSchedule = hasAction(enabledActions, QUALITY_ACTIONS.backtestScheduleManage);
  const canManageTemplates = hasAction(enabledActions, QUALITY_ACTIONS.selfReviewTemplateManage);
  const detailGateEvaluation = getBacktestGateEvaluation(detail);
  const capabilityHint = canManageSchedule
    ? '当前角色可创建任务、维护调度门禁，并联动治理工单。'
    : canManageTemplates
      ? '当前角色可创建任务，并继续承接模板/门禁治理。'
      : canCreate
        ? '当前角色可创建任务，并查看 Part 2 门禁联动结果。'
        : '当前角色仅可查看结果。';

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="auto-backtest" title="自动回测" subtitle="自动回测承接巡检、结果漂移和失败建单。">
        <RestrictedViewPanel
          title="消费视角不承接自动回测"
          description="自动回测页仅在供给侧质量工作台中使用；消费视角请回到预检或切到供给视角继续处理门禁问题。"
          producerTarget="/quality/auto-backtest"
        />
      </QualityPageFrame>
    );
  }

  if (!canViewBacktest) {
    return (
      <QualityPageFrame section="auto-backtest" title="自动回测" subtitle="自动回测承接巡检、结果漂移和失败建单。">
        <RestrictedViewPanel
          title="当前角色无自动回测权限"
          description="自动回测仅向 `producer`、`producer_admin`、`platform_admin` 开放；当前可回到治理看板或切到具备权限的供给视角。"
          producerTarget="/quality/auto-backtest"
          fallbackTarget="/quality/governance"
          fallbackButtonLabel="返回治理看板"
        />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="auto-backtest"
      title="自动回测"
      subtitle="巡检概览、任务列表、详情抽屉和新建回测任务入口"
      action={
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          新建回测任务
        </button>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <MetricCard title="总任务数" value={formatNumber(overview?.totalJobs ?? 0)} hint="已纳入自动化回测的任务数" />
        <MetricCard title="待执行" value={formatNumber(overview?.pendingCount ?? 0)} hint="pending 状态任务" active={statusFilter === 'pending'} onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'pending' ? null : 'pending', page: 1 }) })} />
        <MetricCard title="执行中" value={formatNumber(overview?.runningCount ?? 0)} hint="running 状态任务" active={statusFilter === 'running'} onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'running' ? null : 'running', page: 1 }) })} />
        <MetricCard title="已完成" value={formatNumber(overview?.completedCount ?? 0)} hint="completed 状态任务" active={statusFilter === 'completed'} onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'completed' ? null : 'completed', page: 1 }) })} />
        <MetricCard title="执行失败" value={formatNumber(overview?.failedCount ?? 0)} hint="failed 状态任务" active={statusFilter === 'failed'} onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: statusFilter === 'failed' ? null : 'failed', page: 1 }) })} />
        <MetricCard title="漂移告警" value={formatNumber(overview?.driftAlertCount ?? 0)} hint={`覆盖 ${overview?.featureCoverageCount ?? 0} 个特征，平均准确率 ${((overview?.avgAccuracy ?? 0) * 100).toFixed(1)}%`} />
      </section>

      <section className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-lg font-semibold text-text-1">回测任务列表</div>
            <div className="mt-1 text-sm text-text-2">覆盖 `pending/running/completed/failed` 与 `future_behavior/mask_interest` 两类场景。</div>
          </div>
          <div className="text-xs text-text-3">{capabilityHint}</div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_180px]">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ pathname: location.pathname, search: buildSearch(location.search, { keyword: draftKeyword || null, page: 1 }) });
            }}
          >
            <input
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              placeholder="搜任务、特征、团队"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
            />
            <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">
              搜索
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: e.target.value === 'all' ? null : e.target.value, page: 1 }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部状态</option>
            {BACKTEST_JOB_STATUSES.map((item) => (
              <option key={item} value={item}>
                {backtestStatusLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={scenarioFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { scenario: e.target.value === 'all' ? null : e.target.value, page: 1 }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部场景</option>
            {BACKTEST_SCENARIOS.map((item) => (
              <option key={item} value={item}>
                {backtestScenarioLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={featureTypeFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { featureType: e.target.value === 'all' ? null : e.target.value, page: 1 }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部特征类型</option>
            {FEATURE_TYPE_OPTIONS.map((item: FeatureType) => (
              <option key={item} value={item}>
                {featureTypeLabel(item)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载回测任务...</div>
        ) : (
          <>
            <div className="mt-5 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1.3fr_120px_120px_90px_110px_110px_120px] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                <div>任务 / 特征</div>
                <div>场景</div>
                <div>状态</div>
                <div>窗口</div>
                <div>准确率</div>
                <div>漂移</div>
                <div>动作</div>
              </div>
              {jobs.map((job) => (
                <div key={job.id} className="grid grid-cols-[1.3fr_120px_120px_90px_110px_110px_120px] items-center gap-3 border-t border-border bg-white px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-text-1">{job.featureName}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-3">
                      <span>{job.id}</span>
                      <span>{job.featureId}</span>
                      <span>{featureTypeLabel(job.featureType)}</span>
                    </div>
                  </div>
                  <div className="text-text-2">{backtestScenarioLabel(job.scenario)}</div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${backtestStatusClass(job.status)}`}>{backtestStatusLabel(job.status)}</span>
                  </div>
                  <div className="text-text-2">{job.sampleWindowDays} 天</div>
                  <div className="font-medium text-text-1">{job.metrics ? `${(job.metrics.accuracy * 100).toFixed(1)}%` : '--'}</div>
                  <div className={job.driftAlert ? 'font-medium text-rose-600' : 'text-text-2'}>{job.metrics ? formatSignedScore(job.metrics.accuracyDelta * 100) : '--'}pp</div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { job: job.id }) })}
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 ? <div className="border-t border-border bg-white px-4 py-8 text-center text-sm text-text-3">当前筛选下暂无回测任务。</div> : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-text-3">共 {total} 条，当前第 {page} / {totalPages} 页</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { page: page - 1 }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { page: page + 1 }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 disabled:opacity-50"
                >
                  下一页
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { pageSize: pageSize === 10 ? 20 : 10, page: 1 }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2"
                >
                  {pageSize === 10 ? '切到 20 / 页' : '切到 10 / 页'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedJobId ? (
        <section className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
          {detailLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载回测详情...</div>
          ) : !detail ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">未找到对应回测任务。</div>
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-text-1">{detail.featureName}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${backtestStatusClass(detail.status)}`}>{backtestStatusLabel(detail.status)}</span>
                    {detail.driftAlert ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">漂移告警</span> : null}
                    {detail.metrics ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${detailGateEvaluation.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {detailGateEvaluation.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm text-text-2">
                    {detail.id} · {backtestScenarioLabel(detail.scenario)} · {backtestTriggerLabel(detail.triggerType)} · {detail.ownerTeamName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { job: null }) })}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                >
                  收起详情
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-xs text-text-3">样本量</div>
                  <div className="mt-2 text-2xl font-semibold text-text-1">{formatLargeNumber(detail.metrics?.sampleSize ?? 0)}</div>
                </div>
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-xs text-text-3">Accuracy</div>
                  <div className="mt-2 text-2xl font-semibold text-text-1">{detail.metrics ? `${(detail.metrics.accuracy * 100).toFixed(1)}%` : '--'}</div>
                </div>
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-xs text-text-3">Recall@K</div>
                  <div className="mt-2 text-2xl font-semibold text-text-1">{detail.metrics ? `${(detail.metrics.recallAtK * 100).toFixed(1)}%` : '--'}</div>
                </div>
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-xs text-text-3">AUC / Lift</div>
                  <div className="mt-2 text-2xl font-semibold text-text-1">{detail.metrics ? `${detail.metrics.auc.toFixed(3)} / ${detail.metrics.lift.toFixed(2)}` : '--'}</div>
                </div>
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-xs text-text-3">静态 vs 回测</div>
                  <div className={`mt-2 text-2xl font-semibold ${detail.metrics && detail.metrics.accuracyDelta <= -0.05 ? 'text-rose-600' : 'text-text-1'}`}>
                    {detail.metrics ? `${formatSignedScore(detail.metrics.accuracyDelta * 100)}pp` : '--'}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-border bg-white p-5">
                  <div className="text-base font-semibold text-text-1">近 30 次趋势</div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {detail.recentTrend.slice(-12).map((point) => (
                      <div key={point.date} className="rounded-xl bg-bg p-3">
                        <div className="text-[11px] text-text-3">{formatDate(point.date)}</div>
                        <div className="mt-2 text-lg font-semibold text-text-1">{(point.accuracy * 100).toFixed(1)}%</div>
                        <div className="mt-2 h-2 rounded-full bg-gray-200">
                          <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(point.accuracy * 100, 8)}%` }} />
                        </div>
                        <div className="mt-2 text-[11px] text-text-3">drift {point.driftScore.toFixed(3)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-white p-5">
                    <div className="text-base font-semibold text-text-1">漂移卡片</div>
                    {detail.metrics ? (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-bg p-4 text-sm text-text-2">
                          静态评测准确率 {(detail.metrics.staticAccuracy * 100).toFixed(1)}%，回测准确率 {(detail.metrics.accuracy * 100).toFixed(1)}%，场景门禁阈值 {(detail.metrics.gateThreshold * 100).toFixed(1)}%。
                        </div>
                        <div className={`rounded-xl border px-4 py-3 text-sm ${detail.driftAlert ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                          {detail.driftAlert ? '当前任务偏差超过阈值，建议立即建单并联动治理。' : '当前任务偏差在可接受范围内，可继续观察。'}
                        </div>
                        <div className={`rounded-xl border px-4 py-3 text-sm ${detailGateEvaluation.passed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          {detailGateEvaluation.passed
                            ? `${detailGateEvaluation.detail} 已满足 Part 2 的回测准确率条件。`
                            : `${detailGateEvaluation.detail} 当前会阻塞 Part 2 继续推进。`}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl bg-bg p-4 text-sm text-text-2">{detail.failureReason ?? '当前任务尚未产出指标。'}</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-white p-5">
                    <div className="text-base font-semibold text-text-1">异常点 / 工单联动</div>
                    <div className="mt-4 space-y-3 text-sm text-text-2">
                      <div className="rounded-xl bg-bg p-4">
                        {detail.status === 'failed'
                          ? detail.failureReason ?? '执行失败，请排查回放链路。'
                          : detail.driftAlert
                            ? '检测到静态评测与回测偏差异常，建议走治理工单。'
                            : '暂无异常点，建议继续巡检。'}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {detail.relatedTicketId ? (
                          <Link
                            to={{ pathname: `/quality/tickets/${detail.relatedTicketId}`, search: buildSearch(location.search, { view: currentView }) }}
                            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            查看关联工单
                          </Link>
                        ) : (
                          <Link
                            to={{ pathname: '/quality/tickets', search: buildSearch(location.search, { view: currentView, status: 'open' }) }}
                            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                          >
                            一键建单
                          </Link>
                        )}
                        <Link
                          to={{ pathname: `/quality/health-score/${detail.featureId}`, search: buildSearch(location.search, { view: currentView }) }}
                          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                        >
                          查看健康度分解
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      {createOpen ? (
        <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-text-1">新建回测任务</div>
              <div className="mt-1 text-sm text-text-2">P0 先提供新建入口和参数预设，任务最终仍落在自动化回测列表中。</div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
            >
              关闭
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <select
              value={createDraft.featureType}
              onChange={(e) => setCreateDraft((current) => ({ ...current, featureType: e.target.value as FeatureType }))}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
            >
              {FEATURE_TYPE_OPTIONS.map((item: FeatureType) => (
                <option key={item} value={item}>
                  {featureTypeLabel(item)}
                </option>
              ))}
            </select>
            <select
              value={createDraft.scenario}
              onChange={(e) => setCreateDraft((current) => ({ ...current, scenario: e.target.value as BacktestScenario }))}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
            >
              {BACKTEST_SCENARIOS.map((item) => (
                <option key={item} value={item}>
                  {backtestScenarioLabel(item)}
                </option>
              ))}
            </select>
            <select
              value={createDraft.sampleWindowDays}
              onChange={(e) => setCreateDraft((current) => ({ ...current, sampleWindowDays: e.target.value }))}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
            >
              <option value="7">近 7 天样本</option>
              <option value="14">近 14 天样本</option>
              <option value="30">近 30 天样本</option>
            </select>
          </div>
          <div className="mt-4 rounded-xl bg-bg p-4 text-sm text-text-2">
            已预设 {featureTypeLabel(createDraft.featureType)} · {backtestScenarioLabel(createDraft.scenario)} · {createDraft.sampleWindowDays} 天样本。
            本次不改动额外 spec，仅保留任务创建入口与后续回放参数说明。
          </div>
        </div>
      ) : null}
    </QualityPageFrame>
  );
}

export function QualitySelfReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const userPermission = useGlobalState((s) => s.userPermission);
  const params = new URLSearchParams(location.search);
  const featureType =
    params.get('featureType') && FEATURE_TYPE_OPTIONS.includes(params.get('featureType') as FeatureType)
      ? (params.get('featureType') as FeatureType)
      : 'rule';
  const featureId = params.get('featureId') ?? '';

  const [template, setTemplate] = useState<SelfReviewTemplate | null>(null);
  const [records, setRecords] = useState<SelfReviewRecord[]>([]);
  const [latestBacktestJob, setLatestBacktestJob] = useState<BacktestJob | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [draftItems, setDraftItems] = useState<SelfReviewItem[]>([]);
  const [draftStatus, setDraftStatus] = useState<'draft' | 'submitted' | 'passed' | 'failed'>('draft');
  const [loading, setLoading] = useState(true);
  const [runningPrecheck, setRunningPrecheck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '结构化自评' },
  ]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [templateRes, recordsRes] = await Promise.all([getSelfReviewTemplateByFeatureTypeApi(featureType), getSelfReviewRecordsApi()]);
        if (cancelled) return;
        setTemplate(templateRes);
        setRecords(recordsRes.items);

        const matchedRecord =
          (featureId ? recordsRes.items.find((item) => item.featureId === featureId) : undefined) ??
          recordsRes.items.find((item) => item.featureType === featureType) ??
          recordsRes.items[0];

        const nextFeatureId = featureId || matchedRecord?.featureId || '';
        if (!featureId && nextFeatureId) {
          navigate({ pathname: location.pathname, search: buildSearch(location.search, { featureType, featureId: nextFeatureId }) }, { replace: true });
        }

        setDraftItems(
          matchedRecord?.featureType === featureType
            ? matchedRecord.items.map((item) => ({ ...item }))
            : (templateRes?.items ?? []).map((item) => ({ ...item, score: Math.ceil(item.maxScore * 0.75), comment: '' })),
        );
        setDraftStatus(matchedRecord?.status ?? 'draft');

        if (!nextFeatureId) {
          setAiSuggestions([]);
          setLatestBacktestJob(null);
          return;
        }

        const [suggestionsRes, backtestRes] = await Promise.all([
          getSelfReviewAiSuggestionsApi(nextFeatureId),
          getBacktestJobsApi({ keyword: nextFeatureId, page: 1, pageSize: 100 }),
        ]);
        if (cancelled) return;
        setAiSuggestions(suggestionsRes);
        setLatestBacktestJob(getLatestCompletedBacktest(backtestRes.items, nextFeatureId));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '结构化自评加载失败');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [featureId, featureType, location.pathname, location.search, navigate]);

  const groupedItems = useMemo(() => {
    const map = new Map<string, SelfReviewItem[]>();
    draftItems.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [draftItems]);

  const totalScore = useMemo(() => draftItems.reduce((sum, item) => sum + (item.score ?? 0), 0), [draftItems]);
  const maxScore = useMemo(() => draftItems.reduce((sum, item) => sum + item.maxScore, 0), [draftItems]);
  const progressRate = maxScore ? totalScore / maxScore : 0;
  const enabledActions = userPermission?.enabledActions ?? [];
  const canViewSelfReview = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.selfReviewView,
    QUALITY_ACTIONS.selfReviewSubmit,
    QUALITY_ACTIONS.selfReviewTemplateManage,
  ]);
  const canSubmitSelfReview = hasAction(enabledActions, QUALITY_ACTIONS.selfReviewSubmit);
  const canManageTemplate = hasAction(enabledActions, QUALITY_ACTIONS.selfReviewTemplateManage);
  const selfReviewPassed = totalScore >= (template?.passingScore ?? Number.MAX_SAFE_INTEGER);
  const backtestGateEvaluation = getBacktestGateEvaluation(latestBacktestJob);
  const gatePassed = selfReviewPassed && backtestGateEvaluation.passed;
  const visibleHistory = useMemo(
    () =>
      records
        .filter((item) => item.featureType === featureType || item.featureId === featureId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [featureId, featureType, records],
  );

  const updateDraftItem = (itemId: string, updater: (item: SelfReviewItem) => SelfReviewItem) => {
    setDraftItems((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="self-review" title="结构化自评" subtitle="模板、自动预检、AI 建议和历史记录。">
        <RestrictedViewPanel
          title="消费视角不承接结构化自评"
          description="结构化自评属于供给侧门禁动作；消费视角请回到预检入口，或切到供给视角继续补齐发布证据。"
          producerTarget="/quality/self-review"
        />
      </QualityPageFrame>
    );
  }

  if (!canViewSelfReview) {
    return (
      <QualityPageFrame section="self-review" title="结构化自评" subtitle="模板、自动预检、AI 建议和历史记录。">
        <RestrictedViewPanel
          title="当前角色无结构化自评权限"
          description="结构化自评仅向 `producer`、`producer_admin`、`platform_admin` 开放；如需继续治理，请回到治理看板查看结果。"
          producerTarget="/quality/self-review"
          fallbackTarget="/quality/governance"
          fallbackButtonLabel="返回治理看板"
        />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="self-review"
      title="结构化自评"
      subtitle="按特征类型加载模板，支持自动预检、星级打分、评语、AI 建议和历史记录"
      action={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setRunningPrecheck(true);
              window.setTimeout(() => setRunningPrecheck(false), 600);
            }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            {runningPrecheck ? '自动预检中...' : '触发自动预检'}
          </button>
          <button
            type="button"
            onClick={() => setDraftStatus('draft')}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            暂存草稿
          </button>
          <button
            type="button"
            disabled={!canSubmitSelfReview}
            onClick={() => setDraftStatus(gatePassed ? 'passed' : 'failed')}
            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            提交自评
          </button>
        </div>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-semibold text-text-1">模板与范围</div>
                <div className="mt-1 text-sm text-text-2">{template?.description ?? '正在加载模板...'}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={featureType}
                  onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { featureType: e.target.value, featureId: null }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
                >
                  {FEATURE_TYPE_OPTIONS.map((item: FeatureType) => (
                    <option key={item} value={item}>
                      {featureTypeLabel(item)}
                    </option>
                  ))}
                </select>
                <select
                  value={featureId}
                  onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { featureType, featureId: e.target.value || null }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
                >
                  <option value="">选择历史样本</option>
                  {records.map((item) => (
                    <option key={item.id} value={item.featureId}>
                      {item.featureName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载自评模板...</div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">模板版本</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{template?.version ?? '--'}</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">当前进度</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">{(progressRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">总分 / 阈值</div>
                    <div className="mt-2 text-xl font-semibold text-text-1">
                      {totalScore} / {template?.passingScore ?? '--'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">回测门禁</div>
                    <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${backtestGateEvaluation.available ? (backtestGateEvaluation.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700') : 'bg-slate-100 text-slate-700'}`}>
                      {backtestGateEvaluation.badge}
                    </div>
                    <div className="mt-2 text-xs text-text-3">{backtestGateEvaluation.detail}</div>
                  </div>
                  <div className="rounded-xl bg-bg p-4">
                    <div className="text-xs text-text-3">门禁结果</div>
                    <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${selfReviewStatusClass(draftStatus === 'draft' ? 'submitted' : draftStatus)}`}>
                      {draftStatus === 'draft' ? '草稿中' : gatePassed ? '可推进 evaluating' : '将回退 draft'}
                    </div>
                  </div>
                </div>

                <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${gatePassed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  {gatePassed
                    ? '当前已满足 Part 2 门禁：自评分达到模板阈值，且回测准确率未触发拦截。'
                    : selfReviewPassed
                      ? `当前自评分已达标，但${backtestGateEvaluation.available ? '最近一次回测准确率未达到门禁阈值，提交后仍会回退到 draft。' : '仍建议补齐自动回测结果后再推进。'}`
                      : '当前自评分未达到模板阈值，提交后会提示回退到 draft 并补充缺失项。'}
                </div>
              </>
            )}
          </div>

          {!loading &&
            groupedItems.map(([group, items]) => (
              <div key={group} className="rounded-card border border-border bg-surface p-6 shadow-sm">
                <div className="text-lg font-semibold text-text-1">{group}</div>
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-sm font-medium text-text-1">{item.title}</div>
                          <div className="mt-1 text-sm text-text-2">{item.description}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-3">
                            <span className={`rounded-full border px-2 py-0.5 ${autoCheckStatusClass(item.autoCheckStatus)}`}>{autoCheckStatusLabel(item.autoCheckStatus)}</span>
                            <span>自动规则: {item.autoCheckRule}</span>
                            <span>上限 {item.maxScore} 星</span>
                          </div>
                        </div>
                        <StarScoreInput
                          value={item.score ?? 0}
                          maxScore={item.maxScore}
                          onChange={(score) => updateDraftItem(item.id, (current) => ({ ...current, score }))}
                        />
                      </div>
                      <div className="mt-3 rounded-xl bg-bg p-3 text-sm text-text-2">{item.autoCheckSummary}</div>
                      <textarea
                        value={item.comment ?? ''}
                        onChange={(e) => updateDraftItem(item.id, (current) => ({ ...current, comment: e.target.value }))}
                        rows={3}
                        placeholder={`填写${item.title}的评语、证据链接或补充说明`}
                        className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-gray-400"
                      />
                      <div className="mt-2 text-xs text-text-3">建议: {item.guidance}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text-1">AI 建议</div>
                <div className="mt-1 text-sm text-text-2">用于补齐模板缺口和门禁提示，不改动后端状态。</div>
              </div>
              <div className="text-xs text-text-3">
                {canManageTemplate ? '具备模板治理视角' : '具备提交自评权限'}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {aiSuggestions.map((item) => (
                <div key={item} className="rounded-xl bg-bg px-4 py-3 text-sm text-text-2">
                  {item}
                </div>
              ))}
              {aiSuggestions.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">当前特征暂无 AI 建议。</div> : null}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">结果反馈</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-bg p-4">
                <div className="text-xs text-text-3">当前状态</div>
                <div className="mt-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${selfReviewStatusClass(draftStatus)}`}>{selfReviewStatusLabel(draftStatus)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-bg p-4 text-sm text-text-2">
                {gatePassed
                  ? '提交后会提示推进到 evaluating，已同时满足自评阈值与回测准确率条件。'
                  : selfReviewPassed
                    ? `当前卡点来自自动回测：${backtestGateEvaluation.detail}`
                    : '提交后会提示回退到 draft，建议先补齐自动预检失败项、样本说明和回退预案。'}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={{ pathname: '/quality/auto-backtest', search: buildSearch(location.search, { view: currentView }) }}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                >
                  查看自动回测
                </Link>
                {featureId ? (
                  <Link
                    to={{ pathname: `/quality/health-score/${featureId}`, search: buildSearch(location.search, { view: currentView }) }}
                    className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    查看健康度分解
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">历史记录</div>
            <div className="mt-4 space-y-4">
              {visibleHistory.map((record) => (
                <div key={record.id} className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-module-dashboard" />
                  <div className="flex-1 rounded-xl bg-bg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-text-1">{record.featureName}</div>
                      <div className="text-xs text-text-3">{formatDateTime(record.updatedAt)}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-medium ${selfReviewStatusClass(record.status)}`}>{selfReviewStatusLabel(record.status)}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-text-2">{record.totalScore}/{record.maxScore}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-text-2">{record.nextLifecycleStage}</span>
                    </div>
                    <div className="mt-2 text-sm text-text-2">{record.recommendation}</div>
                  </div>
                </div>
              ))}
              {visibleHistory.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">暂无历史记录。</div> : null}
            </div>
          </div>
        </div>
      </div>
    </QualityPageFrame>
  );
}

export function QualityTicketsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const params = new URLSearchParams(location.search);

  const statusFilter: TicketStatusFilter =
    params.get('status') && TICKET_STATUSES.includes(params.get('status') as TicketStatus)
      ? (params.get('status') as TicketStatus)
      : 'all';
  const typeFilter: TicketTypeFilter =
    params.get('type') && GOVERNANCE_TICKET_TYPES.includes(params.get('type') as GovernanceTicketType)
      ? (params.get('type') as GovernanceTicketType)
      : 'all';
  const severityFilter: SeverityFilter =
    params.get('severity') && GOVERNANCE_SEVERITIES.includes(params.get('severity') as GovernanceSeverity)
      ? (params.get('severity') as GovernanceSeverity)
      : 'all';
  const assigneeFilter = params.get('assignee');
  const assigneeTeamId = params.get('assigneeTeamId') ?? (assigneeFilter === MY_ASSIGNEE_FILTER ? MY_ASSIGNEE_TEAM_ID : 'all');
  const keyword = params.get('keyword') ?? '';

  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [tickets, setTickets] = useState<GovernanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '治理工单' },
  ]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGovernanceTicketsApi({
      assignee: assigneeFilter === MY_ASSIGNEE_FILTER ? MY_ASSIGNEE_FILTER : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setTickets(res.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '工单列表加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assigneeFilter]);

  const filteredByBasic = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchType = typeFilter === 'all' ? true : ticket.type === typeFilter;
      const matchSeverity = severityFilter === 'all' ? true : ticket.severity === severityFilter;
      const matchTeam = assigneeTeamId === 'all' ? true : ticket.assigneeTeamId === assigneeTeamId;
      const matchKeyword = lower
        ? [ticket.ticketNo, ticket.title, ticket.assigneeTeamName ?? '', ticket.featureId ?? ''].join(' ').toLowerCase().includes(lower)
        : true;
      return matchType && matchSeverity && matchTeam && matchKeyword;
    });
  }, [assigneeTeamId, keyword, severityFilter, tickets, typeFilter]);

  const statusCounts = useMemo(
    () => ({
      all: filteredByBasic.length,
      open: filteredByBasic.filter((ticket) => ticket.status === 'open').length,
      processing: filteredByBasic.filter((ticket) => ticket.status === 'processing').length,
      resolved: filteredByBasic.filter((ticket) => ticket.status === 'resolved').length,
      closed: filteredByBasic.filter((ticket) => ticket.status === 'closed').length,
    }),
    [filteredByBasic],
  );

  const visibleTickets = useMemo(() => {
    const list = filteredByBasic.filter((ticket) => (statusFilter === 'all' ? true : ticket.status === statusFilter));
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredByBasic, statusFilter]);

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>();
    tickets.forEach((ticket) => {
      if (ticket.assigneeTeamId && ticket.assigneeTeamName) map.set(ticket.assigneeTeamId, ticket.assigneeTeamName);
    });
    return Array.from(map.entries());
  }, [tickets]);

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="tickets" title="治理工单" subtitle="工单列表与详情承接治理动作、状态流转和处理记录。">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="tickets"
      title="治理工单"
      subtitle="支持状态 Tab、类型/严重度/指派团队筛选，以及详情时间线查看"
      action={
        <button
          type="button"
          onClick={() => navigate({ pathname: '/quality/governance', search: buildSearch(location.search, { view: currentView }) })}
          className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          去治理看板创建工单
        </button>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', ...TICKET_STATUSES] as TicketStatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { status: status === 'all' ? null : status }) })}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  statusFilter === status ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2 hover:border-gray-300 hover:text-text-1'
                }`}
              >
                {status === 'all' ? '全部' : ticketStatusLabel(status)} ({statusCounts[status]})
              </button>
            ))}
          </div>
          <div className="text-xs text-text-3">
            创建入口回收到治理看板，列表与详情共用同一份工单数据。
            {assigneeFilter === MY_ASSIGNEE_FILTER ? ' 当前已按“我负责的工单”预过滤。' : ''}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_220px]">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ pathname: location.pathname, search: buildSearch(location.search, { keyword: draftKeyword || null }) });
            }}
          >
            <input
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              placeholder="搜工单号、标题、团队"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
            />
            <button type="submit" className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white">
              搜索
            </button>
          </form>

          <select
            value={typeFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { type: e.target.value === 'all' ? null : e.target.value }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部类型</option>
            {GOVERNANCE_TICKET_TYPES.map((item) => (
              <option key={item} value={item}>
                {ticketTypeLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { severity: e.target.value === 'all' ? null : e.target.value }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部严重度</option>
            {GOVERNANCE_SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {severityLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={assigneeTeamId}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { assigneeTeamId: e.target.value === 'all' ? null : e.target.value }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部指派团队</option>
            {teamOptions.map(([teamId, teamName]) => (
              <option key={teamId} value={teamId}>
                {teamName}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载工单...</div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={{ pathname: `/quality/tickets/${ticket.id}`, search: buildSearch(location.search, { view: currentView }) }}
                className="block rounded-2xl border border-border bg-white p-4 transition hover:border-module-dashboard/25 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-text-1">{ticket.title}</div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ticketStatusClass(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(ticket.severity)}`}>{severityLabel(ticket.severity)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-3">
                      <span>{ticket.ticketNo}</span>
                      <span>{ticketTypeLabel(ticket.type)}</span>
                      <span>团队 {ticket.assigneeTeamName ?? '--'}</span>
                      <span>特征 {ticket.featureId ?? '--'}</span>
                    </div>
                    <div className="mt-2 text-sm text-text-2">{ticket.description}</div>
                  </div>
                  <div className="text-right text-xs text-text-3">
                    <div>创建于 {formatDateTime(ticket.createdAt)}</div>
                    <div className="mt-1">最近处理 {formatDateTime(ticket.latestCommentAt ?? ticket.createdAt)}</div>
                  </div>
                </div>
              </Link>
            ))}
            {visibleTickets.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-center text-sm text-text-3">当前筛选下暂无工单。</div> : null}
          </div>
        )}
      </div>
    </QualityPageFrame>
  );
}

export function QualityTicketDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);

  const [detail, setDetail] = useState<GovernanceTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '治理工单', to: '/quality/tickets' },
    { label: id ?? '详情' },
  ]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGovernanceTicketDetailApi(id);
      setDetail(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '工单详情加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!id || !commentDraft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await postGovernanceTicketCommentApi(id, {
        authorUserId: currentUser.id,
        authorUserName: currentUser.name,
        authorTeamName: currentUser.team,
        content: commentDraft.trim(),
      });
      if (!created) {
        setError('追加处理记录失败');
        return;
      }
      setCommentDraft('');
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : '追加处理记录失败');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateGovernanceTicketStatusApi(id, {
        status,
        operatorUserId: currentUser.id,
        operatorUserName: currentUser.name,
        operatorTeamName: currentUser.team,
      });
      if (!updated) {
        setError('工单状态更新失败');
        return;
      }
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : '工单状态更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="tickets" title="工单详情" subtitle="问题描述、基础信息、处理时间线与状态流转">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="tickets"
      title="工单详情"
      subtitle="问题描述、基础信息、处理时间线与评论追加"
      action={
        <button
          type="button"
          onClick={() => navigate({ pathname: '/quality/tickets', search: buildSearch(location.search, { view: currentView }) })}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
        >
          返回工单列表
        </button>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">正在加载工单详情...</div>
      ) : !detail ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">未找到对应工单。</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xl font-semibold text-text-1">{detail.ticket.title}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ticketStatusClass(detail.ticket.status)}`}>{ticketStatusLabel(detail.ticket.status)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(detail.ticket.severity)}`}>{severityLabel(detail.ticket.severity)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-3">
                    <span>{detail.ticket.ticketNo}</span>
                    <span>{ticketTypeLabel(detail.ticket.type)}</span>
                    <span>特征 {detail.ticket.featureId ?? '--'}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-text-3">
                  <div>创建于 {formatDateTime(detail.ticket.createdAt)}</div>
                  <div className="mt-1">解决于 {formatDateTime(detail.ticket.resolvedAt)}</div>
                </div>
              </div>

              <div className="mt-5 text-sm text-text-2">{detail.ticket.description}</div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-sm font-medium text-text-1">影响说明</div>
                  <div className="mt-2 text-sm text-text-2">{detail.impactSummary}</div>
                </div>
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-sm font-medium text-text-1">建议动作</div>
                  <div className="mt-2 space-y-2 text-sm text-text-2">
                    {detail.suggestedActions.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-text-1">根因分析</div>
                  <div className="mt-3 space-y-2">
                    {detail.rootCauses.map((item) => (
                      <div key={item} className="rounded-xl bg-bg px-3 py-2 text-sm text-text-2">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-text-1">关联告警</div>
                  <div className="mt-3 space-y-2">
                    {detail.relatedAlerts.map((alert) => (
                      <div key={alert.id} className="rounded-xl border border-border bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium text-text-1">{alert.title}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-xs ${healthStatusClass(alert.healthStatus)}`}>{formatHealthStatus(alert.healthStatus)}</span>
                        </div>
                        <div className="mt-1 text-xs text-text-3">{alert.featureName} · {alertTypeLabel(alert.alertType)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">处理时间线</div>
              <div className="mt-4 space-y-4">
                {detail.timeline.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-module-dashboard" />
                    <div className="flex-1 rounded-xl bg-bg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium text-text-1">{item.summary}</div>
                        <div className="text-xs text-text-3">{formatDateTime(item.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-xs text-text-3">
                        {item.operatorName}
                        {item.toStatus ? ` · ${ticketStatusLabel(item.toStatus)}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">基础信息</div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                <DetailMetaItem
                  label="当前状态"
                  value={<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ticketStatusClass(detail.ticket.status)}`}>{ticketStatusLabel(detail.ticket.status)}</span>}
                />
                <DetailMetaItem
                  label="严重度"
                  value={<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(detail.ticket.severity)}`}>{severityLabel(detail.ticket.severity)}</span>}
                />
                <DetailMetaItem label="指派人 / 团队" value={`${detail.ticket.assigneeUserName ?? '--'} / ${detail.ticket.assigneeTeamName ?? '--'}`} />
                <DetailMetaItem label="提报人" value={`${detail.ticket.reporterUserName ?? '--'} / ${detail.ticket.reporterTeamName ?? '--'}`} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {detail.ticket.status === 'open' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatusChange('processing')}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1 disabled:opacity-50"
                  >
                    开始处理
                  </button>
                ) : null}
                {detail.ticket.status !== 'resolved' && detail.ticket.status !== 'closed' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatusChange('resolved')}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    标记已解决
                  </button>
                ) : null}
                {detail.ticket.status !== 'closed' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleStatusChange('closed')}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    关闭工单
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">添加处理记录</div>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={4}
                placeholder="补充处理进展、验证结果或回归说明"
                className="mt-4 w-full rounded-xl border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-gray-400"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={saving || !commentDraft.trim()}
                  onClick={() => void handleSubmitComment()}
                  className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  追加记录
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {detail.comments.map((comment: GovernanceTicketComment) => (
                  <div key={comment.id} className="rounded-xl bg-bg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-text-1">{comment.authorUserName}</div>
                        <div className="mt-1 text-xs text-text-3">{comment.authorTeamName}</div>
                      </div>
                      <div className="text-xs text-text-3">{formatDateTime(comment.createdAt)}</div>
                    </div>
                    <div className="mt-3 text-sm text-text-2">{comment.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </QualityPageFrame>
  );
}

export function QualityAttributionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const params = new URLSearchParams(location.search);

  const domainFilter: DomainFilter =
    params.get('domain') && FEATURE_DOMAINS.includes(params.get('domain') as FeatureDomain)
      ? (params.get('domain') as FeatureDomain)
      : 'all';
  const period: PeriodFilter = params.get('period') === '60' ? 60 : params.get('period') === '90' ? 90 : 30;
  const limit = params.get('limit') === '20' ? 20 : 10;
  const exportFormat: ExportFormat = params.get('format') === 'csv' ? 'csv' : 'xlsx';

  const [kpis, setKpis] = useState<QualityAttributionKpi[]>([]);
  const [ranking, setRanking] = useState<QualityValueRankingItem[]>([]);
  const [exportEntry, setExportEntry] = useState<QualityExportEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '收益归因' },
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getQualityAttributionKpisApi(), getQualityValueRankingApi({ limit: 30 })])
      .then(([kpiRes, rankingRes]) => {
        if (cancelled) return;
        setKpis(kpiRes);
        setRanking(rankingRes.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '收益归因加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scopedRanking = useMemo(
    () => (domainFilter === 'all' ? ranking : ranking.filter((item) => item.featureDomain === domainFilter)),
    [domainFilter, ranking],
  );
  const displayKpis = useMemo(() => buildDerivedKpis(scopedRanking, period, kpis), [kpis, period, scopedRanking]);
  const visibleRanking = useMemo(() => scopedRanking.slice(0, limit), [limit, scopedRanking]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await getQualityExportApi({ scope: 'attribution', format: exportFormat });
      setExportEntry(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="attribution" title="收益归因" subtitle="战略 KPI、价值榜单与特征级归因卡">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="attribution"
      title="收益归因"
      subtitle="战略 KPI 归因、价值榜单、导出入口与特征级归因跳转"
      action={
        <button type="button" onClick={() => void handleExport()} disabled={exporting} className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {exporting ? '正在导出...' : '导出全部归因数据'}
        </button>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[220px_220px_220px_1fr]">
          <select
            value={period}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { period: Number(e.target.value) }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value={30}>近 30 天</option>
            <option value={60}>近 60 天</option>
            <option value={90}>近 90 天</option>
          </select>
          <select
            value={domainFilter}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { domain: e.target.value === 'all' ? null : e.target.value }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value="all">全部域</option>
            {FEATURE_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {featureDomainLabel(domain)}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => navigate({ pathname: location.pathname, search: buildSearch(location.search, { limit: Number(e.target.value) }) })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-2"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-text-3">导出格式</span>
            <button
              type="button"
              onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { format: 'xlsx' }) })}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${exportFormat === 'xlsx' ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
            >
              XLSX
            </button>
            <button
              type="button"
              onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { format: 'csv' }) })}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${exportFormat === 'csv' ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'}`}
            >
              CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">正在加载收益归因...</div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {displayKpis.map((item) => (
                <div key={item.key} className="rounded-card border border-border bg-white p-5 shadow-sm">
                  <div className="text-sm font-medium text-text-3">{item.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-text-1">{metricValue(item.value, item.unit)}</div>
                  <div className="mt-2 text-sm text-emerald-600">较基线 +{item.delta}%</div>
                  <div className="mt-2 text-sm text-text-2">{item.description}</div>
                </div>
              ))}
            </div>

            {exportEntry ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                已生成导出文件 {exportEntry.fileName}，过期时间 {formatDateTime(exportEntry.expiresAt)}，下载地址 {exportEntry.downloadUrl}
              </div>
            ) : null}

            <div className="mt-6 rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-text-1">价值榜单</div>
                  <div className="mt-1 text-sm text-text-2">按归因价值排序展示 TOP 特征，支持直接跳转到特征级归因卡。</div>
                </div>
                <div className="text-xs text-text-3">当前范围: {domainFilter === 'all' ? '全部域' : featureDomainLabel(domainFilter)} · 近 {period} 天</div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[56px_1.4fr_0.8fr_120px_120px_120px] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                  <div>排名</div>
                  <div>特征</div>
                  <div>归属</div>
                  <div>GMV</div>
                  <div>AB收益</div>
                  <div>动作</div>
                </div>
                {visibleRanking.map((item) => (
                  <div key={item.featureId} className="grid grid-cols-[56px_1.4fr_0.8fr_120px_120px_120px] items-center gap-3 border-t border-border px-4 py-4 text-sm">
                    <div className="font-semibold text-text-1">#{item.rank}</div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-text-1">{item.featureName}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-3">
                        <span>{featureTypeLabel(item.featureType)}</span>
                        <span>{featureDomainLabel(item.featureDomain)}</span>
                        <span>{item.totalConsumptionTeams} 个消费团队</span>
                      </div>
                    </div>
                    <div className="text-text-2">{item.ownerTeamName}</div>
                    <div className="font-medium text-text-1">{item.metricBreakdown.GMV ?? item.totalRevenue / 10000} 万</div>
                    <div className="font-medium text-text-1">{item.metricBreakdown['AB收益'] ?? '--'} 万</div>
                    <div>
                      <Link
                        to={{ pathname: `/quality/attribution/${item.featureId}`, search: buildSearch(location.search, { view: currentView }) }}
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                      >
                        归因卡
                      </Link>
                    </div>
                  </div>
                ))}
                {visibleRanking.length === 0 ? <div className="border-t border-border px-4 py-8 text-center text-sm text-text-3">当前筛选下暂无归因记录。</div> : null}
              </div>
            </div>
          </>
        )}
      </div>
    </QualityPageFrame>
  );
}

export function QualityAttributionDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { feature_id } = useParams();
  const currentView = useGlobalState((s) => s.currentView);
  const params = new URLSearchParams(location.search);
  const trendMetric: QualityMetricKey =
    params.get('metric') && QUALITY_METRIC_KEYS.includes(params.get('metric') as QualityMetricKey)
      ? (params.get('metric') as QualityMetricKey)
      : 'GMV';

  const [detail, setDetail] = useState<QualityFeatureAttributionDetail | null>(null);
  const [consumers, setConsumers] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '收益归因', to: '/quality/attribution' },
    { label: feature_id ?? '详情' },
  ]);

  useEffect(() => {
    if (!feature_id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getQualityFeatureAttributionApi(feature_id), getQualityConsumptionApi(feature_id)])
      .then(([detailRes, consumersRes]) => {
        if (cancelled) return;
        setDetail(detailRes);
        setConsumers(consumersRes);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '归因详情加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [feature_id]);

  const trendMetricUnit = useMemo(() => detail?.metrics.find((item) => item.key === trendMetric)?.unit ?? '万元', [detail, trendMetric]);
  const maxTrendValue = useMemo(() => Math.max(1, ...(detail?.trends.map((item) => item.metricValues[trendMetric] ?? 0) ?? [1])), [detail, trendMetric]);
  const totalRequests = useMemo(() => consumers.reduce((sum, item) => sum + item.requestCount, 0), [consumers]);
  const avgSuccessRate = useMemo(() => {
    if (!consumers.length) return 0;
    return consumers.reduce((sum, item) => sum + item.successRate, 0) / consumers.length;
  }, [consumers]);

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="attribution" title="特征归因卡" subtitle="指标归因、消费方明细与近 4 期趋势">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="attribution"
      title="特征归因卡"
      subtitle="展示 CTR/CVR/ROI/MAC/GMV/AB收益 等指标、消费方明细和近 4 期趋势"
      action={
        <button
          type="button"
          onClick={() => navigate({ pathname: '/quality/attribution', search: buildSearch(location.search, { view: currentView }) })}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
        >
          返回收益归因
        </button>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">正在加载归因详情...</div>
      ) : !detail ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">未找到对应特征的归因详情。</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-semibold text-text-1">{detail.featureName}</div>
                  <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">{featureTypeLabel(detail.featureType)}</span>
                  <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">{featureDomainLabel(detail.featureDomain)}</span>
                </div>
                <div className="mt-2 text-sm text-text-2">{detail.summary}</div>
              </div>
              <div className="rounded-xl bg-bg px-4 py-3 text-right">
                <div className="text-xs text-text-3">域内排名</div>
                <div className="mt-1 text-2xl font-semibold text-text-1">#{detail.rankInDomain}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6">
              {detail.metrics.map((item) => (
                <div key={item.key} className="rounded-xl border border-border bg-white p-4">
                  <div className="text-xs text-text-3">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-text-1">{metricValue(item.value, item.unit)}</div>
                  <div className="mt-2 text-xs text-text-3">{item.rankText}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-text-1">近 4 期趋势</div>
                  <div className="mt-1 text-sm text-text-2">切换不同指标查看归因变化，趋势数据来自统一归因模型。</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUALITY_METRIC_KEYS.map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => navigate({ pathname: location.pathname, search: buildSearch(location.search, { metric }) })}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        trendMetric === metric ? 'bg-gray-900 text-white' : 'border border-border bg-white text-text-2'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {detail.trends.map((item) => {
                  const value = item.metricValues[trendMetric] ?? 0;
                  return (
                    <div key={item.period} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-text-1">{item.period}</div>
                        <div className="text-sm font-semibold text-text-1">{metricValue(value, trendMetricUnit)}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(12, (value / maxTrendValue) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-text-1">消费方明细</div>
                  <div className="mt-1 text-sm text-text-2">仅展示团队、场景、调用量和 AB 效果，不暴露个人级信息。</div>
                </div>
                <div className="flex gap-3 text-xs text-text-3">
                  <span>团队数 {consumers.length}</span>
                  <span>调用量 {formatLargeNumber(totalRequests)}</span>
                  <span>成功率 {(avgSuccessRate * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1fr_1fr_110px_120px_100px_90px] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                  <div>消费团队</div>
                  <div>场景</div>
                  <div>渠道</div>
                  <div>调用量</div>
                  <div>成功率</div>
                  <div>AB效果</div>
                </div>
                {consumers.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_1fr_110px_120px_100px_90px] items-center gap-3 border-t border-border px-4 py-4 text-sm">
                    <div className="font-medium text-text-1">{item.consumerTeamName}</div>
                    <div className="text-text-2">{item.sceneName}</div>
                    <div className="text-text-2">{channelLabel(item.channel)}</div>
                    <div className="text-text-1">{formatLargeNumber(item.requestCount)}</div>
                    <div className="text-text-1">{(item.successRate * 100).toFixed(1)}%</div>
                    <div className="text-text-1">{item.abEffect == null ? '--' : `${item.abEffect.toFixed(1)}%`}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </QualityPageFrame>
  );
}

export function QualityHealthScorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { feature_id } = useParams();
  const currentView = useGlobalState((s) => s.currentView);
  const userPermission = useGlobalState((s) => s.userPermission);

  const [breakdown, setBreakdown] = useState<HealthScoreBreakdown | null>(null);
  const [trend, setTrend] = useState<HealthScoreTrendPoint[]>([]);
  const [events, setEvents] = useState<QualityDegradationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enabledActions = userPermission?.enabledActions ?? [];
  const canViewHealthScore = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.healthScoreView,
    QUALITY_ACTIONS.healthScoreWeightManage,
  ]);
  const canManageHealthWeight = hasAction(enabledActions, QUALITY_ACTIONS.healthScoreWeightManage);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '健康度分解', to: feature_id ? `/quality/health-score/${feature_id}` : '/quality' },
    { label: feature_id ?? '详情' },
  ]);

  useEffect(() => {
    if (!feature_id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getHealthScoreBreakdownApi(feature_id),
      getHealthScoreTrendApi(feature_id),
      getQualityDegradationEventsApi(feature_id),
    ])
      .then(([breakdownRes, trendRes, eventsRes]) => {
        if (cancelled) return;
        setBreakdown(breakdownRes);
        setTrend(trendRes);
        setEvents(eventsRes);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '健康度分解加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [feature_id]);

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="governance" title="健康度分解" subtitle="综合健康度、来源分解、趋势和降级事件。">
        <RestrictedViewPanel
          title="消费视角不承接健康度分解"
          description="健康度分解属于供给侧质量评测解释口径；消费视角请继续使用预检与质量徽章入口。"
          producerTarget={feature_id ? `/quality/health-score/${feature_id}` : '/quality/governance'}
        />
      </QualityPageFrame>
    );
  }

  if (!canViewHealthScore) {
    return (
      <QualityPageFrame section="governance" title="健康度分解" subtitle="综合健康度、来源分解、趋势和降级事件。">
        <RestrictedViewPanel
          title="当前角色无健康度分解权限"
          description="健康度分解仅向 `producer`、`producer_admin`、`platform_admin` 开放；如需继续治理，请回到治理看板查看聚合结果。"
          producerTarget={feature_id ? `/quality/health-score/${feature_id}` : '/quality/governance'}
          fallbackTarget="/quality/governance"
          fallbackButtonLabel="返回治理看板"
        />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="governance"
      title="健康度分解"
      subtitle="综合健康度分、来源分解、雷达图、趋势图和降级事件"
      action={
        <div className="flex flex-wrap gap-3">
          {feature_id ? (
            <>
              <button
                type="button"
                onClick={() => navigate({ pathname: '/quality/self-review', search: buildSearch(location.search, { view: currentView, featureId: feature_id, featureType: breakdown?.featureType ?? null }) })}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
              >
                查看结构化自评
              </button>
              <button
                type="button"
                onClick={() => navigate({ pathname: '/quality/auto-backtest', search: buildSearch(location.search, { view: currentView, keyword: feature_id }) })}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
              >
                查看自动回测
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => navigate({ pathname: '/quality/governance', search: buildSearch(location.search, { view: currentView }) })}
            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            返回治理看板
          </button>
        </div>
      }
    >
      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">正在加载健康度分解...</div>
      ) : !breakdown ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-sm text-text-3">未找到对应特征的健康度分解。</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
            <ScoreRing
              score={breakdown.overallScore}
              label={breakdown.degraded ? '已降级' : '综合健康度'}
              hint={`${breakdown.featureName} · ${featureTypeLabel(breakdown.featureType)} · 更新于 ${formatDateTime(breakdown.updatedAt)}`}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                <div className="text-sm font-medium text-text-3">特征归属</div>
                <div className="mt-2 text-xl font-semibold text-text-1">{breakdown.ownerTeamName}</div>
                <div className="mt-2 text-sm text-text-2">{featureDomainLabel(breakdown.featureDomain)}</div>
              </div>
              <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                <div className="text-sm font-medium text-text-3">当前状态</div>
                <div className="mt-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${healthStatusClass(breakdown.status)}`}>{formatHealthStatus(breakdown.status)}</span>
                </div>
                <div className="mt-2 text-sm text-text-2">{breakdown.degraded ? '任一来源低于阈值，已触发自动降级。' : '各来源未触发降级阈值。'}</div>
              </div>
              <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
                <div className="text-sm font-medium text-text-3">P0 计算口径</div>
                <div className="mt-2 text-xl font-semibold text-text-1">静态 / 回测 / 自评</div>
                <div className="mt-2 text-sm text-text-2">
                  {canManageHealthWeight ? '平台管理员可继续扩展权重矩阵；P2 来源当前保留展示，贡献值固定为 0。' : 'P2 来源保留展示，但贡献值固定为 0。'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text-1">来源分解表</div>
                <div className="mt-1 text-sm text-text-2">按特征类型读取默认权重矩阵，P0 仅静态评测 / 自动回测 / 结构化自评参与计算。</div>
              </div>
              <div className="text-xs text-text-3">类型权重: {featureTypeLabel(breakdown.featureType)}</div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1fr_100px_100px_120px_110px_1.4fr] gap-3 bg-bg px-4 py-3 text-xs font-medium text-text-3">
                <div>来源</div>
                <div>分数</div>
                <div>权重</div>
                <div>贡献</div>
                <div>是否参与</div>
                <div>说明</div>
              </div>
              {breakdown.sources.map((item) => (
                <div key={item.source} className="grid grid-cols-[1fr_100px_100px_120px_110px_1.4fr] gap-3 border-t border-border bg-white px-4 py-4 text-sm">
                  <div className="font-medium text-text-1">{item.label}</div>
                  <div className="text-text-1">{formatScore(item.score)}</div>
                  <div className="text-text-2">{formatRatio(item.weight)}</div>
                  <div className={item.participatesInScore ? 'font-medium text-text-1' : 'text-text-3'}>{formatContribution(item.contribution)}</div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.participatesInScore ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {item.participatesInScore ? '参与' : '占位'}
                    </span>
                  </div>
                  <div className="text-text-2">{item.summary}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <RadarChart points={breakdown.radar} />
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">趋势图</div>
              <div className="mt-1 text-sm text-text-2">展示综合分与核心来源的阶段趋势，并标记自动降级点。</div>
              <div className="mt-5 space-y-3">
                {trend.map((point) => (
                  <div key={point.date} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-text-1">{formatDate(point.date)}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-bg px-2 py-1 text-text-2">综合 {formatScore(point.overallScore)}</span>
                        <span className="rounded-full bg-bg px-2 py-1 text-text-2">静态 {formatScore(point.staticScore)}</span>
                        <span className="rounded-full bg-bg px-2 py-1 text-text-2">回测 {formatScore(point.backtestScore)}</span>
                        <span className="rounded-full bg-bg px-2 py-1 text-text-2">自评 {formatScore(point.selfReviewScore)}</span>
                        {point.degraded ? <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">已降级</span> : null}
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(point.overallScore, 8)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">自动降级事件</div>
            <div className="mt-1 text-sm text-text-2">当任一来源低于阈值时，系统会将特征标记为 `degraded` 并联动治理工单。</div>
            <div className="mt-5 space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${event.resolvedAt ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex-1 rounded-xl bg-bg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-text-1">
                        {healthSourceLabel(event.source)} 触发降级
                      </div>
                      <div className="text-xs text-text-3">{formatDateTime(event.triggeredAt)}</div>
                    </div>
                    <div className="mt-2 text-sm text-text-2">{event.reason}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-3">
                      <span>分数 {formatScore(event.fromScore)} → {formatScore(event.toScore)}</span>
                      <span>严重度 {severityLabel(event.severity)}</span>
                      <span>{event.resolvedAt ? `已恢复于 ${formatDateTime(event.resolvedAt)}` : '当前仍在观察/处理中'}</span>
                    </div>
                    {event.relatedTicketId ? (
                      <div className="mt-3">
                        <Link
                          to={{ pathname: `/quality/tickets/${event.relatedTicketId}`, search: buildSearch(location.search, { view: currentView }) }}
                          className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                        >
                          查看关联工单
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {events.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">当前特征暂无降级事件。</div> : null}
            </div>
          </div>
        </div>
      )}
    </QualityPageFrame>
  );
}

export function QualityP2PlaceholderPage({
  title,
  routeLabel,
}: {
  title: string;
  routeLabel: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: title },
  ]);

  if (currentView === 'consumer') {
    return (
      <QualityPageFrame section="governance" title={title} subtitle="P2 占位入口仅在 producer / operator 视角下开放。">
        <RestrictedViewPanel />
      </QualityPageFrame>
    );
  }

  return (
    <QualityPageFrame
      section="governance"
      title={title}
      subtitle="P2 占位页：当前只保留可访问入口、返回能力与后续规划说明"
      action={
        <button
          type="button"
          onClick={() => navigate({ pathname: '/quality/governance', search: buildSearch(location.search, { view: currentView }) })}
          className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          返回治理看板
        </button>
      }
    >
      <div className="rounded-card border border-border bg-surface p-8 shadow-sm">
        <div className="text-lg font-semibold text-text-1">敬请期待</div>
        <div className="mt-2 text-sm text-text-2">
          当前访问 `{routeLabel}`。本阶段只提供占位页，不调用任何后端接口，也不扩展其他 spec 范围。
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-bg p-4">
            <div className="text-sm font-medium text-text-1">当前阶段</div>
            <div className="mt-2 text-sm text-text-2">仅保留入口、占位说明和返回路径。</div>
          </div>
          <div className="rounded-xl bg-bg p-4">
            <div className="text-sm font-medium text-text-1">后续能力</div>
            <div className="mt-2 text-sm text-text-2">将承接人工评估或任务编排的真实工作流。</div>
          </div>
          <div className="rounded-xl bg-bg p-4">
            <div className="text-sm font-medium text-text-1">回退入口</div>
            <div className="mt-2 text-sm text-text-2">可返回治理看板、自动回测或结构化自评页面。</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={{ pathname: '/quality/governance', search: buildSearch(location.search, { view: currentView }) }}
            className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            去治理看板
          </Link>
          <Link
            to={{ pathname: '/quality/auto-backtest', search: buildSearch(location.search, { view: currentView }) }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            去自动回测
          </Link>
          <Link
            to={{ pathname: '/quality/self-review', search: buildSearch(location.search, { view: currentView }) }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            去结构化自评
          </Link>
        </div>
      </div>
    </QualityPageFrame>
  );
}
