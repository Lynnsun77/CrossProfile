import { useEffect, useMemo, useState } from 'react';
import { RecommendationCard } from '../../../features/hero-recommend/components/RecommendationCard';
import type { GroupedRecommendations, PlatformRecommendationTabKey, RecommendationCard as RecommendationCardData } from '../../../features/hero-recommend/types';
import { useHeroRecommendStore } from '../../../features/hero-recommend/store/useHeroRecommendStore';
import { getMarketplacePlatformRecommendations } from '../../../mock/marketplaceV3';
import type { ConsumerSubRole } from '../../../store/globalState';
import type { Asset } from '../../../types';
import { focusRecommendationHeroInput } from '../../../features/hero-recommend/components/heroInput';

type PlatformRecommendSectionProps = {
  subRole: ConsumerSubRole;
  onOpenGap: () => void;
};

const PLATFORM_TAB_OPTIONS: Array<{ key: PlatformRecommendationTabKey; label: string; desc: string }> = [
  { key: 'owned_tags', label: '自营标签', desc: '优先浏览平台沉淀的自营标签资产' },
  { key: 'recent_hot', label: '近期热门', desc: '优先浏览近期消费热度更高的资产' },
];

function formatMetricValue(asset: Asset) {
  if (!asset.uplift) return asset.roi_hint || 'ROI 稳定提升';
  return asset.uplift.unit === 'x' ? `${asset.uplift.value.toFixed(1)}x` : `+${Math.round(asset.uplift.value)}%`;
}

function resolveCardGroup(asset: Asset, index: number): RecommendationCardData['group'] {
  const heat = asset.heat ?? asset.subs ?? 0;
  if (asset.lifecycle === 'hot' || heat >= 60 || index < 2) return 'ready';
  return 'adaptable';
}

function buildPlatformCard(asset: Asset, subRole: ConsumerSubRole, tabKey: PlatformRecommendationTabKey, index: number): RecommendationCardData {
  const title = subRole === 'algorithm' ? asset.nameAlgo || asset.namespace : asset.nameBiz || asset.name;
  const scenarioTags = (subRole === 'algorithm' ? asset.chipsAlgo : asset.chipsBiz) || asset.scenarios;
  const heat = asset.heat ?? asset.subs ?? 0;
  const matchScore = Math.max(72, Math.min(96, 92 - index * 4 + (tabKey === 'recent_hot' ? 2 : 0)));
  const group = resolveCardGroup(asset, index);
  const reason =
    tabKey === 'owned_tags'
      ? `来自平台自营标签沉淀，覆盖 ${asset.domain} 场景，当前已有 ${heat} 次消费热度。`
      : `近期在平台消费链路中持续升温，覆盖 ${asset.domain} 场景，当前热度 ${heat}。`;

  return {
    id: `platform_${tabKey}_${asset.id}`,
    group,
    name: title,
    objectType: asset.type === 'tag' ? '标签' : asset.type === 'crowd_template' ? '人群' : '策略',
    matchScore,
    matchLabel: group === 'ready' ? '高匹配' : '中匹配',
    oneLineReason: reason,
    hitTags: [
      tabKey === 'owned_tags' ? '平台自营' : '近期热门',
      asset.domain,
      ...(scenarioTags.slice(0, 2) || []),
    ].filter(Boolean),
    metrics: [
      { label: '核心指标', value: `${asset.uplift?.metric || 'ROI'} ${formatMetricValue(asset)}` },
      { label: '消费热度', value: `${heat}` },
      { label: '健康分', value: `${asset.health?.score ?? '-'}分` },
    ],
    goals: [asset.uplift?.metric || 'ROI'],
    scenes: scenarioTags.slice(0, 3),
    preferenceTags: [tabKey === 'owned_tags' ? '平台自营' : '近期热门'],
    reasons: [
      reason,
      `${title} 当前更适合 ${scenarioTags.slice(0, 2).join('、') || '泛化承接'} 等场景。`,
      `最近已有 ${(asset.consumers || asset.consumer || []).length || 1} 个团队关注或复用该资产。`,
      `来源命名空间 ${asset.namespace}，便于继续追溯供给与血缘。`,
    ],
  };
}

function buildPlatformGrouped(subRole: ConsumerSubRole, tabKey: PlatformRecommendationTabKey): GroupedRecommendations {
  const cards = getMarketplacePlatformRecommendations(tabKey).map((asset, index) => buildPlatformCard(asset, subRole, tabKey, index));
  return [
    cards.filter((card) => card.group === 'ready'),
    cards.filter((card) => card.group === 'adaptable'),
  ].reduce<GroupedRecommendations>(
    (acc, current, index) => {
      if (index === 0) acc.ready = current;
      else acc.adaptable = current;
      return acc;
    },
    {
      ready: [],
      adaptable: [],
      fallback: { show: cards.length === 0, reason: cards.length === 0 ? '当前暂无可展示的平台推荐资产。' : undefined },
    },
  );
}

const EMPTY_GROUPED: GroupedRecommendations = {
  ready: [],
  adaptable: [],
  fallback: { show: true, reason: '当前暂无推荐内容，建议先尝试上方智能推荐，或浏览更多可浏览资产。' },
};

export function PlatformRecommendSection({
  subRole,
  onOpenGap,
}: PlatformRecommendSectionProps) {
  const [activeTab, setActiveTab] = useState<PlatformRecommendationTabKey>('owned_tags');
  const [retrySeed, setRetrySeed] = useState(0);
  const setPlatformDetailContext = useHeroRecommendStore((state) => state.setPlatformDetailContext);

  const platformState = useMemo(() => {
    try {
      return {
        grouped: buildPlatformGrouped(subRole, activeTab),
        error: null,
      };
    } catch {
      return {
        grouped: EMPTY_GROUPED,
        error: '平台推荐加载失败，请稍后重试。',
      };
    }
  }, [activeTab, retrySeed, subRole]);
  const grouped = platformState.grouped;
  const activeTabMeta = PLATFORM_TAB_OPTIONS.find((option) => option.key === activeTab) ?? PLATFORM_TAB_OPTIONS[0];

  useEffect(() => {
    setPlatformDetailContext(grouped, { key: activeTabMeta.key, label: activeTabMeta.label });
  }, [activeTabMeta.key, activeTabMeta.label, grouped, setPlatformDetailContext]);

  const handleBrowseMore = () => {
    document.getElementById('asset-library-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="border-b border-border pb-4">
        <div>
          <div className="text-base font-semibold text-text-1">平台推荐</div>
          <div className="mt-1 text-sm text-text-3">
            你可以先快速浏览平台当前推荐内容，也可以先到上方发起智能推荐。
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="inline-flex rounded-xl border border-border bg-bg p-1" role="tablist" aria-label="平台推荐来源 Tab">
          {PLATFORM_TAB_OPTIONS.map((option) => {
            const active = option.key === activeTab;
            return (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={option.label}
                title={option.desc}
                onClick={() => setActiveTab(option.key)}
                className={[
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  active ? 'bg-module-market text-white shadow-sm' : 'text-text-2 hover:bg-white hover:text-text-1',
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {platformState.error ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            <div>{platformState.error}</div>
            <button
              type="button"
              onClick={() => setRetrySeed((value) => value + 1)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            {grouped.ready.length > 0 || grouped.adaptable.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...grouped.ready, ...grouped.adaptable].map((card) => (
                  <RecommendationCard
                    key={card.id}
                    card={card}
                    detailSource="platform"
                    showDecisionTone={false}
                    hideMatchBadge
                  />
                ))}
              </div>
            ) : null}
            {grouped.fallback.show ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                <div>{grouped.fallback.reason ?? '当前暂无推荐内容，建议先尝试上方智能推荐，或浏览更多可浏览资产。'}</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => focusRecommendationHeroInput()}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    去发起智能推荐
                  </button>
                  <button type="button" onClick={handleBrowseMore} className="text-sm text-blue-600 hover:underline">
                    浏览更多资产
                  </button>
                  <button type="button" onClick={onOpenGap} className="text-sm text-blue-600 hover:underline">
                    提交缺口需求（mock）
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
