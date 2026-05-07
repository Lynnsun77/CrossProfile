import type { ReactNode } from 'react';
import type { RecommendGroupKey, RecommendationCard as CardType } from '../types';
import { RecommendationCard } from './RecommendationCard';

const SECTION_META: Record<RecommendGroupKey, { title: string; desc: string; badge: string; accentClass: string }> = {
  ready: {
    title: '以下画像资产高度匹配，可以直接配置使用',
    desc: '匹配程度高、复用成本低，建议优先评估。',
    badge: 'ready（可直接复用）',
    accentClass: 'text-blue-700',
  },
  adaptable: {
    title: '匹配到了与你的需求相似的画像资产',
    desc: '需要结合当前诉求做少量加工或组合后使用。',
    badge: 'adaptable（可加工后使用）',
    accentClass: 'text-indigo-700',
  },
};

interface Props {
  group: RecommendGroupKey;
  cards: CardType[];
  emptyFallback?: ReactNode;
}

export function RecommendationSection({ group, cards, emptyFallback }: Props) {
  const meta = SECTION_META[group];

  if (cards.length === 0 && !emptyFallback) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className={`text-base font-semibold ${meta.accentClass}`}>{meta.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${group === 'ready' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {meta.badge}
        </span>
        <span className="text-xs text-slate-400">{meta.desc}</span>
      </div>
      {cards.length > 0 ? (
        <div className={`grid gap-4 ${group === 'ready' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {cards.map((card) => (
            <RecommendationCard key={card.id} card={card} emphasized={group === 'ready'} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">{emptyFallback}</div>
      )}
    </section>
  );
}
