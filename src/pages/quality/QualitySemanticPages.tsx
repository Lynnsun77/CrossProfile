import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  getLLMJudgeDistributionApi,
  getLLMJudgeOverviewApi,
  getLLMJudgePromptTemplateApi,
  getLLMJudgePromptTemplatesApi,
  getLLMJudgeRunDetailApi,
  getLLMJudgeRunsApi,
  getSurveyDispatchesApi,
  getSurveyResponsesApi,
  getSurveySummariesApi,
  getSurveyTemplatesApi,
  getSurveyWordCloudApi,
  postLLMJudgeRunApi,
  postSurveyDispatchApi,
  postSurveyLowScoreTicketApi,
  putLLMJudgePromptTemplateApi,
  rollbackLLMJudgePromptTemplateApi,
  updateLLMJudgeBadCaseActionApi,
  getLLMJudgeBadCasesApi,
} from '../../api/quality';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatLargeNumber, formatNumber } from '../../lib/format';
import { useGlobalState } from '../../store/globalState';
import type {
  AppView,
  FeatureDomain,
  FeatureType,
  LLMJudgeBadCase,
  LLMJudgeFewShotExample,
  LLMJudgePromptTemplate,
  LLMJudgeRun,
  LLMJudgeRunStatus,
  LLMJudgeTriggerMode,
  SurveyDispatch,
  SurveySummary,
  SurveyTemplate,
  SurveyTemplateScenario,
  SurveyWordCloudItem,
} from '../../types';
import {
  LLM_JUDGE_RUN_STATUSES,
  SURVEY_DISPATCH_STATUSES,
  SURVEY_TEMPLATE_SCENARIOS,
} from '../../types';

const FEATURE_TYPE_OPTIONS: FeatureType[] = ['rule', 'sequence', 'algo', 'vector', 'llm_intent'];

const QUALITY_ACTIONS = {
  llmJudgeView: 'quality.llm_judge.view',
  llmJudgeCreate: 'quality.llm_judge.create',
  llmJudgeTemplateManage: 'quality.llm_judge.template.manage',
  llmJudgeBadCaseManage: 'quality.llm_judge.bad_case.manage',
  llmJudgeWhitelistManage: 'quality.llm_judge.whitelist.manage',
  surveyView: 'quality.survey.view',
  surveyDispatchCreate: 'quality.survey.dispatch.create',
  surveyDispatchManage: 'quality.survey.dispatch.manage',
  surveyTicketCreate: 'quality.survey.ticket.create',
} as const;

type SemanticSection = 'llm-judge' | 'llm-judge-templates' | 'survey';

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

function viewLabel(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function featureTypeLabel(value: string) {
  if (value === 'rule') return '规则';
  if (value === 'sequence') return '序列';
  if (value === 'algo') return '算法';
  if (value === 'vector') return '向量';
  return 'LLM';
}

function featureDomainLabel(value: FeatureDomain) {
  if (value === 'user_profile') return '用户画像';
  if (value === 'merchant_profile') return '商家画像';
  if (value === 'product_profile') return '商品画像';
  if (value === 'content_profile') return '内容画像';
  if (value === 'transaction') return '交易';
  return '跨域';
}

function llmJudgeStatusLabel(value: LLMJudgeRunStatus) {
  if (value === 'queued') return '排队中';
  if (value === 'running') return '执行中';
  if (value === 'completed') return '已完成';
  return '执行失败';
}

function llmJudgeStatusClass(value: LLMJudgeRunStatus) {
  if (value === 'queued') return 'bg-slate-100 text-slate-700';
  if (value === 'running') return 'bg-blue-50 text-blue-700';
  if (value === 'completed') return 'bg-emerald-50 text-emerald-700';
  return 'bg-rose-50 text-rose-700';
}

function surveyScenarioLabel(value: SurveyTemplateScenario) {
  if (value === 'first_subscription') return '首次订阅';
  if (value === 'experience_change') return '变更体验';
  return '季度 NPS';
}

function surveyDispatchStatusLabel(value: SurveyDispatch['status']) {
  if (value === 'draft') return '草稿';
  if (value === 'scheduled') return '已排期';
  if (value === 'running') return '投放中';
  return '已完成';
}

function surveyDispatchStatusClass(value: SurveyDispatch['status']) {
  if (value === 'draft') return 'bg-slate-100 text-slate-700';
  if (value === 'scheduled') return 'bg-blue-50 text-blue-700';
  if (value === 'running') return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function badCaseSeverityClass(value: LLMJudgeBadCase['severity']) {
  if (value === 'critical') return 'bg-rose-50 text-rose-700';
  if (value === 'high') return 'bg-orange-50 text-orange-700';
  if (value === 'medium') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function badCaseStatusLabel(value: LLMJudgeBadCase['status']) {
  if (value === 'new') return '待处理';
  if (value === 'manual_review') return '人工复核';
  if (value === 'added_to_training') return '已加训';
  return '已关闭';
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

function formatScore(value: number) {
  return value.toFixed(1);
}

function formatSignedScore(value: number, digits = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function wordCloudToneClass(value: SurveyWordCloudItem['sentiment']) {
  if (value === 'positive') return 'bg-emerald-50 text-emerald-700';
  if (value === 'negative') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-700';
}

function SemanticTabs({ section }: { section: SemanticSection }) {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);

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
      {tabs.map((tab) => {
        const active = (section === 'llm-judge' || section === 'llm-judge-templates') && tab.key === 'llm-judge'
          ? true
          : section === 'survey' && tab.key === 'survey';
        return (
          <Link
            key={tab.key}
            to={{ pathname: tab.to, search: buildSearch(location.search, { view: currentView }) }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              active
                ? 'border-transparent bg-blue-600 text-white shadow-sm'
                : 'border-border bg-white text-text-2 hover:border-gray-300 hover:text-text-1'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function SemanticPageFrame({
  title,
  subtitle,
  section,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  section: SemanticSection;
  action?: ReactNode;
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
          ，语义评估页仅在 `producer` 视角下可用。
        </div>
        <SemanticTabs section={section} />
        {children}
      </div>
    </div>
  );
}

function RestrictedSemanticPanel({ title, description }: { title: string; description: string }) {
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
            navigate({ pathname: location.pathname, search: buildSearch(location.search, { view: 'producer' }) });
          }}
          className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          切换到供给视角
        </button>
        <button
          type="button"
          onClick={() => navigate({ pathname: '/quality/governance', search: buildSearch(location.search, { view: 'producer' }) })}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
        >
          返回治理看板
        </button>
      </div>
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <div className="text-sm font-medium text-text-3">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-text-1">{value}</div>
      <div className="mt-2 text-sm text-text-2">{hint}</div>
    </div>
  );
}

function LLMJudgeCreateModal({
  open,
  templates,
  features,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  templates: LLMJudgePromptTemplate[];
  features: Array<{ featureId: string; featureName: string; featureType: FeatureType }>;
  onClose: () => void;
  onSubmit: (payload: {
    featureId: string;
    templateId: string;
    judgeModel: string;
    sampleSize: number;
    triggerMode: LLMJudgeTriggerMode;
  }) => void;
  submitting: boolean;
}) {
  const [featureId, setFeatureId] = useState(features[0]?.featureId ?? '');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [judgeModel, setJudgeModel] = useState('gpt-4.1');
  const [sampleSize, setSampleSize] = useState(8000);
  const [triggerMode, setTriggerMode] = useState<LLMJudgeTriggerMode>('manual');

  useEffect(() => {
    if (!open) return;
    setFeatureId(features[0]?.featureId ?? '');
  }, [features, open]);

  useEffect(() => {
    if (!open) return;
    if (!featureId) return;
    const featureType = features.find((item) => item.featureId === featureId)?.featureType;
    const preferred = templates.find((item) => item.featureType === featureType) ?? templates[0];
    setTemplateId(preferred?.id ?? '');
  }, [featureId, features, open, templates]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-card border border-border bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-text-1">发起 LLM 评判任务</div>
            <div className="mt-1 text-xs text-text-3">最小可演示链路：选特征、选模板、提交后写入新的运行记录。</div>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-text-3 hover:text-text-1">
            关闭
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-text-3">
            特征
            <select
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              {features.map((item) => (
                <option key={item.featureId} value={item.featureId}>
                  {item.featureName} / {featureTypeLabel(item.featureType)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-3">
            Prompt 模板
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {item.currentVersion}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-3">
            Judge Model
            <input
              value={judgeModel}
              onChange={(e) => setJudgeModel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            />
          </label>
          <label className="text-xs font-medium text-text-3">
            样本量
            <input
              type="number"
              min={100}
              step={100}
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            />
          </label>
          <label className="text-xs font-medium text-text-3 md:col-span-2">
            触发方式
            <select
              value={triggerMode}
              onChange={(e) => setTriggerMode(e.target.value as LLMJudgeTriggerMode)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              <option value="manual">人工触发</option>
              <option value="scheduled">定时调度</option>
              <option value="gate">门禁触发</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!featureId || !templateId || submitting}
            onClick={() => onSubmit({ featureId, templateId, judgeModel, sampleSize, triggerMode })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '提交中...' : '创建任务'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QualityLLMJudgePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const userPermission = useGlobalState((s) => s.userPermission);
  const enabledActions = userPermission?.enabledActions ?? [];
  const canView = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.llmJudgeView,
    QUALITY_ACTIONS.llmJudgeCreate,
    QUALITY_ACTIONS.llmJudgeTemplateManage,
  ]);
  const canCreate = hasAction(enabledActions, QUALITY_ACTIONS.llmJudgeCreate);
  const canManageTemplates = hasAction(enabledActions, QUALITY_ACTIONS.llmJudgeTemplateManage);
  const canManageBadCases = hasAction(enabledActions, QUALITY_ACTIONS.llmJudgeBadCaseManage);
  const canManageWhitelist = hasAction(enabledActions, QUALITY_ACTIONS.llmJudgeWhitelistManage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getLLMJudgeOverviewApi>> | null>(null);
  const [distribution, setDistribution] = useState<Awaited<ReturnType<typeof getLLMJudgeDistributionApi>> | null>(null);
  const [runs, setRuns] = useState<LLMJudgeRun[]>([]);
  const [templates, setTemplates] = useState<LLMJudgePromptTemplate[]>([]);
  const [badCases, setBadCases] = useState<LLMJudgeBadCase[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [selectedRun, setSelectedRun] = useState<LLMJudgeRun | null>(null);
  const [featureTypeFilter, setFeatureTypeFilter] = useState<'all' | FeatureType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LLMJudgeRunStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: 'LLM 评判' },
  ]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, distributionData, runsData, templateData, badCaseData] = await Promise.all([
        getLLMJudgeOverviewApi(),
        getLLMJudgeDistributionApi(featureTypeFilter === 'all' ? undefined : featureTypeFilter),
        getLLMJudgeRunsApi({
          featureType: featureTypeFilter,
          status: statusFilter,
          keyword,
        }),
        getLLMJudgePromptTemplatesApi(),
        getLLMJudgeBadCasesApi({
          featureType: featureTypeFilter,
          keyword,
        }),
      ]);
      setOverview(overviewData);
      setDistribution(distributionData);
      setRuns(runsData.items);
      setTemplates(templateData.items);
      setBadCases(badCaseData.items);
      setSelectedRunId((current) => current || runsData.items[0]?.id || '');
    } catch {
      setError('加载 LLM 评判数据失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [featureTypeFilter, statusFilter, keyword]);

  useEffect(() => {
    if (!selectedRunId) {
      setSelectedRun(null);
      return;
    }
    let active = true;
    void getLLMJudgeRunDetailApi(selectedRunId).then((detail) => {
      if (active) setSelectedRun(detail);
    });
    return () => {
      active = false;
    };
  }, [selectedRunId]);

  const featureOptions = useMemo(() => {
    const map = new Map<string, { featureId: string; featureName: string; featureType: FeatureType }>();
    runs.forEach((item) => {
      if (!map.has(item.featureId)) {
        map.set(item.featureId, {
          featureId: item.featureId,
          featureName: item.featureName,
          featureType: item.featureType,
        });
      }
    });
    return Array.from(map.values());
  }, [runs]);

  const capabilityHint = canManageWhitelist
    ? '当前角色可查看运行结果、发起任务、处理 Bad Case，并维护白名单策略。'
    : canManageTemplates
      ? '当前角色可查看运行结果、发起任务并维护模板版本。'
      : canCreate
        ? '当前角色可发起评判任务并查看结果。'
        : '当前角色可查看结果，但不可新增任务或修改模板。';

  const handleCreateRun = async (payload: {
    featureId: string;
    templateId: string;
    judgeModel: string;
    sampleSize: number;
    triggerMode: LLMJudgeTriggerMode;
  }) => {
    setSubmitting(true);
    try {
      const created = await postLLMJudgeRunApi(payload);
      if (created) {
        setToast(`已创建评判任务 ${created.id}`);
        setModalOpen(false);
        setSelectedRunId(created.id);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBadCaseAction = async (
    caseId: string,
    action: 'add_to_training' | 'push_manual_review' | 'resolve',
  ) => {
    const updated = await updateLLMJudgeBadCaseActionApi(caseId, action);
    if (!updated) return;
    setBadCases((current) => current.map((item) => (item.id === caseId ? updated : item)));
    setToast(`Bad Case ${caseId} 已更新为 ${badCaseStatusLabel(updated.status)}`);
  };

  if (currentView !== 'producer') {
    return (
      <SemanticPageFrame section="llm-judge" title="LLM 评判" subtitle="评分概览、运行记录、Bad Case 与模板链路。">
        <RestrictedSemanticPanel title="当前视角不承接 LLM 评判" description="LLM 评判仅在供给侧工作台中使用，请切换到 `producer` 视角继续。" />
      </SemanticPageFrame>
    );
  }

  if (!canView) {
    return (
      <SemanticPageFrame section="llm-judge" title="LLM 评判" subtitle="评分概览、运行记录、Bad Case 与模板链路。">
        <RestrictedSemanticPanel title="当前角色无 LLM 评判权限" description="该页面仅向 `producer`、`producer_admin`、`platform_admin` 开放。" />
      </SemanticPageFrame>
    );
  }

  return (
    <SemanticPageFrame
      section="llm-judge"
      title="LLM 评判"
      subtitle="承接评分概览、运行记录、评分分布、Bad Case 处理与任务创建。"
      action={
        <div className="flex gap-3">
          <Link
            to={{ pathname: '/quality/llm-judge/templates', search: buildSearch(location.search, { view: currentView }) }}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            管理模板
          </Link>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            发起任务
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-card border border-border bg-surface p-4 text-sm text-text-2 shadow-sm">{capabilityHint}</div>
        {toast ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div> : null}
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="累计任务" value={loading || !overview ? '--' : formatNumber(overview.totalRuns)} hint="覆盖在线与门禁触发任务" />
          <MetricCard title="已完成" value={loading || !overview ? '--' : formatNumber(overview.completedCount)} hint="可查看评分与 Bad Case" />
          <MetricCard title="平均得分" value={loading || !overview ? '--' : formatScore(overview.avgOverallScore)} hint="完成任务的均值" />
          <MetricCard title="Bad Case" value={loading || !overview ? '--' : formatNumber(overview.badCaseCount)} hint="用于加训与人工复核" />
          <MetricCard title="特征覆盖" value={loading || !overview ? '--' : formatNumber(overview.featureCoverageCount)} hint="已接入语义评判的特征数" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text-1">评分分布</div>
                <div className="mt-1 text-sm text-text-2">按完成任务聚合的分数段分布，用于快速识别低分特征类型。</div>
              </div>
              <div className="text-xs text-text-3">总样本 {distribution?.total ?? 0}</div>
            </div>
            <div className="mt-5 space-y-3">
              {distribution?.items.map((item) => {
                const width = distribution.total ? (item.count / distribution.total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-text-2">{item.label}</span>
                      <span className="font-medium text-text-1">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-module-dashboard" style={{ width: `${Math.max(width, item.count > 0 ? 8 : 0)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">筛选器</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-xs font-medium text-text-3">
                特征类型
                <select
                  value={featureTypeFilter}
                  onChange={(e) => setFeatureTypeFilter(e.target.value as 'all' | FeatureType)}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
                >
                  <option value="all">全部</option>
                  {FEATURE_TYPE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {featureTypeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-text-3">
                任务状态
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | LLMJudgeRunStatus)}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
                >
                  <option value="all">全部</option>
                  {LLM_JUDGE_RUN_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {llmJudgeStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-text-3">
                关键词
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="特征名 / 模板名 / 团队"
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-card border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-text-1">运行记录</div>
                <div className="mt-1 text-sm text-text-2">支持查看运行详情、评分波动和最近完成状态。</div>
              </div>
              <div className="text-xs text-text-3">{runs.length} 条记录</div>
            </div>
            <div className="divide-y divide-border">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRunId(run.id)}
                  className={`grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition md:grid-cols-[1.2fr_0.8fr_100px_120px] ${
                    selectedRunId === run.id ? 'bg-module-dashboard/5' : 'bg-white hover:bg-bg'
                  }`}
                >
                  <div>
                    <div className="font-medium text-text-1">{run.featureName}</div>
                    <div className="mt-1 text-xs text-text-3">
                      {run.id} · {run.templateName} / {run.templateVersion}
                    </div>
                  </div>
                  <div className="text-sm text-text-2">
                    <div>{featureTypeLabel(run.featureType)} / {featureDomainLabel(run.featureDomain)}</div>
                    <div className="mt-1">{run.ownerTeamName}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-text-1">{formatScore(run.overallScore)}</div>
                    <div className={`${run.scoreDiffVsPrev >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatSignedScore(run.scoreDiffVsPrev)}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3 md:block">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${llmJudgeStatusClass(run.status)}`}>
                      {llmJudgeStatusLabel(run.status)}
                    </span>
                    <div className="mt-1 text-xs text-text-3">{formatDateTime(run.finishedAt ?? run.createdAt)}</div>
                  </div>
                </button>
              ))}
              {runs.length === 0 ? <div className="px-5 py-8 text-center text-sm text-text-3">当前筛选下暂无运行记录。</div> : null}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-text-1">运行详情</div>
                <div className="mt-1 text-sm text-text-2">验证“运行记录查看”链路，展示分维度得分与任务摘要。</div>
              </div>
              {selectedRun ? (
                <button
                  type="button"
                  onClick={() => navigate({ pathname: '/quality/health-score/' + selectedRun.featureId, search: buildSearch(location.search, { view: currentView }) })}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
                >
                  查看健康度
                </button>
              ) : null}
            </div>
            {selectedRun ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-bg p-4">
                  <div className="text-sm font-medium text-text-1">{selectedRun.featureName}</div>
                  <div className="mt-2 text-sm text-text-2">{selectedRun.summary}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-3">
                    <span>模型 {selectedRun.judgeModel}</span>
                    <span>样本 {formatLargeNumber(selectedRun.sampleSize)}</span>
                    <span>Bad Case {selectedRun.badCaseCount}</span>
                    <span>创建人 {currentUser.name}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedRun.dimensions.map((dimension) => (
                    <div key={dimension.key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-text-2">{dimension.label}</span>
                        <span className="font-medium text-text-1">{formatScore(dimension.score)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-gray-900" style={{ width: `${Math.max(dimension.score, 8)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">请选择一条运行记录查看详情。</div>
            )}
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-text-1">Bad Case 库</div>
              <div className="mt-1 text-sm text-text-2">最小可演示操作包括加训、转人工复核和关闭问题。</div>
            </div>
            <div className="text-xs text-text-3">白名单权限：{canManageWhitelist ? '已开通' : '未开通'}</div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {badCases.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-text-1">{item.featureName}</div>
                    <div className="mt-1 text-xs text-text-3">
                      {item.id} · 得分 {formatScore(item.score)} · {formatDateTime(item.updatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badCaseSeverityClass(item.severity)}`}>{item.severity}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{badCaseStatusLabel(item.status)}</span>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-bg p-3 text-sm text-text-2">
                  <div className="font-medium text-text-1">问题样本</div>
                  <div className="mt-2">{item.question}</div>
                  <div className="mt-3 text-xs text-text-3">原因：{item.reason}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canManageBadCases}
                    onClick={() => handleBadCaseAction(item.id, 'add_to_training')}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    加入训练集
                  </button>
                  <button
                    type="button"
                    disabled={!canManageBadCases}
                    onClick={() => handleBadCaseAction(item.id, 'push_manual_review')}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    转人工复核
                  </button>
                  <button
                    type="button"
                    disabled={!canManageBadCases}
                    onClick={() => handleBadCaseAction(item.id, 'resolve')}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    关闭问题
                  </button>
                </div>
              </div>
            ))}
            {badCases.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">当前筛选下暂无 Bad Case。</div> : null}
          </div>
        </div>
      </div>

      <LLMJudgeCreateModal
        open={modalOpen}
        templates={templates}
        features={featureOptions}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateRun}
        submitting={submitting}
      />
    </SemanticPageFrame>
  );
}

function FewShotEditor({
  items,
  onChange,
}: {
  items: LLMJudgeFewShotExample[];
  onChange: (next: LLMJudgeFewShotExample[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-text-1">Few-shot #{index + 1}</div>
            <button
              type="button"
              onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))}
              className="text-xs text-text-3 hover:text-rose-600"
            >
              删除
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-medium text-text-3">
              输入
              <textarea
                value={item.input}
                onChange={(e) =>
                  onChange(items.map((candidate) => (candidate.id === item.id ? { ...candidate, input: e.target.value } : candidate)))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              />
            </label>
            <label className="text-xs font-medium text-text-3">
              期望输出
              <textarea
                value={item.expectedOutput}
                onChange={(e) =>
                  onChange(items.map((candidate) => (candidate.id === item.id ? { ...candidate, expectedOutput: e.target.value } : candidate)))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              />
            </label>
            <label className="text-xs font-medium text-text-3">
              备注
              <input
                value={item.note ?? ''}
                onChange={(e) =>
                  onChange(items.map((candidate) => (candidate.id === item.id ? { ...candidate, note: e.target.value } : candidate)))
                }
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              />
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            {
              id: `few_shot_${Date.now()}`,
              input: '',
              expectedOutput: '',
              note: '',
            },
          ])
        }
        className="rounded-lg border border-dashed border-border bg-bg px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
      >
        新增 few-shot
      </button>
    </div>
  );
}

export function QualityLLMJudgeTemplatesPage() {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const userPermission = useGlobalState((s) => s.userPermission);
  const enabledActions = userPermission?.enabledActions ?? [];
  const canView = hasAnyAction(enabledActions, [QUALITY_ACTIONS.llmJudgeView, QUALITY_ACTIONS.llmJudgeTemplateManage]);
  const canManageTemplates = hasAction(enabledActions, QUALITY_ACTIONS.llmJudgeTemplateManage);

  const [featureTypeFilter, setFeatureTypeFilter] = useState<'all' | FeatureType>('all');
  const [templates, setTemplates] = useState<LLMJudgePromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<LLMJudgePromptTemplate | null>(null);
  const [prompt, setPrompt] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [fewShots, setFewShots] = useState<LLMJudgeFewShotExample[]>([]);
  const [changeNote, setChangeNote] = useState('优化 few-shot 与评分规则');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: 'LLM 评判', to: '/quality/llm-judge' },
    { label: '模板管理' },
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getLLMJudgePromptTemplatesApi({ featureType: featureTypeFilter }).then((result) => {
      if (!active) return;
      setTemplates(result.items);
      setSelectedTemplateId((current) => current || result.items[0]?.id || '');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [featureTypeFilter]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      return;
    }
    let active = true;
    void getLLMJudgePromptTemplateApi(selectedTemplateId).then((result) => {
      if (!active || !result) return;
      setSelectedTemplate(result);
      setPrompt(result.prompt);
      setRubricText(result.rubric.join('\n'));
      setFewShots(result.fewShots);
    });
    return () => {
      active = false;
    };
  }, [selectedTemplateId]);

  const refreshDetail = async (templateId: string) => {
    const [list, detail] = await Promise.all([
      getLLMJudgePromptTemplatesApi({ featureType: featureTypeFilter }),
      getLLMJudgePromptTemplateApi(templateId),
    ]);
    setTemplates(list.items);
    if (detail) {
      setSelectedTemplate(detail);
      setSelectedTemplateId(detail.id);
      setPrompt(detail.prompt);
      setRubricText(detail.rubric.join('\n'));
      setFewShots(detail.fewShots);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const saved = await putLLMJudgePromptTemplateApi(selectedTemplate.id, {
        prompt,
        rubric: rubricText.split('\n').map((item) => item.trim()).filter(Boolean),
        fewShots,
        operator: currentUser.name,
        changeNote,
        name: selectedTemplate.name,
        featureType: selectedTemplate.featureType,
        featureDomain: selectedTemplate.featureDomain,
        description: selectedTemplate.description,
        judgeModel: selectedTemplate.judgeModel,
        tags: selectedTemplate.tags,
      });
      if (saved) {
        setToast(`已生成新版本 ${saved.currentVersion}`);
        await refreshDetail(saved.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (version: string) => {
    if (!selectedTemplate) return;
    const rolled = await rollbackLLMJudgePromptTemplateApi(selectedTemplate.id, version, currentUser.name);
    if (rolled) {
      setToast(`已回滚并生成新版本 ${rolled.currentVersion}`);
      await refreshDetail(rolled.id);
    }
  };

  if (currentView !== 'producer') {
    return (
      <SemanticPageFrame section="llm-judge-templates" title="Prompt 模板管理" subtitle="支持编辑 Prompt、few-shots、保存新版本和版本回滚。">
        <RestrictedSemanticPanel title="当前视角不承接模板管理" description="模板管理仅在供给侧工作台中使用，请切换到 `producer` 视角继续。" />
      </SemanticPageFrame>
    );
  }

  if (!canView) {
    return (
      <SemanticPageFrame section="llm-judge-templates" title="Prompt 模板管理" subtitle="支持编辑 Prompt、few-shots、保存新版本和版本回滚。">
        <RestrictedSemanticPanel title="当前角色无模板管理权限" description="该页面仅向具备 LLM 评判访问权限的角色开放。" />
      </SemanticPageFrame>
    );
  }

  return (
    <SemanticPageFrame
      section="llm-judge-templates"
      title="Prompt 模板管理"
      subtitle="按特征类型查看模板、编辑 Prompt 与 few-shots，并保存新版本。"
      action={
        <Link
          to={{ pathname: '/quality/llm-judge', search: buildSearch(location.search, { view: currentView }) }}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
        >
          返回运行页
        </Link>
      }
    >
      <div className="space-y-6">
        {toast ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div> : null}

        <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
            <label className="text-xs font-medium text-text-3">
              特征类型
              <select
                value={featureTypeFilter}
                onChange={(e) => setFeatureTypeFilter(e.target.value as 'all' | FeatureType)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              >
                <option value="all">全部</option>
                {FEATURE_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {featureTypeLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm text-text-2">
              模板版本链路：选中模板后可直接编辑 `Prompt`、`rubric` 和 `few-shots`，保存会自动生成新版本；历史版本支持一键回滚。
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-card border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="text-lg font-semibold text-text-1">模板列表</div>
              <div className="mt-1 text-sm text-text-2">按特征类型筛选，选择后进入版本编辑态。</div>
            </div>
            <div className="divide-y divide-border">
              {templates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(item.id)}
                  className={`w-full px-5 py-4 text-left transition ${selectedTemplateId === item.id ? 'bg-module-dashboard/5' : 'bg-white hover:bg-bg'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-text-1">{item.name}</div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.currentVersion}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-text-2">{item.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-3">
                    <span>{featureTypeLabel(item.featureType)}</span>
                    <span>{featureDomainLabel(item.featureDomain)}</span>
                    <span>{item.judgeModel}</span>
                    <span>更新于 {formatDateTime(item.updatedAt)}</span>
                  </div>
                </button>
              ))}
              {!loading && templates.length === 0 ? <div className="px-5 py-8 text-center text-sm text-text-3">当前筛选下暂无模板。</div> : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              {selectedTemplate ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-text-1">{selectedTemplate.name}</div>
                      <div className="mt-1 text-sm text-text-2">
                        当前版本 {selectedTemplate.currentVersion} · 最近更新人 {selectedTemplate.updatedBy}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canManageTemplates || saving}
                      onClick={handleSave}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存新版本'}
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="block text-xs font-medium text-text-3">
                      Prompt
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={8}
                        disabled={!canManageTemplates}
                        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40 disabled:bg-bg"
                      />
                    </label>
                    <label className="block text-xs font-medium text-text-3">
                      Rubric（每行一条）
                      <textarea
                        value={rubricText}
                        onChange={(e) => setRubricText(e.target.value)}
                        rows={5}
                        disabled={!canManageTemplates}
                        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40 disabled:bg-bg"
                      />
                    </label>
                    <div>
                      <div className="mb-2 text-xs font-medium text-text-3">Few-shots</div>
                      <FewShotEditor items={fewShots} onChange={setFewShots} />
                    </div>
                    <label className="block text-xs font-medium text-text-3">
                      变更说明
                      <input
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        disabled={!canManageTemplates}
                        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40 disabled:bg-bg"
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">请选择左侧模板开始编辑。</div>
              )}
            </div>

            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <div className="text-lg font-semibold text-text-1">历史版本</div>
              <div className="mt-1 text-sm text-text-2">支持从旧版本回滚，回滚行为会生成新的当前版本。</div>
              <div className="mt-4 space-y-3">
                {selectedTemplate?.versions
                  .slice()
                  .reverse()
                  .map((version) => (
                    <div key={version.version} className="rounded-xl border border-border bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-text-1">{version.version}</div>
                          <div className="mt-1 text-xs text-text-3">
                            {formatDateTime(version.createdAt)} · {version.createdBy}
                          </div>
                        </div>
                        {version.isCurrent ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">当前版本</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canManageTemplates}
                            onClick={() => handleRollback(version.version)}
                            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            回滚
                          </button>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-text-2">{version.changeNote}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SemanticPageFrame>
  );
}

function SurveyDispatchModal({
  open,
  templates,
  summaries,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  templates: SurveyTemplate[];
  summaries: SurveySummary[];
  onClose: () => void;
  onSubmit: (payload: {
    templateId: string;
    featureId: string;
    channel: SurveyDispatch['channel'];
    sampleSize: number;
    scheduledAt: string;
    autoCreateTicket: boolean;
  }) => void;
  submitting: boolean;
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [featureId, setFeatureId] = useState(summaries[0]?.featureId ?? '');
  const [channel, setChannel] = useState<SurveyDispatch['channel']>('feishu');
  const [sampleSize, setSampleSize] = useState(200);
  const [scheduledAt, setScheduledAt] = useState('2026-04-27T10:00:00.000Z');
  const [autoCreateTicket, setAutoCreateTicket] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTemplateId(templates[0]?.id ?? '');
    setFeatureId(summaries[0]?.featureId ?? '');
  }, [open, summaries, templates]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-card border border-border bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-text-1">发起问卷投放</div>
            <div className="mt-1 text-xs text-text-3">展示模板规则、投放渠道和低分自动建单配置。</div>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-text-3 hover:text-text-1">
            关闭
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-text-3">
            模板
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} / {surveyScenarioLabel(item.scenario)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-3">
            特征
            <select
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              {summaries.map((item) => (
                <option key={item.featureId} value={item.featureId}>
                  {item.featureName} / {featureTypeLabel(item.featureType)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-text-3">
            投放渠道
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as SurveyDispatch['channel'])}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            >
              <option value="feishu">飞书</option>
              <option value="email">邮件</option>
              <option value="console">控制台</option>
            </select>
          </label>
          <label className="text-xs font-medium text-text-3">
            样本量
            <input
              type="number"
              min={50}
              step={10}
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            />
          </label>
          <label className="text-xs font-medium text-text-3 md:col-span-2">
            计划时间
            <input
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-2 md:col-span-2">
            <input type="checkbox" checked={autoCreateTicket} onChange={(e) => setAutoCreateTicket(e.target.checked)} />
            低分自动建单
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-gray-300 hover:text-text-1"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!templateId || !featureId || submitting}
            onClick={() => onSubmit({ templateId, featureId, channel, sampleSize, scheduledAt, autoCreateTicket })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '提交中...' : '创建投放'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function QualitySurveyPage() {
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const userPermission = useGlobalState((s) => s.userPermission);
  const enabledActions = userPermission?.enabledActions ?? [];
  const canView = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.surveyView,
    QUALITY_ACTIONS.surveyDispatchCreate,
    QUALITY_ACTIONS.surveyTicketCreate,
  ]);
  const canCreateDispatch = hasAnyAction(enabledActions, [
    QUALITY_ACTIONS.surveyDispatchCreate,
    QUALITY_ACTIONS.surveyDispatchManage,
  ]);
  const canCreateTicket = hasAction(enabledActions, QUALITY_ACTIONS.surveyTicketCreate);

  const [scenarioFilter, setScenarioFilter] = useState<'all' | SurveyTemplateScenario>('all');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<'all' | SurveyDispatch['status']>('all');
  const [featureTypeFilter, setFeatureTypeFilter] = useState<'all' | FeatureType>('all');
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [dispatches, setDispatches] = useState<SurveyDispatch[]>([]);
  const [summaries, setSummaries] = useState<SurveySummary[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [responses, setResponses] = useState<Awaited<ReturnType<typeof getSurveyResponsesApi>>['items']>([]);
  const [wordCloud, setWordCloud] = useState<SurveyWordCloudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  useBreadcrumb([
    { label: '质量', to: '/quality' },
    { label: '问卷反馈' },
  ]);

  const loadPage = async () => {
    setLoading(true);
    const [templateData, dispatchData, summaryData] = await Promise.all([
      getSurveyTemplatesApi({ scenario: scenarioFilter }),
      getSurveyDispatchesApi({ status: dispatchStatusFilter }),
      getSurveySummariesApi({ featureType: featureTypeFilter }),
    ]);
    setTemplates(templateData.items);
    setDispatches(dispatchData.items);
    setSummaries(summaryData.items);
    setSelectedFeatureId((current) => current || summaryData.items[0]?.featureId || '');
    setLoading(false);
  };

  useEffect(() => {
    void loadPage();
  }, [scenarioFilter, dispatchStatusFilter, featureTypeFilter]);

  useEffect(() => {
    if (!selectedFeatureId) {
      setResponses([]);
      setWordCloud([]);
      return;
    }
    void Promise.all([getSurveyResponsesApi({ featureId: selectedFeatureId }), getSurveyWordCloudApi(selectedFeatureId)]).then(
      ([responseData, wordCloudData]) => {
        setResponses(responseData.items);
        setWordCloud(wordCloudData);
      },
    );
  }, [selectedFeatureId]);

  const selectedSummary = useMemo(
    () => summaries.find((item) => item.featureId === selectedFeatureId) ?? null,
    [selectedFeatureId, summaries],
  );
  const selectedDispatches = useMemo(
    () => dispatches.filter((item) => item.featureId === selectedFeatureId).slice(0, 3),
    [dispatches, selectedFeatureId],
  );
  const lowScoreResponses = useMemo(
    () => responses.filter((item) => item.csat < 3 || item.nps <= 6).slice(0, 6),
    [responses],
  );

  const handleCreateDispatch = async (payload: {
    templateId: string;
    featureId: string;
    channel: SurveyDispatch['channel'];
    sampleSize: number;
    scheduledAt: string;
    autoCreateTicket: boolean;
  }) => {
    setSubmittingDispatch(true);
    try {
      const created = await postSurveyDispatchApi(payload);
      if (created) {
        setToast(`已创建投放 ${created.id}`);
        setDispatchModalOpen(false);
        await loadPage();
      }
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedSummary) return;
    const created = await postSurveyLowScoreTicketApi({
      featureId: selectedSummary.featureId,
      reporterUserId: currentUser.id,
      reporterUserName: currentUser.name,
      reporterTeamName: currentUser.team,
      summary: `${selectedSummary.summary} 低分样本 ${selectedSummary.lowScoreCount} 份，需要跟进解释性、稳定性与接入体验。`,
    });
    if (created) {
      setToast(`已生成治理工单 ${created.ticketNo}`);
      await loadPage();
      const responseData = await getSurveyResponsesApi({ featureId: selectedSummary.featureId });
      setResponses(responseData.items);
    }
  };

  if (currentView !== 'producer') {
    return (
      <SemanticPageFrame section="survey" title="问卷反馈" subtitle="模板、投放记录、反馈聚合与低分建单链路。">
        <RestrictedSemanticPanel title="当前视角不承接问卷反馈" description="问卷反馈页仅在供给侧工作台中使用，请切换到 `producer` 视角继续。" />
      </SemanticPageFrame>
    );
  }

  if (!canView) {
    return (
      <SemanticPageFrame section="survey" title="问卷反馈" subtitle="模板、投放记录、反馈聚合与低分建单链路。">
        <RestrictedSemanticPanel title="当前角色无问卷反馈权限" description="该页面仅向 `producer`、`producer_admin`、`platform_admin` 开放。" />
      </SemanticPageFrame>
    );
  }

  return (
    <SemanticPageFrame
      section="survey"
      title="问卷反馈"
      subtitle="三段式管理页：模板、投放、反馈聚合，并联动低分告警与治理工单。"
      action={
        <button
          type="button"
          disabled={!canCreateDispatch}
          onClick={() => setDispatchModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发起投放
        </button>
      }
    >
      <div className="space-y-6">
        {toast ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div> : null}

        <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs font-medium text-text-3">
              模板场景
              <select
                value={scenarioFilter}
                onChange={(e) => setScenarioFilter(e.target.value as 'all' | SurveyTemplateScenario)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              >
                <option value="all">全部</option>
                {SURVEY_TEMPLATE_SCENARIOS.map((item) => (
                  <option key={item} value={item}>
                    {surveyScenarioLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-text-3">
              投放状态
              <select
                value={dispatchStatusFilter}
                onChange={(e) => setDispatchStatusFilter(e.target.value as 'all' | SurveyDispatch['status'])}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              >
                <option value="all">全部</option>
                {SURVEY_DISPATCH_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {surveyDispatchStatusLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-text-3">
              特征类型
              <select
                value={featureTypeFilter}
                onChange={(e) => setFeatureTypeFilter(e.target.value as 'all' | FeatureType)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-dashboard/40"
              >
                <option value="all">全部</option>
                {FEATURE_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {featureTypeLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-card border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="text-lg font-semibold text-text-1">问卷模板</div>
              <div className="mt-1 text-sm text-text-2">覆盖首次订阅、变更体验和季度 NPS 三类模板。</div>
            </div>
            <div className="space-y-4 p-5">
              {templates.map((template) => (
                <div key={template.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-text-1">{template.name}</div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{template.version}</span>
                  </div>
                  <div className="mt-2 text-sm text-text-2">{template.description}</div>
                  <div className="mt-3 space-y-2 text-xs text-text-3">
                    <div>场景：{surveyScenarioLabel(template.scenario)}</div>
                    <div>规则：{template.autoTriggerRule}</div>
                    <div>受众：{template.audienceRule}</div>
                    <div>问题数：{template.questions.length}</div>
                  </div>
                </div>
              ))}
              {!loading && templates.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">当前筛选下暂无模板。</div> : null}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="text-lg font-semibold text-text-1">投放记录</div>
              <div className="mt-1 text-sm text-text-2">展示投放渠道、规则、低分告警和自动建单开关。</div>
            </div>
            <div className="space-y-4 p-5">
              {dispatches.map((dispatch) => (
                <button
                  key={dispatch.id}
                  type="button"
                  onClick={() => setSelectedFeatureId(dispatch.featureId)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedFeatureId === dispatch.featureId ? 'border-module-dashboard/30 bg-module-dashboard/5' : 'border-border bg-white hover:bg-bg'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-text-1">{dispatch.featureName}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${surveyDispatchStatusClass(dispatch.status)}`}>
                      {surveyDispatchStatusLabel(dispatch.status)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-text-2">
                    {dispatch.templateName} · {dispatch.channel} · 样本 {dispatch.sampleSize}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-3">
                    <span>规则：{dispatch.audienceRule}</span>
                    <span>回收 {dispatch.responseCount}</span>
                    <span>低分告警 {dispatch.lowScoreAlertCount}</span>
                    <span>{dispatch.autoCreateTicket ? '已开启自动建单' : '仅提醒不建单'}</span>
                  </div>
                </button>
              ))}
              {!loading && dispatches.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">当前筛选下暂无投放记录。</div> : null}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">反馈聚合</div>
            <div className="mt-1 text-sm text-text-2">按特征聚合反馈概览，联动低分告警、词云和工单入口。</div>
            {selectedSummary ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-bg p-4">
                  <div className="font-medium text-text-1">{selectedSummary.featureName}</div>
                  <div className="mt-2 text-sm text-text-2">{selectedSummary.summary}</div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-xs text-text-3">CSAT</div>
                      <div className="mt-1 text-xl font-semibold text-text-1">{selectedSummary.csat.toFixed(1)}</div>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-xs text-text-3">NPS</div>
                      <div className="mt-1 text-xl font-semibold text-text-1">{selectedSummary.nps}</div>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-xs text-text-3">低分告警</div>
                      <div className="mt-1 text-xl font-semibold text-text-1">{selectedSummary.lowScoreCount}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <div className="text-sm font-medium text-text-1">治理动作</div>
                  <div className="mt-2 text-sm text-text-2">
                    问卷详情已聚合 {selectedSummary.responseCount} 份答卷，相关工单 {selectedSummary.relatedTicketIds.length} 个。
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canCreateTicket}
                      onClick={handleCreateTicket}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      一键生成治理工单
                    </button>
                    {selectedDispatches.some((item) => item.autoCreateTicket && item.lowScoreAlertCount > 0) ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">存在低分自动建单规则</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">请选择一条投放记录查看反馈聚合。</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">词云与 Top Issues</div>
            <div className="mt-1 text-sm text-text-2">低分反馈会放大到词云和问题摘要，便于治理归因。</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {wordCloud.slice(0, 18).map((item) => (
                <span
                  key={`${item.term}_${item.weight}`}
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${wordCloudToneClass(item.sentiment)}`}
                  style={{ fontSize: `${12 + Math.min(item.weight, 100) / 12}px` }}
                >
                  {item.term}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-bg p-4">
              <div className="text-sm font-medium text-text-1">Top Issues</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSummary?.topIssues.map((issue) => (
                  <span key={issue} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-text-2">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="text-lg font-semibold text-text-1">低分样本明细</div>
            <div className="mt-1 text-sm text-text-2">用于验证低分告警、自动建单与人工补单链路。</div>
            <div className="mt-4 space-y-3">
              {lowScoreResponses.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-text-1">{item.respondentTeamName}</div>
                      <div className="mt-1 text-xs text-text-3">
                        CSAT {item.csat} / 5 · NPS {item.nps} · {formatDateTime(item.submittedAt)}
                      </div>
                    </div>
                    {item.generatedTicketId ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        已建单 {item.generatedTicketId}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">未建单</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-text-2">{item.comment}</div>
                  <div className="mt-3 rounded-lg bg-bg p-3 text-xs text-text-3">
                    {item.answers.slice(0, 2).map((answer) => (
                      <div key={answer.questionId}>
                        {answer.questionTitle}：{Array.isArray(answer.value) ? answer.value.join(' / ') : String(answer.value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {lowScoreResponses.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-sm text-text-3">当前特征暂无低分样本。</div> : null}
            </div>
          </div>
        </div>
      </div>

      <SurveyDispatchModal
        open={dispatchModalOpen}
        templates={templates}
        summaries={summaries}
        onClose={() => setDispatchModalOpen(false)}
        onSubmit={handleCreateDispatch}
        submitting={submittingDispatch}
      />
    </SemanticPageFrame>
  );
}
