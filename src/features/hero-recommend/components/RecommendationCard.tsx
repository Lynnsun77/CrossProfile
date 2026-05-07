import { useState } from 'react';
import type { MatchLabel, RecommendationCard as CardType } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { ReasonPopover } from './ReasonPopover';

const BADGE_STYLES: Record<MatchLabel, string> = {
  高匹配: 'bg-red-50 text-red-600 border border-red-100',
  中匹配: 'bg-blue-50 text-blue-600 border border-blue-100',
  相似度: 'bg-slate-100 text-slate-600 border border-slate-200',
};

interface Props {
  card: CardType;
  emphasized?: boolean;
}

export function RecommendationCard({ card, emphasized }: Props) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const candidateIds = useHeroRecommendStore((s) => s.candidateIds);
  const addCandidate = useHeroRecommendStore((s) => s.addCandidate);
  const removeCandidate = useHeroRecommendStore((s) => s.removeCandidate);
  const openDetail = useHeroRecommendStore((s) => s.openDetail);

  const added = candidateIds.includes(card.id);

  return (
    <div
      className={`relative rounded-2xl border bg-white p-5 transition-shadow ${
        emphasized ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[card.matchLabel]}`}
        >
          {card.matchLabel} {card.matchScore}%
        </span>
        <span className="text-xs text-slate-400">{card.objectType}</span>
      </div>

      <h4 className="text-lg font-semibold text-slate-900 leading-snug">{card.name}</h4>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{card.oneLineReason}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.hitTags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600 border border-slate-100"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {card.metrics.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1">
            <span className="text-slate-400">{m.label}</span>
            <span className="text-slate-800 font-medium">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setReasonOpen(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          为什么推荐
        </button>
        <button
          type="button"
          onClick={() => (added ? removeCandidate(card.id) : addCandidate(card.id))}
          className={`ml-auto rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            added
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
          }`}
        >
          {added ? '已加入' : '加入候选'}
        </button>
        <button
          type="button"
          onClick={() => openDetail(card.id)}
          className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
        >
          查看详情
        </button>
      </div>

      {reasonOpen ? (
        <ReasonPopover card={card} onClose={() => setReasonOpen(false)} />
      ) : null}
    </div>
  );
}
