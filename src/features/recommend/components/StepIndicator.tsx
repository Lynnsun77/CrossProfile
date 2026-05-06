import { useRecommendStore } from '../hooks/useRecommendStore';
import type { RecommendStep } from '../types';

const STEP_ITEMS: Array<{ key: RecommendStep; label: string; short: string }> = [
  { key: 'entry', label: 'Step0 对话输入', short: '输入' },
  { key: 'parsing', label: 'Step1 需求解析', short: '解析' },
  { key: 'recommending', label: 'Step2 推荐生成', short: '推荐' },
  { key: 'result', label: 'Step3 结果收口', short: '结果' },
];

function rank(step: RecommendStep) {
  if (step === 'entry') return 0;
  if (step === 'parsing') return 1;
  if (step === 'recommending') return 2;
  return 3;
}

export function StepIndicator() {
  const step = useRecommendStore((s) => s.step);
  const completedSteps = useRecommendStore((s) => s.completedSteps);
  const jumpToStep = useRecommendStore((s) => s.jumpToStep);

  return (
    <div className="flex flex-wrap gap-2">
      {STEP_ITEMS.map((item) => {
        const isCurrent = item.key === step;
        const isCompleted = completedSteps.includes(item.key);
        const canJump = isCompleted && rank(item.key) <= rank(step);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (!canJump || isCurrent) return;
              jumpToStep(item.key);
            }}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition',
              isCurrent
                ? 'border-module-market bg-module-market text-white'
                : canJump
                  ? 'border-border bg-white text-text-2 hover:border-module-market/30 hover:text-text-1'
                  : 'cursor-not-allowed border-border bg-bg text-text-3',
            ].join(' ')}
            disabled={!canJump}
            aria-current={isCurrent ? 'step' : undefined}
            title={canJump ? `回到${item.label}` : `${item.label} 未完成`}
          >
            <span className="text-xs">{item.short}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
