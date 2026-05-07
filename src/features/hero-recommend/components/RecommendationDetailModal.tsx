import { useMemo } from 'react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

export function RecommendationDetailModal() {
  const detailCardId = useHeroRecommendStore((s) => s.detailCardId);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const closeDetail = useHeroRecommendStore((s) => s.closeDetail);

  const card = useMemo(() => {
    if (!detailCardId || !grouped) return null;
    return grouped.ready.find((item) => item.id === detailCardId) || grouped.adaptable.find((item) => item.id === detailCardId) || null;
  }, [detailCardId, grouped]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={closeDetail}>
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{card.name}</h3>
          <button type="button" onClick={closeDetail} className="text-sm text-slate-400 hover:text-slate-600">
            关闭
          </button>
        </div>
        <div className="mb-3 text-xs text-slate-500">
          {card.objectType} · 匹配度 {card.matchScore}%
        </div>
        <p className="mb-4 text-sm leading-relaxed text-slate-700">{card.oneLineReason}</p>

        <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
          {card.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-xs text-slate-400">{metric.label}</div>
              <div className="font-medium text-slate-800">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-xs text-slate-400">推荐依据</div>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {card.reasons.map((reason, index) => (
            <li key={index}>• {reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
