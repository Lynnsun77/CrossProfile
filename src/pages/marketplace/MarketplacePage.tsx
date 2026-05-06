import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssetCard } from '../../components/common/AssetCard';
import { MarketPageShell } from '../../components/common/MarketPageShell';
import { postGapRequest } from '../../api/gapRequest';
import { useGlobalState } from '../../store/globalState';
import type { ConsumerSubRole } from '../../store/globalState';
import { SupplierWorkbench } from './components/SupplierWorkbench';
import { RoleSwitch } from './components/RoleSwitch';
import { FilterBar } from './components/FilterBar';
import { StructuredSearchPanel } from './components/StructuredSearchPanel';
import { useFavoriteStore } from '../../store/favoriteStore';
import type { Asset, Role } from '../../types';
import { useRecommendStore } from '../../features/recommend/store/useRecommendStore';
import { DocInputBar, type SceneValue } from '../../features/recommend/components/DocInputBar';
import { RecommendChainPanel } from '../../features/recommend/components/RecommendChainPanel';
import { RecommendGroupSection } from '../../features/recommend/components/RecommendGroupSection';
import { AssetDrawer } from '../../features/recommend/components/AssetDrawer';
import { DeployConfigModal } from '../../features/recommend/components/DeployConfigModal';
import { useScriptPlayer } from '../../features/recommend/hooks/useScriptPlayer';
import { DEFAULT_DOC_TITLE } from '../../features/recommend/scripts/lark-merchant-insight.script';
import type { ChainNode, RecommendCard } from '../../features/recommend/types';
import {
  getAssetsApi,
  type AssetsRequest,
  type DataSource,
  type FeatureClassParam,
  type MarketplaceFilters,
  type MarketplaceTabParam,
  type SortDir,
  type SortKey,
} from '../../api/assets';
import {
  getMarketplaceRecommendations,
  MARKET_ROLE_COPY,
  MARKET_TRACE_DICTIONARY,
  MARKET_TRACE_FLOW,
  type MarketAgentPhase,
} from '../../mock/marketplaceV3';

const defaultFilters: MarketplaceFilters = {
  tier: null,
  dataSource: null,
  timeliness: null,
  subRange: null,
  publishedAfter: null,
};

const GOALS_BY_ROLE = {
  business: [
    { id: 'gmv', label: 'GMV' },
    { id: 'mac', label: 'MAC' },
    { id: 'orders', label: '订单量' },
    { id: 'lt', label: '留存' },
  ],
  algorithm: [
    { id: 'coverage', label: '覆盖率' },
    { id: 'stability', label: '稳定性' },
    { id: 'revenue', label: '收益' },
    { id: 'latency', label: '时效' },
  ],
} as const;

function buildChainNodeFromTrace(index: number, status: ChainNode['status']): ChainNode {
  const code = MARKET_TRACE_FLOW[index];
  const node = MARKET_TRACE_DICTIONARY[code];
  return {
    id: `market-${code}`,
    order: index + 1,
    title: node.label,
    desc: node.description,
    status,
  };
}

function assetsToRecommendCards(assets: Asset[]): RecommendCard[] {
  const TYPE_POOL = ['BTM+', '跨域', '序列'];
  const SCENE_POOL = ['电商', '热门', '会员', '跨域', '生服', '冷启动'];
  return assets.map((asset, index) => {
    const confidence = 0.85 - index * 0.05;
    const desc = asset.description ?? asset.desc ?? '';
    const audienceSize = Math.max(20, 128 - index * 24);
    return {
      id: asset.id,
      problemId: asset.id,
      actionType: 'product',
      action: 'product',
      title: asset.name,
      detail: desc,
      desc,
      summary: desc,
      referencedAssets: [{ id: asset.id, name: asset.name, type: String(asset.type) }],
      assetRefs: [{ id: asset.id, name: asset.name, type: String(asset.type) }],
      expectedKpi: { metric: 'GMV', lift: 0.12 - index * 0.02 },
      confidence,
      reasoning: desc,
      status: 'recommended',
      crowd: String(asset.type ?? ''),
      refs: [asset.name],
      kpi: `GMV ↑ ${Math.round((0.12 - index * 0.02) * 100)}%`,
      tag: confidence >= 0.8 ? '🟢' : '🟡',
      sortKeys: {
        relevance: confidence,
        revenue: (0.12 - index * 0.02) * 100,
        audienceSize,
      },
      consumers: ['增长团队', '生服 CRM'],
      consumeHeat: 80 - index * 10,
      healthStatus: 'healthy',
      reason: desc || asset.name,
      typeTags: [TYPE_POOL[index % TYPE_POOL.length], TYPE_POOL[(index + 1) % TYPE_POOL.length]],
      sceneTags: [
        SCENE_POOL[index % SCENE_POOL.length],
        SCENE_POOL[(index + 2) % SCENE_POOL.length],
        SCENE_POOL[(index + 4) % SCENE_POOL.length],
      ],
      audienceSize,
    } as RecommendCard;
  });
}

function GapRequestModal({
  open,
  onClose,
  onSubmit,
  submitting,
  submittedId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string }) => void;
  submitting: boolean;
  submittedId: string | null;
}) {
  const [title, setTitle] = useState('新增资产缺口需求');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-card border border-border bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-1">缺口需求</div>
          <button type="button" onClick={onClose} className="text-sm text-text-3 hover:text-text-1">
            关闭
          </button>
        </div>

        {submittedId ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            已提交（mock）：{submittedId}
          </div>
        ) : (
          <>
            <label className="block text-xs font-medium text-text-3">
              标题
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-market/40"
                placeholder="例如：需要跨域 X 类人群模板"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-text-3">
              描述
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-market/40"
                rows={5}
                placeholder="补充业务背景、目标指标、数据口径、期望时效等"
              />
            </label>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text-2 hover:border-module-market/20"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onSubmit({ title, description })}
                className="h-9 rounded-lg bg-module-market px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? '提交中…' : '提交（mock）'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = useGlobalState((s) => s.currentView);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);
  const setConsumerSubRole = useGlobalState((s) => s.setConsumerSubRole);
  const roleForCard: Role = consumerSubRole === 'algorithm' ? 'algo' : 'business';
  const favoriteIds = useFavoriteStore((s) => s.ids);
  const setRecommendSubRole = useRecommendStore((s) => s.setSubRole);
  const recommendGroups = useRecommendStore((s) => s.groups);
  const submitIntent = useRecommendStore((s) => s.submitIntent);
  const setIntentText = useRecommendStore((s) => s.setIntentText);
  const setIntentSource = useRecommendStore((s) => s.setIntentSource);
  const pushChainNode = useRecommendStore((s) => s.pushChainNode);
  const completeThinking = useRecommendStore((s) => s.completeThinking);
  const resetRecommend = useRecommendStore((s) => s.resetRecommend);
  const recommendDispatch = useRecommendStore((s) => s.dispatch);
  const startRecommendSession = useRecommendStore((s) => s.startSession);
  const setGoalId = useRecommendStore((s) => s.setGoalId);
  const setSceneId = useRecommendStore((s) => s.setSceneId);
  const setInputText = useRecommendStore((s) => s.setInputText);
  const intent = useRecommendStore((s) => s.intent);

  const aiPanelRef = useRef<HTMLDivElement | null>(null);
  const agentTimersRef = useRef<number[]>([]);
  const lastSubmittedQueryRef = useRef('');
  const lastManualSubmitRef = useRef<number | null>(null);

  const featureClass = (searchParams.get('featureClass') as FeatureClassParam) || 'all';
  const tab = (searchParams.get('tab') as MarketplaceTabParam) || 'all';
  const focus = searchParams.get('focus');
  const requestedSubRole = searchParams.get('subRole');
  const docFromQuery = searchParams.get('doc') || '';

  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [draftQuery, setDraftQuery] = useState(searchParams.get('q') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sortKey') as SortKey) || 'heat');
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('sortDir') as SortDir) || 'desc');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [scene, setScene] = useState<SceneValue>('local_growth');
  const [agentPhase, setAgentPhase] = useState<MarketAgentPhase>('idle');
  const [, setActiveTraceIndex] = useState<number>(-1);
  const [, setCompletedTraceCount] = useState(0);

  const [gapOpen, setGapOpen] = useState(false);
  const [gapSubmitting, setGapSubmitting] = useState(false);
  const [gapSubmittedId, setGapSubmittedId] = useState<string | null>(null);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === '') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const [items, setItems] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextSubRole = requestedSubRole === 'algorithm' || requestedSubRole === 'business' ? requestedSubRole : consumerSubRole;
    if (nextSubRole !== consumerSubRole) setConsumerSubRole(nextSubRole);
    setRecommendSubRole(nextSubRole);
  }, [consumerSubRole, requestedSubRole, setConsumerSubRole, setRecommendSubRole]);

  useEffect(() => {
    setParam('q', query || null);
  }, [query]);

  useEffect(() => {
    setParam('sortKey', sortKey === 'heat' ? null : sortKey);
  }, [sortKey]);

  useEffect(() => {
    setParam('sortDir', sortDir === 'desc' ? null : sortDir);
  }, [sortDir]);

  useEffect(() => {
    if (focus !== 'recommend') return;
    aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const target = document.getElementById('marketplace-ai-workbench');
    if (target instanceof HTMLElement) {
      window.setTimeout(() => target.focus(), 250);
    }
  }, [focus]);

  // 挂载脚本播放器，让飞书文档输入在首页同样驱动推荐链路
  useScriptPlayer({ timeScale: 0.15 });

  // 首次带 ?doc=<lark-url> 进入时自动触发飞书脚本
  const docStartedRef = useRef('');
  useEffect(() => {
    if (!docFromQuery || docStartedRef.current === docFromQuery) return;
    docStartedRef.current = docFromQuery;
    const title = docFromQuery.includes('larkoffice') ? DEFAULT_DOC_TITLE : '未命名文档';
    setIntentText(docFromQuery);
    setIntentSource('feishu_doc');
    submitIntent();
    startRecommendSession(docFromQuery, title);
    setAgentPhase('thinking');
  }, [docFromQuery, setIntentText, setIntentSource, submitIntent, startRecommendSession]);

  useEffect(() => {
    const hasVisibleResults = recommendGroups.some(
      (group) => (group.kind === 'ai' || group.kind === 'cohort') && group.cards.length > 0,
    );
    if (!hasVisibleResults) return;
    setAgentPhase('done');
  }, [recommendGroups]);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const req: AssetsRequest = {
      featureClass,
      tab,
      q: query,
      filters,
      sortKey,
      sortDir,
      favoriteIds,
    };

    setLoading(true);
    setError(null);
    getAssetsApi(req)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items as unknown as Asset[]);
        setTotal(res.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureClass, tab, query, filters, sortKey, sortDir, favoriteIds]);

  const empty = items.length === 0;

  const clearAgentTimers = () => {
    agentTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    agentTimersRef.current = [];
  };

  const resetAgentSession = () => {
    clearAgentTimers();
    setAgentPhase('idle');
    setActiveTraceIndex(-1);
    setCompletedTraceCount(0);
    resetRecommend();
    lastSubmittedQueryRef.current = '';
  };

  useEffect(() => {
    return () => clearAgentTimers();
  }, []);

  useEffect(() => {
    if (intent.source !== 'manual') return;
    if (!intent.submittedAt) return;
    if (lastManualSubmitRef.current === intent.submittedAt) return;
    lastManualSubmitRef.current = intent.submittedAt;
    runAgentSequence(intent.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent.submittedAt, intent.source, intent.text]);

  const handleScrollToAi = () => {
    aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenGap = () => {
    setGapSubmittedId(null);
    setGapOpen(true);
  };

  const submitGap = async (payload: { title: string; description: string }) => {
    setGapSubmitting(true);
    try {
      const resp = await postGapRequest({
        ...payload,
        context: {
          featureClass,
          tab,
          query,
          filters,
          sortKey,
          sortDir,
        },
      });
      setGapSubmittedId(resp.requestId);
    } finally {
      setGapSubmitting(false);
    }
  };

  const roleCopy = MARKET_ROLE_COPY[consumerSubRole];

  const selectedChips = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = [];
    if (query.trim()) chips.push({ id: 'query', label: `搜索: ${query.trim()}` });
    if (filters.tier) chips.push({ id: 'tier', label: `Tier: ${filters.tier}` });
    if (filters.dataSource) {
      const dataSourceLabelMap: Record<DataSource, string> = {
        btm_plus: 'BTM+',
        external: '外采',
        cross_domain: '跨域',
        private_end: '小端',
      };
      chips.push({ id: 'dataSource', label: `数据源: ${dataSourceLabelMap[filters.dataSource]}` });
    }
    if (filters.timeliness) chips.push({ id: 'timeliness', label: `时效: ${filters.timeliness}` });
    if (filters.subRange) chips.push({ id: 'subRange', label: `订阅: ${filters.subRange}` });
    if (filters.publishedAfter) chips.push({ id: 'publishedAfter', label: `上架: ${filters.publishedAfter}` });
    return chips;
  }, [filters, query]);

  const clearChipById = (chipId: string) => {
    if (chipId === 'query') {
      setQuery('');
      setDraftQuery('');
      return;
    }
    setFilters((prev) => ({ ...prev, [chipId]: null }));
    setDraftFilters((prev) => ({ ...prev, [chipId]: null }));
  };

  const applyStructuredSearch = () => {
    setFilters(draftFilters);
    setQuery(draftQuery.trim());
    setPanelOpen(false);
  };

  const resetStructuredSearch = () => {
    setFilters(defaultFilters);
    setDraftFilters(defaultFilters);
    setQuery('');
    setDraftQuery('');
    setSortKey('heat');
    setSortDir('desc');
  };

  const handleSubRoleChange = (nextSubRole: ConsumerSubRole) => {
    const hasUnfinishedInput = draftQuery.trim().length > 0 && draftQuery.trim() !== lastSubmittedQueryRef.current;
    const hasRunningChain = agentPhase === 'sending' || agentPhase === 'thinking' || agentPhase === 'streaming_cards';
    if ((hasUnfinishedInput || hasRunningChain) && !window.confirm('当前仍有未提交输入或未完成链路，确认切换身份并清空当前工作台状态吗？')) {
      return;
    }

    resetAgentSession();
    setSelectedGoals([]);
    setConsumerSubRole(nextSubRole);
    setRecommendSubRole(nextSubRole);
    setParam('subRole', nextSubRole);
  };

  const runAgentSequence = (submittedQuery: string) => {
    clearAgentTimers();
    lastSubmittedQueryRef.current = submittedQuery.trim();
    setPanelOpen(false);
    setCompletedTraceCount(0);
    setActiveTraceIndex(-1);
    setAgentPhase('sending');

    const pushTimer = (delay: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delay);
      agentTimersRef.current.push(timerId);
    };

    pushTimer(360, () => {
      setAgentPhase('thinking');
      setActiveTraceIndex(0);
      setCompletedTraceCount(0);
      pushChainNode(buildChainNodeFromTrace(0, 'running'));
    });

    MARKET_TRACE_FLOW.forEach((_, index) => {
      pushTimer(760 + index * 620, () => {
        setAgentPhase('thinking');
        setActiveTraceIndex(index);
        setCompletedTraceCount(index);
        if (index > 0) pushChainNode(buildChainNodeFromTrace(index - 1, 'done'));
        pushChainNode(buildChainNodeFromTrace(index, 'running'));
      });
    });

    pushTimer(760 + MARKET_TRACE_FLOW.length * 620, () => {
      setCompletedTraceCount(MARKET_TRACE_FLOW.length);
      setAgentPhase('streaming_cards');
      MARKET_TRACE_FLOW.forEach((_, idx) => pushChainNode(buildChainNodeFromTrace(idx, 'done')));
    });

    pushTimer(1460 + MARKET_TRACE_FLOW.length * 620, () => {
      const assets = getMarketplaceRecommendations(consumerSubRole);
      const cards = assetsToRecommendCards(assets);
      recommendDispatch({ type: 'SET_RECOMMENDS', payload: cards });
      completeThinking();
      setAgentPhase('done');
    });
  };

  const handleRecommendQuery = (submittedText: string) => {
    const trimmed = submittedText.trim();
    if (!trimmed) return;

    resetAgentSession();
    setIntentText(trimmed);
    setInputText(trimmed);

    const goalLabel =
      selectedGoals[0] ? GOALS_BY_ROLE[consumerSubRole].find((goal) => goal.id === selectedGoals[0])?.label ?? '' : '';
    const sceneLabelMap: Record<SceneValue, string> = {
      local_growth: '生服用增',
      local_marketing: '生服营销',
      local_ka: '生服KA',
      ecom_growth: '电商用增',
      ecom_marketing: '电商营销',
      ecom_mall: '电商商城',
    };
    setGoalId(goalLabel);
    setSceneId(sceneLabelMap[scene]);

    const isFeishuDoc =
      /bytedance\.larkoffice\.com\/(wiki|docx|docs)\//i.test(trimmed) ||
      /feishu\.cn|larksuite\.com/i.test(trimmed);

    if (isFeishuDoc) {
      const title = trimmed.includes('larkoffice') ? DEFAULT_DOC_TITLE : '未命名文档';
      setIntentSource('feishu_doc');
      submitIntent();
      startRecommendSession(trimmed, title);
      setAgentPhase('thinking');
      return;
    }

    setIntentSource('manual');
    submitIntent();
  };

  if (currentView === 'producer') return <SupplierWorkbench />;
  if (currentView !== 'consumer') return null;

  return (
    <MarketPageShell
      title={roleCopy.title}
      subtitle=""
      action={<RoleSwitch value={consumerSubRole} onChange={handleSubRoleChange} />}
    >
      <section ref={aiPanelRef} className="space-y-4">
        <div id="marketplace-ai-workbench" tabIndex={-1}>
          <DocInputBar
            goalOptions={[...GOALS_BY_ROLE[consumerSubRole]]}
            selectedGoals={selectedGoals}
            onGoalsChange={setSelectedGoals}
            scene={scene}
            onSceneChange={setScene}
            onSubmit={handleRecommendQuery}
          />
        </div>

        {agentPhase === 'idle' ? null : <RecommendChainPanel />}

        {agentPhase === 'done' ? <RecommendGroupSection /> : null}
      </section>

      <FilterBar
        panelOpen={panelOpen}
        selectedChips={selectedChips}
        tab={tab}
        sortKey={sortKey}
        sortDir={sortDir}
        resultCount={total}
        onTogglePanel={() => {
          if (!panelOpen) {
            setDraftFilters(filters);
            setDraftQuery(query);
          }
          setPanelOpen((open) => !open);
        }}
        onTabChange={(next) => setParam('tab', next === 'all' ? null : next)}
        onSortChange={(nextKey, nextDir) => {
          setSortKey(nextKey);
          setSortDir(nextDir);
        }}
        onClearChip={clearChipById}
        onResetAll={resetStructuredSearch}
      />

      <div className="hidden md:block" id="marketplace-structured-search-panel">
        <StructuredSearchPanel
          open={panelOpen}
          draftQuery={draftQuery}
          filters={draftFilters}
          resultCount={total}
          onQueryChange={setDraftQuery}
          onFilterChange={setDraftFilters}
          onApply={applyStructuredSearch}
          onReset={resetStructuredSearch}
          onClose={() => setPanelOpen(false)}
        />
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setPanelOpen(false)} aria-label="关闭筛选面板" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-auto rounded-t-3xl bg-white p-4">
            <StructuredSearchPanel
              open={panelOpen}
              draftQuery={draftQuery}
              filters={draftFilters}
              resultCount={total}
              onQueryChange={setDraftQuery}
              onFilterChange={setDraftFilters}
              onApply={applyStructuredSearch}
              onReset={resetStructuredSearch}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-card border border-border bg-white p-10 text-center">
          <div className="text-base font-semibold text-text-1">正在加载资产...</div>
          <div className="mt-2 text-sm text-text-3">请求 /api/assets（mock）</div>
        </div>
      ) : error ? (
        <div className="rounded-card border border-border bg-white p-10 text-center">
          <div className="text-base font-semibold text-text-1">资产加载失败</div>
          <div className="mt-2 text-sm text-text-3">{error}</div>
        </div>
      ) : empty ? (
        <div className="rounded-card border border-border bg-white p-10 text-center">
          <div className="text-base font-semibold text-text-1">没有找到符合条件的资产</div>
          <div className="mt-2 text-sm text-text-3">可以试试放宽筛选，或让 AI 推荐补齐缺口。</div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleScrollToAi}
              className="h-10 rounded-lg bg-module-market px-5 text-sm font-medium text-white hover:opacity-90"
            >
              滚动到智能推荐工作台
            </button>
            <button
              type="button"
              onClick={handleOpenGap}
              className="h-10 rounded-lg border border-border bg-white px-5 text-sm font-medium text-text-2 hover:border-module-market/20"
            >
              提交缺口需求（mock）
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3">
          {items.map((asset, index) => (
            <div key={asset.id} className="relative">
              {tab === 'ranking' ? (
                <div
                  className="absolute left-3 top-3 z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold text-white"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  {index + 1}
                </div>
              ) : null}
              <AssetCard asset={asset} role={roleForCard} />
            </div>
          ))}
        </div>
      )}

      <GapRequestModal
        open={gapOpen}
        onClose={() => setGapOpen(false)}
        onSubmit={submitGap}
        submitting={gapSubmitting}
        submittedId={gapSubmittedId}
      />

      <AssetDrawer />
      <DeployConfigModal />
    </MarketPageShell>
  );
}
