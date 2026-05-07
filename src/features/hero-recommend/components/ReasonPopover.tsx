import { useMemo } from 'react';
import type { RecommendationCard as CardType } from '../types';
import { buildReasonText } from '../scripts/buildReasonText';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

interface Props {
  card: CardType;
  onClose: () => void;
}

export function ReasonPopover({ card, onClose }: Props) {
  const parsed = useHeroRecommendStore((s) => s.intentParsed);
  const reasons = useMemo(() => {
    if (parsed) return buildReasonText(parsed, card);
    // 无 parsed（默认态）时直接走 card.reasons 兜底
    return card.reasons.slice(0, 3);
  }, [parsed, card]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30"
      onClick={onClose}
    >
      <div
        className="w-[360px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">为什么推荐</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            关闭
          </button>
        </div>
        <ul className="space-y-2">
          {reasons.map((r, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
