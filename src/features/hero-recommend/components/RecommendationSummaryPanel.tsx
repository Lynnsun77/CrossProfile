import { Sparkles } from 'lucide-react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

export function RecommendationSummaryPanel() {
  const summaryText = useHeroRecommendStore((s) => s.summaryText);
  if (!summaryText) return null;
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex items-start gap-2">
      <Sparkles className="mt-0.5 h-4 w-4 text-indigo-500 flex-none" />
      <p className="text-sm text-slate-700 leading-relaxed">{summaryText}</p>
    </div>
  );
}
