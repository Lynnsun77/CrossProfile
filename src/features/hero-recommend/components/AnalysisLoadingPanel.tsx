import { Check, Loader2 } from 'lucide-react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

const STEPS = [
  '正在理解你的业务目标…',
  '正在匹配适用场景…',
  '正在召回可复用资产…',
  '正在生成推荐结果…',
];

export function AnalysisLoadingPanel() {
  const analysisStep = useHeroRecommendStore((s) => s.analysisStep);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">AI 正在分析中</h3>
      </div>
      <ul className="space-y-3">
        {STEPS.map((text, idx) => {
          const stepIndex = idx + 1;
          const completed = analysisStep >= stepIndex;
          const current = analysisStep + 1 === stepIndex;
          return (
            <li key={text} className="flex items-center gap-2 text-sm">
              {completed ? (
                <Check className="h-4 w-4 text-blue-600" />
              ) : current ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-slate-300 inline-block" />
              )}
              <span
                className={
                  completed
                    ? 'text-slate-700'
                    : current
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }
              >
                {text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
