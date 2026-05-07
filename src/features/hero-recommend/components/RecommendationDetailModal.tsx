import { useMemo } from 'react';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

export function RecommendationDetailModal() {
  const detailCardId = useHeroRecommendStore((s) => s.detailCardId);
  const grouped = useHeroRecommendStore((s) => s.grouped);
  const closeDetail = useHeroRecommendStore((s) => s.closeDetail);

  const card = useMemo(() => {
    if (!detailCardId || !grouped) return null;
    return (
      grouped.priority.find((c) => c.id === detailCardId) ||
      grouped.expandable.find((c) => c.id === detailCardId) ||
      grouped.similar.find((c) => c.id === detailCardId) ||
      null
    );
  }, [detailCardId, grouped]);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40"
      onClick={closeDetail}
    >
      <div
        className="w-[520px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{card.name}</h3>
          <button
            type="button"
            onClick={closeDetail}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            关闭
          </button>
        </div>
        <div className="mb-3 text-xs text-slate-500">{card.objectType} · 匹配度 {card.matchScore}%</div>
        <p className="mb-4 text-sm text-slate-700 leading-relaxed">{card.oneLineReason}</p>

        <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
          {card.metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-xs text-slate-400">{m.label}</div>
              <div className="text-slate-800 font-medium">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-xs text-slate-400">推荐依据</div>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {card.reasons.map((r, idx) => (
            <li key={idx}>• {r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
