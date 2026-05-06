import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIWorkbench } from '../../components/common/AIWorkbench';
import { AssetCard } from '../../components/common/AssetCard';
import { AgentTraceTimeline } from '../../components/common/AgentTraceTimeline';
import { MarketPageShell } from '../../components/common/MarketPageShell';
import { buildAssetId } from '../../lib/runtimeTokens';
import { getAssetById, mockAgentScript } from '../../mock';
import { useAgentCtxStore } from '../../store';
import { useRoleStore } from '../../store/roleStore';
import type { AgentCta, AgentStep, AgentToolStatus, RecommendMeta, Role } from '../../types';

type AIState = 'idle' | 'picked' | 'thinking' | 'answered';

interface ReplayItem {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  status?: AgentToolStatus;
  cta?: AgentCta;
  toolName?: string;
  toolBody?: string;
}

const sceneLabelMap = {
  local: '生服',
  ecom: '电商',
  cross: '跨域',
} as const;

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

function renderTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}

export function MarketAgent() {
  const navigate = useNavigate();
  const replayTimersRef = useRef<number[]>([]);
  const { role, setRole } = useRoleStore();
  const { goal, scene, setGoal, setScene } = useAgentCtxStore();

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [replayItems, setReplayItems] = useState<ReplayItem[]>([]);
  const [recommendedAssetId, setRecommendedAssetId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      replayTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    setSelectedGoals([]);
    setAiState('idle');
    setReplayItems([]);
    setRecommendedAssetId(null);
  }, [role]);

  const goalLabel = useMemo(() => {
    const map = Object.fromEntries(GOALS_BY_ROLE[role].map((opt) => [opt.id, opt.label]));
    return selectedGoals.length ? map[selectedGoals[0]] || selectedGoals[0] : null;
  }, [role, selectedGoals]);

  useEffect(() => {
    if (goalLabel) setGoal(goalLabel);
    if (!goalLabel) setGoal(null);
  }, [goalLabel, setGoal]);

  const replayRecommendedAsset = recommendedAssetId ? getAssetById(recommendedAssetId) : null;

  const runScriptReplay = (query: string) => {
    void query;
    replayTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    replayTimersRef.current = [];

    setReplayItems([]);
    setAiState('thinking');
    setRecommendedAssetId(null);

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

    steps.forEach((step) => {
      if (step.user) {
        const id = `step-${step.step}`;
        const timer = window.setTimeout(() => {
          pushItem({ id, type: 'user', content: renderTemplate(step.user!, vars), cta: step.cta });
          if (step.cta) setAiState('answered');
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
          if (step.toolOutput && typeof step.toolOutput.assetId === 'string') {
            setRecommendedAssetId(step.toolOutput.assetId);
          }

        }, offset);
        replayTimersRef.current.push(timer);

        if (step.toolStatus === 'loading') {
          const doneTimer = window.setTimeout(() => updateItem(id, { status: 'done' }), offset + 800);
          replayTimersRef.current.push(doneTimer);
          offset += 800;
        } else {
          offset += 350;
        }
      }

      if (step.assistant) {
        const id = `step-${step.step}`;
        const timer = window.setTimeout(() => {
          pushItem({ id, type: 'assistant', content: renderTemplate(step.assistant!, vars) });
          if (step.recommendAssetIds?.[0]) setRecommendedAssetId(step.recommendAssetIds[0]);
        }, offset);
        replayTimersRef.current.push(timer);
        offset += 350;
      }
    });
  };

  return (
    <MarketPageShell title="Agent" subtitle="全屏脚本回放">
      <AIWorkbench
        selectedGoals={selectedGoals}
        agentPhase={aiState === 'thinking' ? 'thinking' : 'idle'}
        onGoalsChange={(goals) => {
          setSelectedGoals(goals);
          setAiState(goals.length ? 'picked' : 'idle');
        }}
        onSearch={runScriptReplay}
        goalOptions={GOALS_BY_ROLE[role]}
        title="告诉我你的业务目标:"
        placeholder={role === 'business' ? '告诉我你的业务目标/你在找什么样的人' : '告诉我你在找什么样的人/特征'}
        scene={scene}
        onSceneChange={setScene}
        role={role}
        onRoleChange={setRole}
      />

      {/* FIX-M3: Agent 脚本回放 - 时间轴样式 */}
      {replayItems.length > 0 && (
        <div className="mt-4">
          <AgentTraceTimeline
            steps={replayItems}
            title="Agent 思考链路"
          />

          {replayRecommendedAsset && (
            <div className="mt-4">
              {(() => {
                const meta: RecommendMeta = {
                  sceneSimilarity: 0.92,
                  goalLift: 0.18,
                  scene: sceneLabelMap[scene],
                  goal: goal ?? goalLabel ?? '促复购',
                };
                return (
                  <AssetCard
                    asset={replayRecommendedAsset}
                    role={role}
                    recommendMeta={meta}
                    onSecondaryAction={(asset) => navigate(`/marketplace/crowd/${asset.id}`)}
                  />
                );
              })()}
            </div>
          )}
        </div>
      )}
    </MarketPageShell>
  );
}
