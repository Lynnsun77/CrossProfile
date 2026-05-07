import type { MatchLabel, RecommendationCard as CardType, RecommendationDetailSource } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

const BADGE_STYLES: Record<MatchLabel, string> = {
  高匹配: 'border border-red-100 bg-red-50 text-red-600',
  中匹配: 'border border-blue-100 bg-blue-50 text-blue-600',
};

interface Props {
  card: CardType;
  emphasized?: boolean;
  showDecisionTone?: boolean;
  detailSource?: RecommendationDetailSource;
  hideMatchBadge?: boolean;
}

export function RecommendationCard({
  card,
  emphasized,
  showDecisionTone = true,
  detailSource = 'hero',
  hideMatchBadge = false,
}: Props) {
  const candidateIds = useHeroRecommendStore((s) => s.candidateIds);
  const submittedDeployCardIds = useHeroRecommendStore((s) => s.submittedDeployCardIds);
  const addCandidate = useHeroRecommendStore((s) => s.addCandidate);
  const removeCandidate = useHeroRecommendStore((s) => s.removeCandidate);
  const openDetail = useHeroRecommendStore((s) => s.openDetail);
  const openDeploy = useHeroRecommendStore((s) => s.openDeploy);

  const added = candidateIds.includes(card.id);
  const canQuickDeploy = card.group === 'ready';
  const submitted = submittedDeployCardIds.includes(card.id);
  const toneClass =
    card.group === 'ready'
      ? 'border-emerald-200 bg-emerald-50/40'
      : 'border-indigo-200 bg-indigo-50/40';
  const levelLabel = card.group === 'ready' ? '可直接复用' : '可加工后使用';
  const conclusion = card.oneLineReason;
  const guidance =
    detailSource === 'platform'
      ? ''
      : card.group === 'ready'
        ? '建议优先评估并直接配置落地。'
        : '建议结合当前诉求补充加工方向后使用。';
  const reasonActionLabel = detailSource === 'platform' ? '为什么值得看' : '为什么推荐';
  const compactPlatformHeader = detailSource === 'platform' && hideMatchBadge && !showDecisionTone;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => openDetail(card.id, 'top', detailSource)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail(card.id, 'top', detailSource);
        }
      }}
      className={`relative rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        emphasized ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm'
      }`}
    >
      {compactPlatformHeader ? (
        <div className="mb-2 flex items-start justify-between gap-3">
          <h4 className="text-lg font-semibold leading-snug text-slate-900">{card.name}</h4>
          <span className="shrink-0 pt-1 text-xs text-slate-400">{card.objectType}</span>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {!hideMatchBadge ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[card.matchLabel]}`}>
                  {card.matchLabel} {card.matchScore}%
                </span>
              ) : null}
              {showDecisionTone ? (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>
                  {levelLabel}
                </span>
              ) : null}
            </div>
            <span className="text-xs text-slate-400">{card.objectType}</span>
          </div>

          <h4 className="text-lg font-semibold leading-snug text-slate-900">{card.name}</h4>
        </>
      )}
      <p className="mt-1 text-sm font-medium text-slate-800">{conclusion}</p>
      {guidance ? <p className="mt-1 text-xs text-slate-500">{guidance}</p> : null}

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
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openDetail(card.id, 'reason', detailSource);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {reasonActionLabel}
        </button>
        {canQuickDeploy ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!submitted) openDeploy(card.id);
            }}
            disabled={submitted}
            className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitted ? '已提交配置' : '一键配置'}
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              added ? removeCandidate(card.id) : addCandidate(card.id);
            }}
            className={`ml-auto rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              added ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
            }`}
          >
            {added ? '已加入' : '加入候选'}
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openDetail(card.id, 'top', detailSource);
          }}
          className="rounded-lg border border-blue-500 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50"
        >
          查看详情
        </button>
      </div>
    </article>
  );
}
