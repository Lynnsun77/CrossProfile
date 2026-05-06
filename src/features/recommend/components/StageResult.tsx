import { useMemo } from 'react';
import { AIWorkbench } from '../../../components/common/AIWorkbench';
import { AssetCard } from '../../../components/common/AssetCard';
import { mockAssets } from '../../../mock';
import type { Asset, RecommendMeta, Role } from '../../../types';
import { useRecommendStore } from '../hooks/useRecommendStore';
import { ActionMatrix, FeatureBundleView, GapBar, SummaryDock } from './ResultPanels';
import { StepIndicator } from './StepIndicator';
import { ThinkingPanel } from './ThinkingPanel';

function confidenceTone(v: number) {
  if (v >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (v >= 0.6) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
}

const GOAL_LABELS = {
  growth: '拉新增长',
  conversion: '促进转化',
  retention: '提升复购',
  efficiency: '提升效率',
};

const SCENE_LABELS = {
  cross: '跨域联动',
  local: '本地生活',
  ecom: '电商经营',
};

const GOAL_OPTIONS = [
  { id: 'growth', label: '拉新增长' },
  { id: 'conversion', label: '促进转化' },
  { id: 'retention', label: '提升复购' },
  { id: 'efficiency', label: '提升效率' },
] as const;

const typeIconMap: Record<Asset['type'], Asset['icon']> = {
  crowd_template: 'crowd',
  tag: 'tag',
  feature_pack: 'pack',
  model: 'model',
};

const typeLabelMap: Record<Asset['type'], string> = {
  crowd_template: '人群模板',
  tag: '标签资产',
  feature_pack: '特征包',
  model: '模型能力',
};

function resolveAssetType(type?: string): Asset['type'] {
  if (type === 'tag') return 'tag';
  if (type === 'feature_pack' || type === 'pack' || type === 'rule' || type === 'feature') return 'feature_pack';
  if (type === 'crowd_template' || type === 'crowd') return 'crowd_template';
  return 'model';
}

type LegacySceneId = 'cross' | 'local' | 'ecom';

function normalizeSceneId(sceneId?: string): LegacySceneId {
  if (!sceneId) return 'cross';
  if (sceneId === 'local' || sceneId.startsWith('local_')) return 'local';
  if (sceneId === 'ecom' || sceneId.startsWith('ecom_')) return 'ecom';
  return 'cross';
}

function resolveNamespace(sceneId?: string): Asset['namespace'] {
  const normalized = normalizeSceneId(sceneId);
  if (normalized === 'local') return 'trade.lifestyle.*';
  if (normalized === 'ecom') return 'trade.ecommerce.*';
  return 'trade.cross.*';
}

function resolveRecommendPhase(step: ReturnType<typeof useRecommendStore.getState>['step']) {
  if (step === 'result') return 'done';
  if (step === 'parsing' || step === 'recommending') return 'thinking';
  return 'idle';
}

export function StageResult() {
  const step = useRecommendStore((s) => s.step);
  const subRole = useRecommendStore((s) => s.subRole);
  const input = useRecommendStore((s) => s.input);
  const requirement = useRecommendStore((s) => s.requirement);
  const thinkingTrace = useRecommendStore((s) => s.thinkingTrace);
  const featureBundle = useRecommendStore((s) => s.featureBundle);
  const view = useRecommendStore((s) => s.view);
  const setView = useRecommendStore((s) => s.setView);
  const setInputText = useRecommendStore((s) => s.setInputText);
  const setGoalId = useRecommendStore((s) => s.setGoalId);
  const setSceneId = useRecommendStore((s) => s.setSceneId);
  const startParse = useRecommendStore((s) => s.startParse);
  const reset = useRecommendStore((s) => s.reset);

  const summary = useMemo(() => {
    const text = (input.text ?? '').trim();
    if (text.length <= 72) return text;
    return `${text.slice(0, 72)}...`;
  }, [input.text]);

  const roleForCard: Role = subRole === 'algorithm' ? 'algo' : 'business';
  const selectedGoals = input.goalId ? [input.goalId] : [];
  const resolvedGoalLabel = input.goalId ? selectionLabel(GOAL_LABELS, input.goalId) : '业务目标';
  const resolvedSceneLabel = input.sceneId ? selectionLabel(SCENE_LABELS, normalizeSceneId(input.sceneId)) : '跨域联动';
  const recommendPhase = resolveRecommendPhase(step);
  const pillText = step === 'parsing' ? '正在解析需求' : step === 'recommending' ? '正在生成推荐' : '已生成推荐结果';
  const recommendedCards = useMemo(() => {
    if (!featureBundle) return [];

    return featureBundle.executableAssets.slice(0, 3).map((assetRef, index) => {
      const matchedAsset = mockAssets.find((asset) => asset.id === assetRef.id);
      const type = resolveAssetType(assetRef.type);
      const fallbackAsset = mockAssets.find((asset) => asset.type === type) ?? mockAssets[index] ?? mockAssets[0];
      const asset: Asset = matchedAsset
        ? matchedAsset
        : {
            ...fallbackAsset,
            id: assetRef.id,
            name: assetRef.name,
            nameBiz: assetRef.name,
            nameAlgo: assetRef.name,
            type,
            icon: typeIconMap[type],
            namespace: resolveNamespace(input.sceneId),
            desc: `${assetRef.name} 已纳入当前推荐结果，可继续查看详情与消费方式。`,
            description: `${assetRef.name} 已纳入当前推荐结果，可继续查看详情与消费方式。`,
            category: typeLabelMap[type],
            isAIRecommended: true,
          };
      const meta: RecommendMeta = {
        sceneSimilarity: Math.max(0.82, 0.94 - index * 0.04),
        goalLift: Math.max(0.08, 0.18 - index * 0.03),
        scene: resolvedSceneLabel,
        goal: resolvedGoalLabel,
      };

      return { asset, meta };
    });
  }, [featureBundle, input.sceneId, resolvedGoalLabel, resolvedSceneLabel]);

  const scopeLabels = requirement
    ? [
        requirement.miningScope.selfHistory ? '商家历史' : null,
        requirement.miningScope.benchmark ? '行业标杆' : null,
        requirement.miningScope.crossIndustry ? '跨行业' : null,
      ].filter(Boolean)
    : [];
  const actionLabels = requirement
    ? [
        requirement.actionTypes.product ? '商品' : null,
        requirement.actionTypes.marketing ? '营销' : null,
        requirement.actionTypes.content ? '内容' : null,
        requirement.actionTypes.acquisition ? '拉新' : null,
      ].filter(Boolean)
    : [];
  const featureLabels = requirement
    ? [
        requirement.featureDims.consumeLevel ? '消费力' : null,
        requirement.featureDims.scene ? '场景' : null,
        requirement.featureDims.keyword ? '关键词' : null,
        requirement.featureDims.frequency ? '频次' : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-4">
      <AIWorkbench
        selectedGoals={selectedGoals}
        onGoalsChange={(nextGoals) => setGoalId(nextGoals.length > 0 ? nextGoals[nextGoals.length - 1] : undefined)}
        onSearch={() => startParse()}
        goalOptions={[...GOAL_OPTIONS]}
        title={subRole === 'algorithm' ? '告诉我你想找的特征组合或可复用资产:' : '告诉我你的业务目标:'}
        placeholder={subRole === 'algorithm' ? '例如：帮我找适合跨域拉新的高覆盖特征组合' : '例如：我想为火锅商家找到提升转化的资产组合'}
        scene={normalizeSceneId(input.sceneId)}
        onSceneChange={setSceneId}
        agentPhase={recommendPhase}
        showPill
        pillText={pillText}
        value={input.text ?? ''}
        onValueChange={setInputText}
        submitLabel={step === 'result' ? '再次生成' : '开始生成'}
      />

      <div className="rounded-card border border-border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <StepIndicator />
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-bg px-3 py-1.5 text-sm text-text-2">
              <span>📎 已提交需求</span>
              {summary ? <span className="truncate text-text-3">{summary}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
              <span>业务目标: {selectionLabel(GOAL_LABELS, input.goalId)}</span>
              <span>策略场景: {selectionLabel(SCENE_LABELS, input.sceneId)}</span>
              {input.docUrl ? <span className="rounded-full bg-white px-2 py-1 text-module-market">已识别飞书链接</span> : null}
            </div>
          </div>
          <button type="button" onClick={reset} className="h-9 rounded-lg border border-border px-3 text-sm text-text-2 hover:border-module-market/20">
            修改需求
          </button>
        </div>
      </div>

      <ThinkingPanel steps={thinkingTrace} />

      <section
        aria-label="AI 推荐卡片区域"
        className="rounded-2xl border px-4 py-4 md:px-5"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--market-shadow-card)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-text-1">AI 推荐</div>
            <div className="mt-1 text-sm text-text-3">
              {recommendedCards.length > 0 ? '沿用现有推荐结果，只调整容器形态与展示密度。' : '推荐结果生成中，完成后会在这里展示可执行资产。'}
            </div>
          </div>
        </div>

        {recommendedCards.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3">
            {recommendedCards.map(({ asset, meta }, index) => (
              <div key={asset.id} className="animate-market-fade-in-up" style={{ animationDelay: `${index * 120}ms` }}>
                <AssetCard asset={asset} role={roleForCard} recommendMeta={meta} isAIRecommended />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-sm text-text-3">{step === 'result' ? '当前结果暂无可执行资产，保留现有动作与缺口建议。' : '推荐结果生成中，请稍候。'}</div>
            <div className="mt-4 grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`recommend-skeleton-${index}`}
                  data-testid="recommend-card-skeleton"
                  className="animate-pulse rounded-2xl border p-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="h-5 w-24 rounded bg-bg" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-bg" />
                  <div className="mt-3 h-4 w-full rounded bg-bg" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-bg" />
                  <div className="mt-6 flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-bg" />
                    <div className="h-6 w-20 rounded-full bg-bg" />
                  </div>
                  <div className="mt-8 h-10 rounded-xl bg-bg" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="rounded-card border border-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-text-1">Step1 · 需求解析卡</div>
            <div className="mt-1 text-sm text-text-3">
              {step === 'parsing' ? 'Agent 正在解析需求，解析完成后会自动进入推荐阶段。' : '需求解析完成，推荐已自动串联执行。'}
            </div>
          </div>
          <div className="inline-flex rounded-full border border-border bg-bg p-1">
            <button
              type="button"
              onClick={() => setView('A')}
              className={['rounded-full px-3 py-1 text-sm transition', view === 'A' ? 'bg-white text-text-1 shadow-sm' : 'text-text-3'].join(' ')}
            >
              A 视角
            </button>
            <button
              type="button"
              onClick={() => setView('B')}
              className={['rounded-full px-3 py-1 text-sm transition', view === 'B' ? 'bg-white text-text-1 shadow-sm' : 'text-text-3'].join(' ')}
            >
              B 视角
            </button>
          </div>
        </div>

        {!requirement ? (
          <div className="mt-4 animate-pulse space-y-3">
            <div className="h-4 w-40 rounded bg-bg" />
            <div className="h-16 rounded-xl bg-bg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-20 rounded-xl bg-bg" />
              <div className="h-20 rounded-xl bg-bg" />
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-bg p-3 text-sm">
              <div className="text-text-3">行业 / 商家</div>
              <div className="mt-1 font-medium text-text-1">{requirement.industry}</div>
              <div className="mt-1 text-text-2">
                {requirement.merchant.id} · {requirement.merchant.name}
              </div>
            </div>
            <div className="rounded-xl bg-bg p-3 text-sm">
              <div className="text-text-3">置信度</div>
              <div className={['mt-2 inline-flex rounded-full border px-3 py-1 font-medium', confidenceTone(requirement.confidence)].join(' ')}>
                {requirement.confidence.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl bg-bg p-3 text-sm md:col-span-2">
              <div className="text-text-3">问题人群</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {requirement.problems.map((item) => (
                  <span key={item.id} className="rounded-full bg-white px-3 py-1 text-text-2">
                    {item.segment} · {item.description}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-bg p-3 text-sm">
              <div className="text-text-3">挖掘范围</div>
              <div className="mt-2 text-text-1">{scopeLabels.join(' / ') || '未配置'}</div>
            </div>
            <div className="rounded-xl bg-bg p-3 text-sm">
              <div className="text-text-3">关注动作</div>
              <div className="mt-2 text-text-1">{actionLabels.join(' / ') || '未配置'}</div>
            </div>
            <div className="rounded-xl bg-bg p-3 text-sm md:col-span-2">
              <div className="text-text-3">特征维度</div>
              <div className="mt-2 text-text-1">{featureLabels.join(' / ') || '未配置'}</div>
            </div>
          </div>
        )}
      </div>

      {view === 'A' ? <ActionMatrix /> : <FeatureBundleView />}
      <GapBar />
      <SummaryDock />
    </div>
  );
}

function selectionLabel<T extends string>(map: Record<T, string>, value?: T) {
  if (!value) return '未选择';
  return map[value] ?? value;
}
