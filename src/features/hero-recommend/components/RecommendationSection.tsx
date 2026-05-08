import type { ReactNode } from 'react';
import type { RecommendGroupKey, RecommendationCard as CardType, RecommendationDetailSource } from '../types';
import { RecommendationCard } from './RecommendationCard.tsx';

const SECTION_META: Record<RecommendGroupKey, { title: string; desc: string; badge: string; badgeClass: string }> = {
  ready: {
    title: '以下画像资产高度匹配，可以直接配置使用',
    desc: '匹配程度高、复用成本低，建议优先评估。',
    badge: 'ready（可直接复用）',
    badgeClass: 'bg-blue-600 text-white',
  },
  adaptable: {
    title: '匹配到了与你的需求相似的画像资产',
    desc: '需要结合当前诉求做少量加工或组合后使用。',
    badge: 'adaptable（可加工后使用）',
    badgeClass: 'border border-blue-200 bg-white/80 text-blue-700',
  },
};

interface Props {
  group: RecommendGroupKey;
  cards: CardType[];
  emptyFallback?: ReactNode;
  detailSource?: RecommendationDetailSource;
}

export function RecommendationSection({ group, cards, emptyFallback, detailSource = 'hero' }: Props) {
  const meta = SECTION_META[group];

  if (cards.length === 0 && !emptyFallback) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">{meta.title}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}>{meta.badge}</span>
        </div>
        <div className="mt-3 text-sm text-slate-600">
          {meta.desc}
        </div>
      </div>
      {cards.length > 0 ? (
        <div className={`grid gap-4 ${group === 'ready' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {cards.map((card) => (
            <RecommendationCard key={card.id} card={card} emphasized={group === 'ready'} detailSource={detailSource} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">{emptyFallback}</div>
      )}
    </section>
  );
}
