import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRecommendStore } from '../store/useRecommendStore';

const ROTATING_PLACEHOLDERS = [
  '输入你的业务想法，如：我想找对价格敏感的流失高风险母婴人群用于大促召回',
  '输入你的业务想法，如：帮我找能提升 GMV 的跨域会员人群资产',
  '输入你的业务想法，如：我要做生服留存召回，需要一份高消费妈妈人群',
];

export type SceneValue =
  | 'local_growth'
  | 'local_marketing'
  | 'local_ka'
  | 'ecom_growth'
  | 'ecom_marketing'
  | 'ecom_mall';

const SCENE_OPTIONS: Array<{ value: SceneValue; label: string }> = [
  { value: 'local_growth', label: '生服用增' },
  { value: 'local_marketing', label: '生服营销' },
  { value: 'local_ka', label: '生服KA' },
  { value: 'ecom_growth', label: '电商用增' },
  { value: 'ecom_marketing', label: '电商营销' },
  { value: 'ecom_mall', label: '电商商城' },
];

const DEFAULT_SCENE: SceneValue = 'local_growth';

export interface DocInputBarProps {
  defaultValue?: string;
  goalOptions?: { id: string; label: string }[];
  selectedGoals?: string[];
  onGoalsChange?: (goals: string[]) => void;
  scene?: SceneValue;
  onSceneChange?: (scene: SceneValue) => void;
  onSubmit?: (text: string) => void;
}

export function DocInputBar({
  defaultValue,
  goalOptions,
  selectedGoals,
  onGoalsChange,
  scene,
  onSceneChange,
  onSubmit,
}: DocInputBarProps) {
  const intent = useRecommendStore((s) => s.intent);
  const setIntentText = useRecommendStore((s) => s.setIntentText);
  const lastGeneratedTextRef = useRef('');

  const showGoals = Boolean(goalOptions && onGoalsChange);
  const showScene = Boolean(onSceneChange);
  const hasAdvanced = showGoals || showScene;

  const [advancedOpen, setAdvancedOpen] = useState<boolean>(
    () => Boolean((selectedGoals && selectedGoals.length > 0) || scene),
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (defaultValue == null) return;
    setIntentText(defaultValue);
  }, [defaultValue, setIntentText]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIntentText(e.target.value);
  };

  const text = intent.text;
  const trimmed = text.trim();
  const disabled = trimmed === '';

  const shouldRotate = !isFocused && trimmed === '';

  useEffect(() => {
    if (!shouldRotate) return;
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [shouldRotate]);

  const placeholder = ROTATING_PLACEHOLDERS[placeholderIndex];

  const generatedPrompt = useMemo(() => {
    const sceneLabel = SCENE_OPTIONS.find((option) => option.value === scene)?.label;
    const goalLabel = goalOptions?.find((goal) => (selectedGoals ?? []).includes(goal.id))?.label;
    if (!sceneLabel || !goalLabel) return '';
    return `帮我找能在${sceneLabel}场景提升${goalLabel}的特征、人群或标签`;
  }, [goalOptions, scene, selectedGoals]);

  useEffect(() => {
    if (!generatedPrompt) return;
    const current = intent.text.trim();
    const lastGenerated = lastGeneratedTextRef.current.trim();
    if (current !== '' && current !== lastGenerated) return;
    lastGeneratedTextRef.current = generatedPrompt;
    setIntentText(generatedPrompt);
  }, [generatedPrompt, intent.text, setIntentText]);

  const triggerSubmit = () => {
    if (disabled) return;
    onSubmit?.(trimmed);
  };

  const toggleGoal = (goalId: string) => {
    if (!onGoalsChange) return;
    const current = selectedGoals ?? [];
    if (current.includes(goalId)) {
      onGoalsChange(current.filter((id) => id !== goalId));
    } else {
      onGoalsChange([...current, goalId]);
    }
  };

  const clearAll = () => {
    onGoalsChange?.([]);
    onSceneChange?.(DEFAULT_SCENE);
    lastGeneratedTextRef.current = '';
    setIntentText('');
  };

  const chipBase = 'rounded-full border px-2.5 py-1 text-xs';
  const chipSelected = 'border-indigo-500 bg-indigo-50 text-indigo-700';
  const chipUnselected = 'border-gray-200 text-gray-600 hover:bg-gray-50';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {hasAdvanced ? (
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            高级筛选 {advancedOpen ? '▴' : '▾'}
          </button>
        </div>
      ) : null}

      {advancedOpen && showGoals ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">业务目标：</span>
          {goalOptions!.map((goal) => {
            const active = (selectedGoals ?? []).includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`${chipBase} ${active ? chipSelected : chipUnselected}`}
              >
                {goal.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            清空
          </button>
        </div>
      ) : null}

      {advancedOpen && showScene ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">策略场景：</span>
          {SCENE_OPTIONS.map((option) => {
            const active = scene === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSceneChange!(option.value)}
                className={`${chipBase} ${active ? chipSelected : chipUnselected}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <textarea
          aria-label="需求输入"
          value={text}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={4}
          className="min-h-[96px] min-w-0 flex-1 resize-y rounded-md border border-transparent bg-transparent px-2 py-3 text-base outline-none placeholder:text-gray-400 focus:border-gray-200"
        />
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={triggerSubmit}
            disabled={disabled}
            className="rounded-md bg-black px-4 py-1.5 text-sm text-white disabled:bg-gray-300"
          >
            查询
          </button>
        </div>
      </div>
      {(intent.hasFeishuDoc || intent.truncated) && (
        <div className="flex flex-col gap-1 pl-1 text-xs text-gray-500">
          {intent.hasFeishuDoc ? <span>检测到飞书文档，将读取其内容</span> : null}
          {intent.truncated ? <span>内容过长，将截断（仅前 2000 字会用于生成）</span> : null}
        </div>
      )}
    </div>
  );
}
