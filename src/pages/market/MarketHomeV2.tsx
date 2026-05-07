import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { AIWorkbench } from '../../components/common/AIWorkbench';
import { AssetCard } from '../../components/common/AssetCard';
import { AgentTraceTimeline } from '../../components/common/AgentTraceTimeline';
import { FilterBar, type MarketFilters } from '../../components/common/FilterBar';
import { formatCurrency } from '../../lib/format';
import { buildAssetId } from '../../lib/runtimeTokens';
import { mockAgentScript, mockAssets, getAssetById } from '../../mock';
import { useRoleStore } from '../../store/roleStore';
import { useAgentCtxStore } from '../../store';
import type { AgentCta, AgentStep, AgentToolStatus, Asset, AssetType, Domain, HealthDotLevel, LifeCycle, RecommendMeta, Role } from '../../types';

type TabType = 'assets' | 'ranking';
type SortType = 'revenue' | 'heat' | 'latest';

// FIX-M10: AgentPhase 状态机
type AgentPhase = 
  | 'idle'            // 未发送
  | 'sending'         // 用户点发送到首个节点返回前
  | 'thinking'        // 有 active 节点
  | 'streaming_cards' // 最后一个节点完成，卡片逐张 fade-in
  | 'done';           // 全部完成

interface ReplayItem {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  status?: AgentToolStatus;
  cta?: AgentCta;
  toolName?: string;
  toolBody?: string;
}

const GOALS_BY_ROLE: Record<Role, Array<{ id: string; label: string }>> = {
  business: [
    { id: 'repurchase', label: '促复购' },
    { id: 'new-user', label: '拉新客' },
    { id: 'churn', label: '防流失' },
    { id: 'coupon', label: '券提效' },
  ],
  algo: [
    { id: 'gmv', label: 'GMV' },
    { id: 'mac', label: 'MAC' },
    { id: 'lt', label: 'LT' },
    { id: 'orders', label: '订单量' },
  ],
};

const defaultFilters: MarketFilters = {
  assetTypes: [],
  domains: [],
  lifeCycles: [],
  healthLevels: [],
  categories: [],
};

function toggleItem<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

const sceneLabelMap = {
  local: '生服',
  ecom: '电商',
  cross: '跨域',
} as const;

function renderTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}

// FIX-M10: 获取当前激活节点标签
function getActiveNodeLabel(items: ReplayItem[]): string | null {
  // 从后往前找最后一个 tool 类型的未完成节点
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.type === 'tool' && item.status === 'loading') {
      return item.toolName || '思考中';
    }
  }
  // 如果没有 loading 的 tool，找最后一个 assistant
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.type === 'assistant') {
      return '整理推荐';
    }
  }
  return null;
}

export function MarketHomeV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightAssetId = searchParams.get('asset') || '';
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const replayTimersRef = useRef<number[]>([]);
  const { role, setRole } = useRoleStore();
  const { goal, scene, setGoal, setScene } = useAgentCtxStore();

  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [sortBy, setSortBy] = useState<SortType>('revenue');
  const [filters, setFilters] = useState<MarketFilters>(defaultFilters);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // FIX-M10: 使用新的 AgentPhase 状态机
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [replayItems, setReplayItems] = useState<ReplayItem[]>([]);
  const [recommendedAssetIds, setRecommendedAssetIds] = useState<string[]>([]);
  const [showPill, setShowPill] = useState(false);

  useEffect(() => {
    return () => {
      replayTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    setSelectedGoals([]);
    setAgentPhase('idle');
    setReplayItems([]);
    setRecommendedAssetIds([]);
  }, [role]);

  useEffect(() => {
    if (highlightAssetId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightAssetId, activeTab]);

  const categories = useMemo(
    () => Array.from(new Set(mockAssets.map((asset) => asset.category).filter(Boolean))) as string[],
    []
  );

  const displayedAssets = useMemo(() => {
    return [...mockAssets]
      .filter((asset) => (filters.assetTypes.length ? filters.assetTypes.includes(asset.type) : true))
      .filter((asset) => (filters.domains.length ? filters.domains.includes(asset.domain as Domain) : true))
      .filter((asset) => (filters.lifeCycles.length ? filters.lifeCycles.includes(asset.lifecycle as LifeCycle) : true))
      .filter((asset) => {
        if (!filters.healthLevels.length) return true;
        const healthSet = [
          asset.health.accuracy,
          asset.health.coverage,
          asset.health.freshness,
        ].filter((value): value is HealthDotLevel => value === 'green' || value === 'yellow' || value === 'red');
        return filters.healthLevels.some((level) => healthSet.includes(level));
      })
      .filter((asset) => (filters.categories.length ? filters.categories.includes(asset.category || '') : true))
      .sort((a, b) => {
        if (sortBy === 'revenue') return (b.historicalRevenue ?? 0) - (a.historicalRevenue ?? 0);
        if (sortBy === 'heat') return (b.heat ?? b.subs) - (a.heat ?? a.subs);
        return b.id.localeCompare(a.id);
      });
  }, [filters, sortBy]);

  // FIX-M12: 获取推荐卡片数据
  const recommendedAssets = useMemo(() => {
    return recommendedAssetIds.map(id => getAssetById(id)).filter(Boolean);
  }, [recommendedAssetIds]);

  const goalLabel = useMemo(() => {
    const map = Object.fromEntries(GOALS_BY_ROLE[role].map((opt) => [opt.id, opt.label]));
    const label = selectedGoals.length ? map[selectedGoals[0]] || selectedGoals[0] : null;
    return label;
  }, [role, selectedGoals]);

  useEffect(() => {
    if (goalLabel) setGoal(goalLabel);
    if (!goalLabel) setGoal(null);
  }, [goalLabel, setGoal]);

  // FIX-M10: pill 显示控制
  useEffect(() => {
    if (agentPhase === 'idle') {
      setShowPill(false);
      return;
    }
    
    setShowPill(true);
    
    // done 状态 2s 后淡出
    if (agentPhase === 'done') {
      const timer = setTimeout(() => {
        setShowPill(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [agentPhase]);

  const runScriptReplay = (query: string) => {
    void query;
    replayTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    replayTimersRef.current = [];

    setReplayItems([]);
    setRecommendedAssetIds([]);
    setAgentPhase('sending');

    const asset = getAssetById(buildAssetId(4));
    const vars = {
      goal: goal ?? goalLabel ?? '促复购',
      scene: sceneLabelMap[scene],
      assetName: asset.nameBiz || asset.name,
    };

    let offset = 0;
    const steps = mockAgentScript as AgentStep[];

    const pushItem = (item: ReplayItem) => setReplayItems((items) => [...items, item]);
    const updateItem = (id: string, patch: Partial<ReplayItem>) =>
      setReplayItems((items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

    // FIX-M10: 发送后短暂延迟进入 thinking
    const sendingTimer = window.setTimeout(() => {
      setAgentPhase('thinking');
    }, 200);
    replayTimersRef.current.push(sendingTimer);

    steps.forEach((step) => {

      if (step.user) {
        const id = `step-${step.step}`;
        const timer = window.setTimeout(() => {
          pushItem({
            id,
            type: 'user',
            content: renderTemplate(step.user!, vars),
            cta: step.cta,
          });
        }, offset);
        replayTimersRef.current.push(timer);
        offset += 350;
      }

      if (step.tool) {
        const id = `step-${step.step}`;
        const timer = window.setTimeout(() => {
          const toolText = step.toolText ? renderTemplate(step.toolText, vars) : '';
          pushItem({
            id,
            type: 'tool',
            status: step.toolStatus ?? 'done',
            toolName: step.tool,
            toolBody: toolText,
            content: `🛠 ${step.tool} · ${toolText}`.trim(),
          });
        }, offset);
        replayTimersRef.current.push(timer);

        if (step.toolStatus === 'loading') {
          const doneTimer = window.setTimeout(() => {
            updateItem(id, { status: 'done' });
          }, offset + 800);
          replayTimersRef.current.push(doneTimer);
          offset += 800;
        } else {
          offset += 350;
        }
      }

      if (step.assistant) {
        const id = `step-${step.step}`;
        const timer = window.setTimeout(() => {
          pushItem({
            id,
            type: 'assistant',
            content: renderTemplate(step.assistant!, vars),
          });

          // FIX-M12: assistant 节点完成后触发 streaming_cards
          if (step.recommendAssetIds && step.recommendAssetIds.length > 0) {
            setRecommendedAssetIds(step.recommendAssetIds.slice(0, 3)); // 只取前3个
            setAgentPhase('streaming_cards');
            
            // 卡片展示完成后进入 done
            const doneTimer = window.setTimeout(() => {
              setAgentPhase('done');
            }, 500 + 3 * 120); // 基础延迟 + 3张卡片 stagger
            replayTimersRef.current.push(doneTimer);
          }
        }, offset);
        replayTimersRef.current.push(timer);
        offset += 350;
      }
    });
  };

  const handleSearch = (query: string) => {
    runScriptReplay(query);
  };

  const handlePrimaryAction = (asset: Asset) => {
    if (role === 'business') {
      navigate(`/marketplace/action/${asset.id}`);
      return;
    }
    navigate(`/factory/result/${asset.id}`);
  };

  const handleSecondaryAction = (asset: Asset) => {
    if (role === 'business') {
      navigate(`/marketplace/crowd/${asset.id}`);
      return;
    }

    if (asset.type === 'feature_pack') {
      navigate(`/factory/result/${asset.id}`);
      return;
    }

    navigate(`/factory/feature/${asset.id}`);
  };

  // FIX-M10: 计算 pill 文案
  const pillText = useMemo(() => {
    switch (agentPhase) {
      case 'sending':
        return '发送中…';
      case 'thinking':
        const activeLabel = getActiveNodeLabel(replayItems);
        return activeLabel ? `思考中 · ${activeLabel}` : '思考中…';
      case 'streaming_cards':
        return '整理推荐…';
      case 'done':
        return '已完成';
      default:
        return '';
    }
  }, [agentPhase, replayItems]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title="智能推荐" subtitle="跨生服电商统一交易用户画像与资产编排" moduleTone="market" />

        <div className="mb-6 rounded-ai border border-border bg-white p-6">
          <AIWorkbench
            selectedGoals={selectedGoals}
            agentPhase={agentPhase}
            onGoalsChange={(goals) => {
              setSelectedGoals(goals);
              if (agentPhase === 'idle' || agentPhase === 'done') {
                // 只有在空闲或完成状态才响应目标变化
              }
            }}
            onSearch={handleSearch}
            goalOptions={GOALS_BY_ROLE[role]}
            title="告诉我你的业务目标:"
            placeholder={role === 'business' ? '告诉我你的业务目标…' : '告诉我你在找什么样的人/特征…'}
            scene={scene}
            onSceneChange={setScene}
            role={role}
            onRoleChange={setRole}
            // FIX-M10: pill 状态
            showPill={showPill}
            pillText={pillText}
          />

          {/* FIX-M10: Agent 脚本回放 - 时间轴样式 */}
          {replayItems.length > 0 && (
            <div className="mt-4">
              <AgentTraceTimeline 
                steps={replayItems}
                title="Agent 思考链路"
                onFullscreen={() => navigate('/marketplace/agent')}
              />

              {/* FIX-M12 & FIX-M17: 推荐卡片区域 - 3卡横向Grid + minmax防撑破 */}
              {agentPhase === 'streaming_cards' || agentPhase === 'done' ? (
                <div className="mt-6">
                  <div className="mb-3 text-sm font-medium text-text-2">AI 推荐</div>
                  <div 
                    className="ai-recommend-grid grid gap-4"
                    style={{
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
                    }}
                  >
                    {recommendedAssets.map((asset, index) => {
                      const meta: RecommendMeta = {
                        sceneSimilarity: 0.92 - index * 0.02,
                        goalLift: 0.18 - index * 0.03,
                        scene: sceneLabelMap[scene],
                        goal: goal ?? goalLabel ?? '促复购',
                      };
                      return (
                        <div
                          key={asset.id}
                          className="animate-fadeInUp"
                          style={{ 
                            animationDelay: `${index * 120}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          <AssetCard
                            asset={asset}
                            role={role}
                            recommendMeta={meta}
                            isAIRecommended={true}
                            onSecondaryAction={(a) => navigate(`/marketplace/crowd/${a.id}`)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* FIX-M5 v2: 顶部横向筛选条 */}
        <FilterBar
          filters={filters}
          categories={categories}
          activeTab={activeTab}
          sortBy={sortBy}
          onTabChange={setActiveTab}
          onSortChange={setSortBy}
          onToggleAssetType={(value) => setFilters((current) => ({ ...current, assetTypes: toggleItem(current.assetTypes, value as AssetType) }))}
          onToggleDomain={(value) => setFilters((current) => ({ ...current, domains: toggleItem(current.domains, value) }))}
          onToggleLifeCycle={(value) => setFilters((current) => ({ ...current, lifeCycles: toggleItem(current.lifeCycles, value) }))}
          onToggleHealth={(value) => setFilters((current) => ({ ...current, healthLevels: toggleItem(current.healthLevels, value) }))}
          onCategoryChange={(value) => setFilters((current) => ({ ...current, categories: value }))}
          onClearAll={() => setFilters(defaultFilters)}
        />

        {/* FIX-M5 v2: 卡片网格占满整行宽度 */}
        <div>
          {activeTab === 'assets' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedAssets.map((asset) => (
                <div
                  key={asset.id}
                  ref={highlightAssetId === asset.id ? highlightRef : null}
                  className={highlightAssetId === asset.id ? 'rounded-card ring-2 ring-brand-500/35 ring-offset-2 ring-offset-bg' : ''}
                >
                  <AssetCard
                    asset={asset}
                    role={role}
                    onPrimaryAction={handlePrimaryAction}
                    onSecondaryAction={handleSecondaryAction}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAssets.slice(0, 10).map((asset, index) => (
                <div key={asset.id} className="rounded-card border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-text-1">{role === 'business' ? asset.nameBiz : asset.nameAlgo}</div>
                        <div className="text-sm text-text-3">
                          历史收益 {formatCurrency(asset.historicalRevenue ?? 0)} / 消费热度 {asset.heat ?? asset.subs}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrimaryAction(asset)}
                        className={`rounded-lg px-4 py-2 text-sm text-white ${role === 'business' ? 'bg-[#2A6DF4]' : 'bg-[#7B5BF5]'}`}
                      >
                        {role === 'business' ? '立即使用 ▶' : '加入特征包 ▶'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSecondaryAction(asset)}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-text-2"
                      >
                        {role === 'business' ? '查看诊断' : '查看详情'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(role === 'business' ? asset.chipsBiz : asset.chipsAlgo)?.map((chip) => (
                      <span key={chip} className="rounded-full bg-bg px-2 py-1 text-xs text-text-2">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FIX-M12: 动画样式 & FIX-M17: 响应式断点 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 280ms ease-out;
        }
        
        /* FIX-M17: 响应式断点 - <1280 2列, <1024 1列 */
        @media (max-width: 1279px) {
          .ai-recommend-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 1023px) {
          .ai-recommend-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
