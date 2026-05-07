import { useState } from 'react';
import type { MatchLabel, RecommendationCard as CardType } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { ReasonPopover } from './ReasonPopover';

const BADGE_STYLES: Record<MatchLabel, string> = {
  高匹配: 'border border-red-100 bg-red-50 text-red-600',
  中匹配: 'border border-blue-100 bg-blue-50 text-blue-600',
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
    <div className={`relative rounded-2xl border bg-white p-5 transition-shadow ${emphasized ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[card.matchLabel]}`}>
          {card.matchLabel} {card.matchScore}%
        </span>
        <span className="text-xs text-slate-400">{card.objectType}</span>
      </div>

      <h4 className="text-lg font-semibold leading-snug text-slate-900">{card.name}</h4>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{card.oneLineReason}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.hitTags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        {card.metrics.map((metric) => (
          <div key={metric.label} className="flex items-baseline gap-1">
            <span className="text-slate-400">{metric.label}</span>
            <span className="font-medium text-slate-800">{metric.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => setReasonOpen(true)} className="text-sm text-blue-600 hover:underline">
          为什么推荐
        </button>
        <button
          type="button"
          onClick={() => (added ? removeCandidate(card.id) : addCandidate(card.id))}
          className={`ml-auto rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            added ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
          }`}
        >
          {added ? '已加入' : '加入候选'}
        </button>
        <button type="button" onClick={() => openDetail(card.id)} className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50">
          查看详情
        </button>
      </div>

      {reasonOpen ? <ReasonPopover card={card} onClose={() => setReasonOpen(false)} /> : null}
    </div>
  );
}
