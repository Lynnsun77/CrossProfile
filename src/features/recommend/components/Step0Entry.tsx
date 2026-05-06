import { useEffect, useMemo } from 'react';
import { AIWorkbench } from '../../../components/common/AIWorkbench';
import { useRecommendStore } from '../hooks/useRecommendStore';
import type { RecommendInput } from '../types';

type Scenario = { id: string; icon: string; label: string; template: string; mode?: 'paste_url' | 'normal' };

const SCENARIOS: Scenario[] = [
  { id: 's1', icon: '📊', label: '我已有 5A6C 诊断结果', template: '我的商家 A3 转化率低，想…' },
  { id: 's2', icon: '🤔', label: '我不知道问题在哪', template: '请帮我先做一次诊断…' },
  { id: 's3', icon: '📄', label: '我有一份需求文档', template: '', mode: 'paste_url' },
  { id: 's4', icon: '🧮', label: '我想找特征组合', template: '我想找一组能提升转化的特征组合，优先考虑跨域可泛化…' },
];

const GOALS: Array<{ id: NonNullable<RecommendInput['goalId']>; label: string }> = [
  { id: 'growth', label: '拉新增长' },
  { id: 'conversion', label: '促进转化' },
  { id: 'retention', label: '提升复购' },
  { id: 'efficiency', label: '提升效率' },
];

const SCENES: Array<{ id: NonNullable<RecommendInput['sceneId']>; label: string }> = [
  { id: 'cross', label: '跨域联动' },
  { id: 'local', label: '本地生活' },
  { id: 'ecom', label: '电商经营' },
];

function isNonEmpty(text?: string) {
  return Boolean(text && text.trim().length > 0);
}

export function Step0Entry({
  variant = 'embedded',
  onSubmitted,
}: {
  // embedded: used inside MarketplacePage; page: used inside RecommendPage
  variant?: 'embedded' | 'page';
  onSubmitted?: () => void;
}) {
  const subRole = useRecommendStore((s) => s.subRole);
  const setSubRole = useRecommendStore((s) => s.setSubRole);
  const inputText = useRecommendStore((s) => s.input.text ?? '');
  const goalId = useRecommendStore((s) => s.input.goalId);
  const sceneId = useRecommendStore((s) => s.input.sceneId);
  const docUrl = useRecommendStore((s) => s.input.docUrl);
  const setInputText = useRecommendStore((s) => s.setInputText);
  const setScenarioId = useRecommendStore((s) => s.setScenarioId);
  const setGoalId = useRecommendStore((s) => s.setGoalId);
  const setSceneId = useRecommendStore((s) => s.setSceneId);
  const startParse = useRecommendStore((s) => s.startParse);

  const canSend = useMemo(() => isNonEmpty(inputText) || isNonEmpty(docUrl), [docUrl, inputText]);

  useEffect(() => {
    if (variant !== 'page') return;
    const timerId = window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('#recommend-workbench input[type="text"]')?.focus();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [variant]);

  const applyScenario = (s: Scenario) => {
    setScenarioId(s.id);

    if (s.id === 's4') {
      // Spec: selecting this scenario switches to algorithm sub-role.
      setSubRole('algorithm');
    }

    if (s.mode === 'paste_url') {
      setInputText('');
      return;
    }

    setInputText(s.template);
  };

  const submit = () => {
    if (!canSend) return;
    startParse();

    if (onSubmitted) {
      onSubmitted();
      return;
    }
  };

  const selectedGoals = useMemo(() => (goalId ? [goalId] : []), [goalId]);
  const resolvedSceneId = (() => {
    if (!sceneId) return 'cross';
    if (sceneId === 'local' || sceneId.startsWith('local_')) return 'local';
    if (sceneId === 'ecom' || sceneId.startsWith('ecom_')) return 'ecom';
    return 'cross';
  })();
  const role = subRole === 'algorithm' ? 'algo' : 'business';
  const workbenchTitle = subRole === 'algorithm' ? '告诉我你想找的特征组合或可复用资产:' : '告诉我你的业务目标:';
  const workbenchPlaceholder =
    subRole === 'algorithm'
      ? '例如：帮我找适合跨域拉新的高覆盖特征组合'
      : '例如：我想为火锅商家找到提升转化的资产组合';

  return (
    <div className="space-y-4">
      <AIWorkbench
        selectedGoals={selectedGoals}
        onGoalsChange={(nextGoals) => setGoalId(nextGoals.length > 0 ? nextGoals[nextGoals.length - 1] : undefined)}
        onSearch={submit}
        goalOptions={GOALS}
        title={workbenchTitle}
        placeholder={workbenchPlaceholder}
        scene={resolvedSceneId}
        onSceneChange={setSceneId}
        role={role}
        onRoleChange={(nextRole) => setSubRole(nextRole === 'algo' ? 'algorithm' : 'business')}
        value={inputText}
        onValueChange={setInputText}
        submitLabel="开始生成"
      />

      <section
        className="rounded-2xl border px-4 py-4 md:px-5"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--market-shadow-card)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-1">智能推荐入口</div>
            <div className="mt-1 text-sm text-text-3">粘贴飞书文档、使用预置场景或直接描述需求，统一进入智能推荐工作台。</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="text-xs font-medium text-text-3">预置场景</div>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applyScenario(s)}
              className="h-8 rounded-full border border-border bg-white px-3 text-sm text-text-2 hover:border-module-market/20"
            >
              <span className="mr-1" aria-hidden>
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-3">
          <span>当前目标: {selectionLabel(GOALS, goalId)}</span>
          <span>当前场景: {selectionLabel(SCENES, sceneId)}</span>
          {docUrl ? <span className="rounded-full bg-white px-2 py-1 text-module-market">已预置飞书文档</span> : null}
          <span>支持直接粘贴飞书文档 URL 或文本诉求</span>
        </div>
      </section>
    </div>
  );
}

function selectionLabel<T extends string>(options: Array<{ id: T; label: string }>, value?: T) {
  if (!value) return '未选择';
  return options.find((option) => option.id === value)?.label ?? value;
}
