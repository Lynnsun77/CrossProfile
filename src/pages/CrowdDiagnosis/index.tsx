import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiPortraitHero } from '../../components/crowd/AiPortraitHero';
import { DualSystemDistribution } from '../../components/crowd/DualSystemDistribution';
import { PhstQuadrants } from '../../components/crowd/PhstQuadrants';
import { Badge } from '../../components/common/Badge';
import { AiFloatingPanel } from '../../components/common/AiFloatingPanel';
import { HealthBadge } from '../../components/common/HealthBadge';
import { MetricDelta } from '../../components/common/MetricDelta';
import { PageHeader } from '../../components/common/PageHeader';
import { CrowdBasisTabs } from '../../components/crowdDiagnosis/CrowdBasisTabs';
import { LineageTable } from '../../components/crowdDiagnosis/LineageTable';
import { RuleCard } from '../../components/crowdDiagnosis/RuleCard';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatCurrency } from '../../lib/format';
import { getCrowdDetailById, mockAssets } from '../../mock';
import { useTaskStore } from '../../store/taskStore';
import type { CrowdComplianceDimension, CrowdDetail } from '../../types';
import { ComplianceLight } from './ComplianceLight';
import { ConsumerMatrix } from './components/ConsumerMatrix';
import { recordVisit } from '../../components/nav/useRecentVisits';

type ToastTone = 'success' | 'warning';

type ToastState = {
  tone: ToastTone;
  message: string;
} | null;

type ResolvedCrowdContext = {
  detail: CrowdDetail;
  requestedId?: string;
  resolvedId: string;
  actionTargetId: string;
  usedFallback: boolean;
  hint?: string;
};

const SECTION_ITEMS = [
  { id: 'module-1', index: '①', label: '资产长什么样' },
  { id: 'module-2', index: '②', label: '谁在消费它' },
  { id: 'module-3', index: '③', label: '圈人依据' },
  { id: 'module-4', index: '④', label: '合规建议' },
] as const;

const KNOWN_DETAIL_IDS = new Set(['a_001', 'a_004']);

const DIMENSION_STATUS_LABEL: Record<CrowdComplianceDimension['status'], string> = {
  green: '通过',
  yellow: '待评审',
  red: '风险',
};

const DECISION_STATUS_LABEL: Record<CrowdDetail['status'], string> = {
  ready: '可决策',
  paused: '已暂停',
  draft: '草稿中',
};

const STATUS_TONE: Record<CrowdDetail['status'], 'market' | 'active' | 'new'> = {
  ready: 'market',
  paused: 'active',
  draft: 'new',
};

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

function resolveCrowdContext(routeId?: string): ResolvedCrowdContext {
  if (routeId && KNOWN_DETAIL_IDS.has(routeId)) {
    return {
      detail: getCrowdDetailById(routeId),
      requestedId: routeId,
      resolvedId: routeId,
      actionTargetId: routeId,
      usedFallback: false,
    };
  }

  const asset = routeId ? mockAssets.find((item) => item.id === routeId) : undefined;

  if (asset && routeId) {
    const compatibleDetailId = asset.domain === 'lifestyle' ? 'a_004' : 'a_001';
    return {
      detail: getCrowdDetailById(compatibleDetailId),
      requestedId: routeId,
      resolvedId: compatibleDetailId,
      actionTargetId: routeId,
      usedFallback: true,
      hint: `当前入口传入的是资产 ID ${routeId}，已兼容映射为详情 ${compatibleDetailId}。`,
    };
  }

  const fallbackId = 'a_001';
  return {
    detail: getCrowdDetailById(fallbackId),
    requestedId: routeId,
    resolvedId: fallbackId,
    actionTargetId: routeId || fallbackId,
    usedFallback: Boolean(routeId),
    hint: routeId ? `未命中详情 ID ${routeId}，已回退为默认人群 ${fallbackId}。` : undefined,
  };
}

function ModuleSkeleton() {
  return (
    <div className="space-y-4">
      {SECTION_ITEMS.map((section) => (
        <div key={section.id} className="rounded-card border border-border bg-surface p-6 animate-pulse">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-bg" />
            <div className="h-6 w-40 rounded bg-bg" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-bg" />
            <div className="h-4 w-11/12 rounded bg-bg" />
            <div className="h-4 w-8/12 rounded bg-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleGroup({
  id,
  index,
  title,
  summary,
  children,
}: {
  id: string;
  index: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-module-market/10 text-sm font-semibold text-module-market">
          {index}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-1">{title}</h2>
          <p className="text-sm text-text-3">{summary}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function CrowdDiagnosisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addTask = useTaskStore((state) => state.addTask);
  const [activeAnchor, setActiveAnchor] = useState<(typeof SECTION_ITEMS)[number]['id']>('module-1');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const scrollFrameRef = useRef<number>();

  const crowdContext = useMemo(() => resolveCrowdContext(id), [id]);
  const { detail, actionTargetId, resolvedId, usedFallback, hint } = crowdContext;

  useBreadcrumb([
    { label: '智能推荐', to: '/marketplace' },
    { label: '人群诊断' },
  ]);

  const hasComplianceRedLight = detail.compliance.dimensions.some((item) => item.status === 'red');
  const foundryBaseId = detail.id;
  const foundryPath = detail.rule.foundryPath;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsLoading(true);

    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [resolvedId]);

  useEffect(() => {
    recordVisit('consumer-market-recent', {
      id: `crowd-${actionTargetId}`,
      label: detail.crowdName,
      to: `/marketplace/crowd/${actionTargetId}`,
      matchPath: '/marketplace/crowd/:id',
    });
  }, [actionTargetId, detail.crowdName]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const updateActiveAnchor = () => {
      const currentSection =
        SECTION_ITEMS.find((section) => {
          const element = document.getElementById(section.id);
          if (!element) {
            return false;
          }

          const rect = element.getBoundingClientRect();
          return rect.top <= 180 && rect.bottom >= 180;
        }) ?? SECTION_ITEMS[0];

      setActiveAnchor(currentSection.id);
    };

    const onScroll = () => {
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = window.requestAnimationFrame(updateActiveAnchor);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveAnchor();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [isLoading]);

  const handleAnchorClick = (anchorId: (typeof SECTION_ITEMS)[number]['id']) => {
    const target = document.getElementById(anchorId);
    if (!target) {
      return;
    }

    track('crowd_diagnosis_anchor_click', { requestedId: id, resolvedId, anchorId });
    setActiveAnchor(anchorId);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showToast = (tone: ToastTone, message: string) => {
    setToast({ tone, message });
  };

  const handleAddToCart = () => {
    track('crowd_diagnosis_add_to_cart', { requestedId: id, resolvedId, actionTargetId });
    showToast('success', `已将「${detail.crowdName}」加入购物车，占位态已触发。`);
  };

  const handleDispatch = () => {
    if (hasComplianceRedLight) {
      showToast('warning', '合规红灯，无法派发');
      return;
    }

    track('crowd_diagnosis_dispatch', { requestedId: id, resolvedId, actionTargetId });
    navigate(`/marketplace/action/${actionTargetId}`);
  };

  const handleContinueFoundry = () => {
    track('crowd_diagnosis_continue_foundry', {
      requestedId: id,
      resolvedId,
      foundryBaseId,
      foundryPath,
    });
    navigate(foundryPath);
  };

  const handleReuseTemplate = () => {
    const taskId = `crowd_reuse_${detail.id}_${Date.now()}`;
    addTask({
      id: taskId,
      crowdId: actionTargetId,
      title: `${detail.crowdName} - 模板复用`,
      created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
      crowd_size: detail.scale,
      channels: ['foundry_template'],
      status: 'queued',
    });

    track('crowd_diagnosis_reuse_template', { requestedId: id, resolvedId, actionTargetId, taskId });
    showToast('success', '模板复用任务已加入任务队列。');
  };

  const heroAction = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleAddToCart}
        className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
      >
        加入购物车
      </button>
      <button
        type="button"
        onClick={handleDispatch}
        disabled={hasComplianceRedLight}
        title={hasComplianceRedLight ? '合规红灯，无法派发' : '立即派发'}
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
          hasComplianceRedLight
            ? 'cursor-not-allowed bg-gray-300'
            : 'bg-module-market hover:opacity-90'
        }`}
      >
        {hasComplianceRedLight ? '合规红灯，无法派发' : '立即派发'}
      </button>
      <button
        type="button"
        onClick={handleContinueFoundry}
        className="rounded-lg border border-module-market/20 bg-module-market/10 px-4 py-2 text-sm font-medium text-module-market transition hover:bg-module-market/15"
      >
        继续圈选
      </button>
      <button
        type="button"
        onClick={handleReuseTemplate}
        className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
      >
        复用模板
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="人群诊断"
          subtitle="单屏决策入口，集中承载画像、消费、圈选依据、合规建议与 AI 助手。"
          moduleTone="market"
          extra={heroAction}
        />

        {toast ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {usedFallback && hint ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {hint}
          </div>
        ) : null}

        <section className="rounded-[24px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[detail.status]}>{DECISION_STATUS_LABEL[detail.status]}</Badge>
                <Badge tone="market">{detail.version}</Badge>
                <Badge tone="market">{detail.crowdCode}</Badge>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-text-1">{detail.crowdName}</h1>
                <HealthBadge level={detail.healthScore >= 85 ? 'green' : detail.healthScore >= 70 ? 'yellow' : 'red'} score={detail.healthScore} />
              </div>

              <p className="max-w-4xl text-sm leading-6 text-text-2">{detail.description}</p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-3">
                <span>
                  负责人: <span className="text-text-1">{detail.owner.name}</span>
                </span>
                <span>
                  角色: <span className="text-text-1">{detail.owner.role}</span>
                </span>
                <span>
                  团队: <span className="text-text-1">{detail.owner.team}</span>
                </span>
                <span>
                  最近更新: <span className="text-text-1">{detail.updatedAt}</span>
                </span>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-4 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
              <div className="rounded-2xl border border-module-market/15 bg-module-market/5 p-4">
                <div className="text-sm text-text-3">预估收益</div>
                <div className="mt-2 text-3xl font-semibold text-text-1">
                  {formatCurrency(detail.estimatedRevenue)}
                </div>
                <div className="mt-2 text-xs text-text-3">作为 Hero 主决策指标展示</div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm text-text-3">合规检查</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {detail.compliance.dimensions.map((item) => (
                    <span
                      key={item.key}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === 'green'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'yellow'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.label} · {DIMENSION_STATUS_LABEL[item.status]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {detail.kpis.map((kpi) => (
              <div key={kpi.key} className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-text-3">{kpi.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-text-1">{kpi.value}</div>
                  </div>
                  {kpi.trend && kpi.changeText ? (
                    <MetricDelta
                      value={kpi.trend === 'down' ? `-${kpi.changeText.replace(/^[-+]/, '')}` : kpi.changeText}
                      expected={kpi.key === 'health' ? 'up' : 'up'}
                    />
                  ) : null}
                </div>
                {kpi.hint ? <div className="mt-3 text-xs text-text-3">{kpi.hint}</div> : null}
              </div>
            ))}
          </div>
        </section>

        <div className="sticky top-16 z-20 mt-6 border-b border-border bg-bg/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
          <div className="flex flex-wrap gap-2">
            {SECTION_ITEMS.map((item) => {
              const isActive = activeAnchor === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAnchorClick(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-module-market text-white shadow-sm'
                      : 'border border-border bg-white text-text-2 hover:border-module-market/30 hover:text-module-market'
                  }`}
                >
                  {item.index} {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <ModuleSkeleton />
          ) : (
            <>
              <ModuleGroup
                id="module-1"
                index="①"
                title="资产长什么样"
                summary="用 AI 画像、双体系分布和 P-H-S-T 四象限快速理解当前人群结构。"
              >
                <AiPortraitHero detail={detail} />
                <DualSystemDistribution detail={detail} />
                <PhstQuadrants detail={detail} />
              </ModuleGroup>

              <ConsumerMatrix detail={detail} />

              <ModuleGroup
                id="module-3"
                index="③"
                title="圈人依据"
                summary="规则卡、依据分类与数据血缘全部保持只读，唯一修改入口统一前往 Foundry。"
              >
                <RuleCard rule={detail.rule} foundryLabel="去 Foundry 修改" />
                <CrowdBasisTabs categories={detail.basisTabs} foundryPath={detail.rule.foundryPath} />
                <LineageTable lineage={detail.lineage} foundryPath={detail.rule.foundryPath} />
              </ModuleGroup>

              <ComplianceLight compliance={detail.compliance} />
            </>
          )}
        </div>
      </div>

      {!isLoading ? (
        <AiFloatingPanel crowdName={detail.crowdName} assistant={detail.assistant} detailId={detail.id} />
      ) : null}
    </div>
  );
}
