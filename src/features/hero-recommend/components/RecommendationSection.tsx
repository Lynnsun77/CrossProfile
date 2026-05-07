import type { ReactNode } from 'react';
import type { RecommendGroupKey, RecommendationCard as CardType } from '../types';
import { RecommendationCard } from './RecommendationCard';

const SECTION_META: Record<
  RecommendGroupKey,
  { title: string; desc: string; color: string; badge?: string }
> = {
  priority: {
    title: '优先推荐',
    desc: '高匹配 · 建议优先评估与落地',
    color: 'text-blue-600',
    badge: '优先推荐',
  },
  expandable: {
    title: '可扩展方案',
    desc: '部分命中你的目标或场景，可作为扩展',
    color: 'text-indigo-600',
  },
  similar: {
    title: '相似资产备选',
    desc: '供参考的相似资产，可作为对照',
    color: 'text-slate-600',
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
      <div className="mb-3 flex items-center gap-2">
        <h3 className={`text-base font-semibold ${meta.color}`}>{meta.title}</h3>
        {meta.badge ? (
          <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
            {meta.badge}
          </span>
        ) : null}
        <span className="text-xs text-slate-400">{meta.desc}</span>
      </div>
      {cards.length > 0 ? (
        <div
          className={`grid gap-4 ${
            group === 'priority'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {cards.map((c) => (
            <RecommendationCard key={c.id} card={c} emphasized={group === 'priority'} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
          {emptyFallback}
        </div>
      )}
    </section>
  );
}
