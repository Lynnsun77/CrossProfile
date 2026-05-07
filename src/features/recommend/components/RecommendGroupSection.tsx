import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecommendStore } from '../store/useRecommendStore';
import type { AssetDrawerSource, RecommendCard, RecommendGroup, RecommendSection, RecommendSlot, RecommendSectionCta } from '../types';
import { UnmetDemandDialog } from './UnmetDemandDialog';

type SortKey = 'relevance' | 'revenue' | 'audienceSize';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: '按相关度' },
  { key: 'revenue', label: '按收益' },
  { key: 'audienceSize', label: '按人群规模' },
];

const HEALTH_COLOR: Record<NonNullable<RecommendCard['healthStatus']>, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  offline: 'bg-gray-400',
};

const HEALTH_LABEL: Record<NonNullable<RecommendCard['healthStatus']>, string> = {
  healthy: '健康',
  warning: '预警',
  offline: '已下线',
};

const TYPE_TAG_CLASS =
  'rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200';
const SCENE_TAG_CLASS =
  'rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200';

const FADE_SLIDE_STYLE = `@keyframes fadeSlide { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }`;

export interface RecommendGroupSectionProps {
  onGoReport?: () => void;
  drawerSource?: AssetDrawerSource;
}

type ParagraphKind = 'ready' | 'adaptable' | 'fallback';

function paragraphBadge(kind: ParagraphKind): { emoji: string; label: string } {
  if (kind === 'ready') return { emoji: '✨', label: 'ready（可直接复用）' };
  if (kind === 'adaptable') return { emoji: '🧩', label: 'adaptable（可加工后使用）' };
  return { emoji: '📮', label: 'fallback' };
}

function sectionBannerClass(kind: ParagraphKind): string {
  if (kind === 'ready') return 'bg-emerald-50 ring-1 ring-emerald-100';
  if (kind === 'adaptable') return 'bg-amber-50 ring-1 ring-amber-100';
  return 'bg-gray-50';
}

function badgeClass(kind: ParagraphKind): string {
  if (kind === 'ready') return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  if (kind === 'adaptable') return 'bg-amber-100 text-amber-900 ring-amber-200';
  return 'bg-gray-100 text-gray-700 ring-gray-200';
}

function groupIntroSentence(kind: ParagraphKind): string {
  if (kind === 'ready') return '属于可直接复用：以下资产可直接配置使用。';
  if (kind === 'adaptable') return '属于可加工后使用：以下资产与你的场景相似，建议结合业务上下文二次加工。';
  return '';
}

function getConfidence(card: RecommendCard): number {
  return typeof card.confidence === 'number' ? card.confidence : 0;
}

function normalizeHealthStatus(card: RecommendCard): NonNullable<RecommendCard['healthStatus']> {
  return (card.healthStatus ?? 'healthy') as NonNullable<RecommendCard['healthStatus']>;
}

function isHealthyOrWarning(card: RecommendCard): boolean {
  const hs = normalizeHealthStatus(card);
  return hs === 'healthy' || hs === 'warning';
}

function isHealthy(card: RecommendCard): boolean {
  return normalizeHealthStatus(card) === 'healthy';
}

function uniqueCardsFromGroups(groups: RecommendGroup[]): RecommendCard[] {
  const map = new Map<string, RecommendCard>();
  groups.forEach((g) => {
    if (g.kind === 'fallback') return;
    (g.cards ?? []).forEach((c) => {
      if (!c?.id) return;
      if (!map.has(c.id)) map.set(c.id, c);
    });
  });
  return Array.from(map.values());
}

function deriveSectionsFromGroupsCompat(groups: RecommendGroup[]): RecommendSection[] {
  const aiGroup = groups.find((g) => g.kind === 'ai') ?? null;
  const cohortGroups = groups.filter((g) => g.kind === 'cohort');

  const uniqueCards = uniqueCardsFromGroups(groups);
  const totalUnique = uniqueCards.length;

  const baseFallback: RecommendSection = {
    section_id: 'paragraph_3',
    emoji: '🧭',
    title: '都不符合你的诉求？',
    subtitle: '可能是资产尚未入驻平台，或诉求过于定制',
    bg_style: 'muted',
    slots: [
      {
        kind: 'fallback_cta',
        cta: {
          primary: { text: '去提需更多画像标签建设', action: 'go_report' },
          secondary: { text: '联系资产 Owner', action: 'contact_owner' },
        },
        adapt: { type: 'fallback', sourceKind: 'compat', sourceId: 'fallback' },
      },
    ],
  };

  // Mirror store behavior: if only 1 result, treat as ready.
  if (totalUnique === 1) {
    const only = uniqueCards[0];
    return [
      {
        section_id: 'paragraph_1',
        emoji: '🤖',
        title: 'AI 推荐',
        subtitle: '基于你的诉求生成的可执行建议',
        bg_style: 'plain',
        slots: [
          {
            kind: 'card_list',
            cards: [only],
            adapt: { type: 'recommend_cards', sourceKind: 'singleton', sourceId: only.id },
          },
        ],
      },
      baseFallback,
    ];
  }

  const usedCardIds = new Set<string>();
  const isReadyCandidate = (c: RecommendCard) => getConfidence(c) >= 0.8 && isHealthy(c);
  const isAdaptableCandidate = (c: RecommendCard) => getConfidence(c) >= 0.6 && getConfidence(c) < 0.8 && isHealthyOrWarning(c);

  const readyAi = (aiGroup?.cards ?? [])
    .filter(isReadyCandidate)
    .slice(0, 2);
  readyAi.forEach((c) => usedCardIds.add(c.id));

  const eligibleCohorts = cohortGroups.filter((g) => {
    const cards = g.cards ?? [];
    if (cards.length === 0) return false;
    return cards.every(isReadyCandidate);
  });

  const readyCohortGroup = eligibleCohorts.length > 0 ? eligibleCohorts[0] : null;
  const readyPoolForMock = uniqueCards
    .filter(isReadyCandidate)
    .sort((a, b) => getConfidence(b) - getConfidence(a));
  const readyMockComboGroup: RecommendGroup | null =
    !readyCohortGroup && readyPoolForMock.length >= 2
      ? {
          id: 'cohort-ready-mock',
          kind: 'cohort',
          title: '组合（可直接复用）',
          comboTitle: `${readyPoolForMock[0].title} × ${readyPoolForMock[1].title}`,
          combinedLift: 0.18,
          cards: readyPoolForMock.slice(0, 2),
        }
      : null;
  const readyComboGroup = readyCohortGroup ?? readyMockComboGroup;
  if (readyComboGroup) {
    (readyComboGroup.cards ?? []).forEach((c) => usedCardIds.add(c.id));
  }

  const hasReady = readyAi.length > 0 || Boolean(readyComboGroup);
  const readySection: RecommendSection | null = hasReady
    ? {
        section_id: 'paragraph_1',
        emoji: '🤖',
        title: 'AI 推荐',
        subtitle: '基于你的诉求生成的可执行建议',
        bg_style: 'plain',
        slots: [
          ...(readyAi.length > 0
            ? [
                {
                  kind: 'card_list' as const,
                  cards: readyAi,
                  adapt: { type: 'recommend_cards' as const, sourceKind: 'ready_ai', sourceId: 'ai' },
                },
              ]
            : []),
          ...(readyComboGroup
            ? [
                {
                  kind: 'combo_group' as const,
                  groups: [readyComboGroup],
                  adapt: {
                    type: 'recommend_group' as const,
                    sourceKind: readyCohortGroup ? 'ready_cohort' : 'ready_mock',
                    sourceId: readyComboGroup.id,
                  },
                },
              ]
            : []),
        ],
      }
    : null;

  const remaining = uniqueCards.filter((c) => !usedCardIds.has(c.id));
  const adaptablePool = remaining
    .filter(isAdaptableCandidate)
    .sort((a, b) => getConfidence(b) - getConfidence(a));

  const adaptableSingles = adaptablePool.slice(0, 2);
  const adaptableSingleIds = new Set(adaptableSingles.map((c) => c.id));

  const cohortCandidates = cohortGroups.filter((g) => g.id !== readyComboGroup?.id);
  const isAdaptableCohort = (g: RecommendGroup) => {
    const cards = g.cards ?? [];
    if (cards.length < 2) return false;
    return cards.every(isAdaptableCandidate);
  };
  const adaptableCohort =
    cohortCandidates.find((g) => isAdaptableCohort(g) && (g.cards ?? []).some((c) => !usedCardIds.has(c.id))) ??
    cohortCandidates.find(isAdaptableCohort) ??
    null;

  const comboPoolPrimary = adaptablePool.filter((c) => !adaptableSingleIds.has(c.id));
  const comboPick = (comboPoolPrimary.length >= 2 ? comboPoolPrimary : adaptablePool).slice(0, 2);
  const mockComboGroup: RecommendGroup | null =
    !adaptableCohort && comboPick.length >= 2
      ? {
          id: 'cohort-adaptable-mock',
          kind: 'cohort',
          title: '相似组合（可调整）',
          comboTitle: `${comboPick[0].title} × ${comboPick[1].title}`,
          combinedLift: 0.12,
          cards: comboPick,
        }
      : null;

  const adaptableComboGroup = adaptableCohort ?? mockComboGroup;
  const hasAdaptable = adaptableSingles.length > 0 || Boolean(adaptableComboGroup);
  const adaptableSection: RecommendSection | null = hasAdaptable
    ? {
        section_id: 'paragraph_2',
        emoji: '📌',
        title: '匹配到了与你的需求相似的画像资产',
        subtitle: '从相似场景中挑选的候选资产，可结合目标做调整',
        bg_style: 'accent',
        slots: [
          ...(adaptableSingles.length > 0
            ? [
                {
                  kind: 'card_list' as const,
                  cards: adaptableSingles,
                  adapt: { type: 'recommend_cards' as const, sourceKind: 'similarity_pool', sourceId: adaptableSingles[0]?.id },
                },
              ]
            : []),
          ...(adaptableComboGroup
            ? [
                {
                  kind: 'combo_group' as const,
                  groups: [adaptableComboGroup],
                  adapt: {
                    type: 'recommend_group' as const,
                    sourceKind: adaptableCohort ? 'cohort_reuse' : 'mock',
                    sourceId: adaptableComboGroup.id,
                  },
                },
              ]
            : []),
        ],
      }
    : null;

  const sections: RecommendSection[] = [];
  if (readySection) sections.push(readySection);
  if (adaptableSection) sections.push(adaptableSection);
  sections.push(baseFallback);
  return sections;
}

function pickSlots(section: RecommendSection, kind: RecommendSlot['kind']): RecommendSlot[] {
  return (section.slots ?? []).filter((slot) => slot.kind === kind);
}

function resolveFallbackCta(section: RecommendSection | null): RecommendSectionCta | null {
  if (!section) return null;
  const slot = (section.slots ?? []).find((s) => s.kind === 'fallback_cta') as Extract<RecommendSlot, { kind: 'fallback_cta' }> | undefined;
  return slot?.cta ?? section.cta ?? null;
}

export function RecommendGroupSection({
  onGoReport,
  drawerSource = 'intelligent_recommend',
}: RecommendGroupSectionProps) {
  const groups = useRecommendStore((s) => s.groups);
  const storeSections = useRecommendStore((s) => s.sections);
  const openDrawer = useRecommendStore((s) => s.openDrawer);
  const intentText = useRecommendStore((s) => s.intent.text);

  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [animKey, setAnimKey] = useState(0);
  const [unmetOpen, setUnmetOpen] = useState(false);
  const hasMountedRef = useRef(false);

  const sections = useMemo(() => {
    const hasReadyOrAdaptable = storeSections.some((s) => s.section_id === 'paragraph_1' || s.section_id === 'paragraph_2');
    const hasAiOrCohort = groups.some((g) => g.kind === 'ai' || g.kind === 'cohort');
    // Prefer store `sections`, but keep backward compatibility when callers only mutate `groups`.
    if (!hasReadyOrAdaptable && hasAiOrCohort) {
      return deriveSectionsFromGroupsCompat(groups);
    }
    return storeSections;
  }, [groups, storeSections]);

  const readySection = useMemo(() => sections.find((s) => s.section_id === 'paragraph_1') ?? null, [sections]);
  const adaptableSection = useMemo(() => sections.find((s) => s.section_id === 'paragraph_2') ?? null, [sections]);
  const fallbackSection = useMemo(() => sections.find((s) => s.section_id === 'paragraph_3') ?? null, [sections]);

  const readyCardSlots = useMemo(
    () => (readySection ? (pickSlots(readySection, 'card_list') as Array<Extract<RecommendSlot, { kind: 'card_list' }>>) : []),
    [readySection],
  );
  const readyCardsRaw = useMemo(() => readyCardSlots.flatMap((s) => s.cards ?? []), [readyCardSlots]);

  const sortedReadyCards = useMemo(() => {
    const cards = [...readyCardsRaw];
    cards.sort((a, b) => {
      const av = a.sortKeys?.[sortKey] ?? 0;
      const bv = b.sortKeys?.[sortKey] ?? 0;
      return bv - av;
    });
    return cards;
  }, [readyCardsRaw, sortKey]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setAnimKey((k) => k + 1);
  }, [sortKey]);

  const handleAction = (action: { action: 'go_report' | 'contact_owner' | 'open_url'; href?: string } | null) => {
    if (!action) return;
    if (action.action === 'open_url') {
      if (typeof window !== 'undefined' && action.href) window.open(action.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action.action === 'go_report') {
      if (onGoReport) {
        onGoReport();
        return;
      }
      setUnmetOpen(true);
      return;
    }
    if (action.action === 'contact_owner') {
      if (typeof window !== 'undefined') {
        const subject = encodeURIComponent('资产 Owner 咨询：' + (intentText ?? ''));
        window.open(`mailto:asset-owner@example.com?subject=${subject}`, '_blank');
      }
    }
  };

  const fallbackCta = useMemo(() => resolveFallbackCta(fallbackSection), [fallbackSection]);

  return (
    <div className="space-y-5">
      <style>{FADE_SLIDE_STYLE}</style>
      {readySection && (
        <ParagraphSection
          kind="ready"
          title={readySection.title}
          subtitle={readySection.subtitle}
          rightAddon={
            readyCardsRaw.length > 0 ? (
              <div className="flex gap-1 rounded-md bg-gray-100 p-0.5 text-xs">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortKey(opt.key)}
                    aria-pressed={sortKey === opt.key}
                    className={`rounded px-3 py-1 transition ${
                      sortKey === opt.key ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          {readyCardsRaw.length > 0 && (
            <CardListGroup
              title="推荐组 1 · AI 推荐"
              intro={groupIntroSentence('ready')}
              totalCount={readyCardsRaw.length}
            >
              {sortedReadyCards.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                  暂无 AI 推荐卡片
                </div>
              ) : (
                <div
                  key={animKey}
                  className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
                  style={{ animation: 'fadeSlide 300ms ease-out' }}
                >
                  {sortedReadyCards.slice(0, 2).map((card) => (
                    <RecommendCardTile key={card.id} card={card} showAIBadge onOpen={() => openDrawer(card.id, drawerSource)} />
                  ))}
                </div>
              )}
            </CardListGroup>
          )}

          {readySection.slots
            .filter((s) => s.kind === 'combo_group')
            .flatMap((s) => (s as Extract<RecommendSlot, { kind: 'combo_group' }>).groups ?? [])
            .slice(0, 1)
            .map((group) => (
              <ComboGroupBlock
                key={group.id}
                paragraphKind="ready"
                title="组合"
                intro={groupIntroSentence('ready')}
                group={group}
                onOpen={(cardId) => openDrawer(cardId, drawerSource)}
              />
            ))}
        </ParagraphSection>
      )}

      {adaptableSection && (
        <ParagraphSection kind="adaptable" title={adaptableSection.title} subtitle={adaptableSection.subtitle}>
          {adaptableSection.slots.map((slot, index) => (
            <AdaptableSlotRenderer
              key={`${slot.kind}-${index}`}
              slot={slot}
              onOpenCard={(id) => openDrawer(id, drawerSource)}
            />
          ))}
        </ParagraphSection>
      )}

      {(fallbackSection || true) && (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-sm font-semibold text-gray-700">{fallbackSection?.title ?? '都不符合你的诉求？'}</div>
            <div className="text-xs text-gray-500">{fallbackSection?.subtitle ?? '去提需更多画像标签建设'}</div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleAction(fallbackCta?.primary ?? null)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
              >
                {fallbackCta?.primary?.text ?? '去提需更多画像标签建设'}
              </button>
              <button
                type="button"
                onClick={() => handleAction(fallbackCta?.secondary ?? { action: 'contact_owner', href: undefined })}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {fallbackCta?.secondary?.text ?? '联系资产 Owner'}
              </button>
            </div>
          </div>
        </section>
      )}
      <UnmetDemandDialog open={unmetOpen} onClose={() => setUnmetOpen(false)} />
    </div>
  );
}

function ParagraphSection({
  kind,
  title,
  subtitle,
  rightAddon,
  children,
}: {
  kind: ParagraphKind;
  title: string;
  subtitle?: string;
  rightAddon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const badge = paragraphBadge(kind);
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <div className={`flex flex-col gap-2 rounded-xl px-4 py-3 md:flex-row md:items-center md:justify-between ${sectionBannerClass(kind)}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-sm" aria-hidden>
            {badge.emoji}
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-gray-800">{title}</div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass(kind)}`}>
                {badge.label}
              </span>
            </div>
            {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
          </div>
        </div>
        {rightAddon}
      </div>
      {children}
    </section>
  );
}

function CardListGroup({
  title,
  intro,
  totalCount,
  children,
}: {
  title: string;
  intro: string;
  totalCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-500">{intro}</div>
        </div>
        {typeof totalCount === 'number' && (
          <div className="text-xs text-gray-500">
            共 <span className="font-medium text-gray-800">{totalCount}</span> 条
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ComboGroupBlock({
  paragraphKind,
  title,
  intro,
  group,
  onOpen,
}: {
  paragraphKind: ParagraphKind;
  title: string;
  intro: string;
  group: RecommendGroup;
  onOpen: (cardId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        <div className="text-xs text-gray-500">{intro}</div>
      </div>
      <CohortGroupSection paragraphKind={paragraphKind} group={group} onOpen={onOpen} />
    </div>
  );
}

function CohortGroupSection({
  group,
  onOpen,
  paragraphKind,
  showAdaptMeta,
  adaptMeta,
}: {
  group: RecommendGroup;
  onOpen: (cardId: string) => void;
  paragraphKind: ParagraphKind;
  showAdaptMeta?: boolean;
  adaptMeta?: unknown;
}) {
  const comboTitle = group.comboTitle ?? group.title;
  const combinedLift = Math.round((group.combinedLift ?? 0.18) * 100);
  const visibleCards = group.cards.slice(0, 3);

  const handleSubscribeTogether = () => {
    // placeholder: no navigation
  };

  const handleOpenSingle = () => {
    const firstCard = visibleCards[0];
    if (!firstCard) return;
    onOpen(firstCard.id);
  };

  const intro = groupIntroSentence(paragraphKind);
  const adapt = (adaptMeta ?? {}) as Record<string, unknown>;
  const adaptType =
    (typeof adapt['adapt_type'] === 'string' ? (adapt['adapt_type'] as string) : undefined) ??
    (typeof (adapt as any).type === 'string' ? ((adapt as any).type as string) : undefined) ??
    'recommend_group';
  const adaptEffort = (typeof adapt['adapt_effort'] === 'string' ? (adapt['adapt_effort'] as string) : undefined) ?? '中';
  const adaptRisk = (typeof adapt['adapt_risk'] === 'string' ? (adapt['adapt_risk'] as string) : undefined) ?? '中';

  return (
    <section className="space-y-3 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
        <span aria-hidden>📌</span>
        <span>{comboTitle}</span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
          预计组合增益 GMV +{combinedLift}%
        </span>
      </div>
        <div className="text-xs text-gray-600">{intro}</div>
        {showAdaptMeta && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
            <span className="rounded bg-white/70 px-2 py-0.5 ring-1 ring-black/5">adapt_type: {adaptType}</span>
            <span className="rounded bg-white/70 px-2 py-0.5 ring-1 ring-black/5">adapt_effort: {adaptEffort}</span>
            <span className="rounded bg-white/70 px-2 py-0.5 ring-1 ring-black/5">adapt_risk: {adaptRisk}</span>
          </div>
        )}
      </div>
      {visibleCards.length === 0 ? (
        <div className="text-xs text-gray-400">暂无关联卡片</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => (
            <RecommendCardTile key={card.id} card={card} onOpen={() => onOpen(card.id)} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSubscribeTogether}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          去加工
        </button>
        <button
          type="button"
          onClick={handleOpenSingle}
          className="text-xs text-indigo-600 hover:text-indigo-700"
        >
          单独看
        </button>
      </div>
    </section>
  );
}

function AdaptableSlotRenderer({
  slot,
  onOpenCard,
}: {
  slot: RecommendSlot;
  onOpenCard: (id: string) => void;
}) {
  const paragraphKind: ParagraphKind = 'adaptable';
  const intro = groupIntroSentence(paragraphKind);

  if (slot.kind === 'card_list') {
    const cards = (slot.cards ?? []).slice(0, 2);
    if (cards.length === 0) return null;
    const adaptMeta = (slot.adapt ?? {}) as unknown as Record<string, unknown>;
    const adaptType = (adaptMeta.type as string | undefined) ?? 'recommend_cards';
    const adaptEffort = (adaptMeta as any).adapt_effort ?? '中';
    const adaptRisk = (adaptMeta as any).adapt_risk ?? '中';

    return (
      <div className="space-y-2">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-gray-800">推荐组 3 · 相似资产</div>
          <div className="text-xs text-gray-500">{intro}</div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
            <span className="rounded bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">adapt_type: {adaptType}</span>
            <span className="rounded bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">adapt_effort: {adaptEffort}</span>
            <span className="rounded bg-gray-50 px-2 py-0.5 ring-1 ring-gray-200">adapt_risk: {adaptRisk}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cards.map((card) => (
            <RecommendCardTile key={card.id} card={card} onOpen={() => onOpenCard(card.id)} />
          ))}
        </div>
      </div>
    );
  }

  if (slot.kind === 'combo_group') {
    const group = slot.groups?.[0];
    if (!group) return null;
    return (
      <div className="space-y-2">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-gray-800">相似组合</div>
          <div className="text-xs text-gray-500">{intro}</div>
        </div>
        <CohortGroupSection
          paragraphKind={paragraphKind}
          group={group}
          onOpen={(id) => {
            if (!id) return;
            onOpenCard(id);
          }}
          showAdaptMeta
          // Allow mock fields; keep it flexible without changing global types.
          adaptMeta={{
            ...(slot.adapt ?? {}),
            adapt_type: (slot.adapt as any)?.type ?? 'recommend_group',
            adapt_effort: (slot.adapt as any)?.adapt_effort ?? '中',
            adapt_risk: (slot.adapt as any)?.adapt_risk ?? '中',
          }}
        />
      </div>
    );
  }

  if (slot.kind === 'fallback_cta') {
    // Paragraph 2 doesn't render CTA; paragraph 3 handles it.
    return null;
  }
  return null;
}

function RecommendCardTile({
  card,
  showAIBadge,
  onOpen,
}: {
  card: RecommendCard;
  showAIBadge?: boolean;
  onOpen: () => void;
}) {
  const healthStatus = card.healthStatus;
  const descFallback = (card.desc ?? '').slice(0, 30);
  const summaryFallback = (card.summary ?? '').slice(0, 30);
  const reasonText =
    card.reason_humanized ??
    card.reason ??
    (descFallback || undefined) ??
    (summaryFallback || undefined) ??
    '—';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        // If this tile is ever wrapped by an outer <a>/<Link>, prevent default navigation.
        event.preventDefault();
        event.stopPropagation();
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onOpen();
        }
      }}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      {/* 头部：AI 徽标 + 健康度圆点 | product 徽标 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {showAIBadge && (
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
              ✦ AI 推荐
            </span>
          )}
          {healthStatus && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500" title={HEALTH_LABEL[healthStatus]}>
              <span className={`inline-block h-2 w-2 rounded-full ${HEALTH_COLOR[healthStatus]}`} />
              <span>{HEALTH_LABEL[healthStatus]}</span>
            </span>
          )}
        </div>
        {card.actionType && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
            {card.actionType}
          </span>
        )}
      </div>

      {/* 资产名 + 类型标签（最多 2） */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-gray-900">{card.title}</div>
        {(card.typeTags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} className={TYPE_TAG_CLASS}>
            {tag}
          </span>
        ))}
      </div>

      {/* 场景标签行（最多 3） */}
      {card.sceneTags && card.sceneTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.sceneTags.slice(0, 3).map((tag) => (
            <span key={tag} className={SCENE_TAG_CLASS}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 核心指标行（最多 3 项） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {card.kpi && <span className="font-medium text-emerald-600">{card.kpi}</span>}
        {typeof card.audienceSize === 'number' && (
          <span className="text-gray-600">
            人群规模 <span className="font-medium text-gray-900">{card.audienceSize}万</span>
          </span>
        )}
        {typeof card.confidence === 'number' && (
          <span className="text-gray-600">
            置信度 <span className="font-medium text-gray-900">{Math.round(card.confidence * 100)}%</span>
          </span>
        )}
      </div>

      {/* 一行简介 */}
      {(card.desc || card.summary) && (
        <div className="line-clamp-1 text-xs text-gray-600">{card.desc ?? card.summary}</div>
      )}

      {/* 一行推荐理由 */}
      <div
        className="text-xs text-amber-700 break-words"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        title={reasonText}
      >
        💡 推荐理由：{reasonText}
      </div>

      {/* 消费方 + 热度 */}
      {(card.consumers?.length || typeof card.consumeHeat === 'number') && (
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          {card.consumers && card.consumers.length > 0 && (
            <span className="truncate">消费方：{card.consumers.join('、')}</span>
          )}
          {typeof card.consumeHeat === 'number' && <span>热度 {card.consumeHeat}</span>}
        </div>
      )}

      {/* 底部"查看详情 →"文字按钮 */}
      <div className="mt-auto flex items-center justify-end pt-1">
        <button
          type="button"
          aria-label="查看详情"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onOpen();
            }
          }}
          className="text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          查看详情 →
        </button>
      </div>
    </div>
  );
}

export default RecommendGroupSection;
