import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postGapRequest } from '../../api/gapRequest';
import { getAssetsApi, type AssetsRequest, type DataSource, type FeatureClassParam, type MarketplaceFilters, type MarketplaceTabParam, type SortDir, type SortKey } from '../../api/assets';
import { AssetCard } from '../../components/common/AssetCard';
import { MarketPageShell } from '../../components/common/MarketPageShell';
import { AssetLibrarySection } from '../../features/hero-recommend/components/AssetLibrarySection';
import { RecommendationHomePanel } from '../../features/hero-recommend/components/RecommendationHomePanel';
import { MARKETPLACE_OPEN_GAP_REQUEST_EVENT } from '../../features/hero-recommend/components/FallbackActionSection';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useGlobalState } from '../../store/globalState';
import type { ConsumerSubRole } from '../../store/globalState';
import type { Asset, Role } from '../../types';
import { SupplierWorkbench } from './components/SupplierWorkbench';
import { FilterBar } from './components/FilterBar';
import { PlatformRecommendSection } from './components/PlatformRecommendSection';
import { RoleSwitch } from './components/RoleSwitch';
import { focusRecommendationHeroInput } from '../../features/hero-recommend/components/heroInput';

const defaultFilters: MarketplaceFilters = {
  tier: null,
  dataSource: null,
  timeliness: null,
  subRange: null,
  publishedAfter: null,
};

const DATA_SOURCE_LABEL_MAP: Record<DataSource, string> = {
  btm_plus: 'BTM+',
  external: 'cross',
  cross_domain: '跨域',
  private_end: '小端',
};

function buildSelectedChips(filters: MarketplaceFilters, query: string) {
  const chips: Array<{ id: string; label: string }> = [];
  if (query.trim()) chips.push({ id: 'query', label: `搜索: ${query.trim()}` });
  if (filters.tier) chips.push({ id: 'tier', label: `Tier: ${filters.tier}` });
  if (filters.dataSource) chips.push({ id: 'dataSource', label: `数据源: ${DATA_SOURCE_LABEL_MAP[filters.dataSource]}` });
  if (filters.timeliness) chips.push({ id: 'timeliness', label: `时效: ${filters.timeliness}` });
  if (filters.subRange) chips.push({ id: 'subRange', label: `订阅: ${filters.subRange}` });
  if (filters.publishedAfter) chips.push({ id: 'publishedAfter', label: `上架: ${filters.publishedAfter}` });
  return chips;
}

function AssetGrid({
  items,
  role,
  showRanking,
}: {
  items: Asset[];
  role: Role;
  showRanking: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3">
      {items.map((asset, index) => (
        <div key={asset.id} className="relative">
          {showRanking ? (
            <div
              className="absolute left-3 top-3 z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold text-white"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {index + 1}
            </div>
          ) : null}
          <AssetCard asset={asset} role={role} />
        </div>
      ))}
    </div>
  );
}

function AssetLibraryContent({
  loading,
  error,
  empty,
  items,
  role,
  showRanking,
  onBackToHero,
  onOpenGap,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  items: Asset[];
  role: Role;
  showRanking: boolean;
  onBackToHero: () => void;
  onOpenGap: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-card border border-border bg-white p-10 text-center">
        <div className="text-base font-semibold text-text-1">正在加载资产...</div>
        <div className="mt-2 text-sm text-text-3">请求 /api/assets（mock）</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-card border border-border bg-white p-10 text-center">
        <div className="text-base font-semibold text-text-1">资产加载失败</div>
        <div className="mt-2 text-sm text-text-3">{error}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-card border border-border bg-white p-10 text-center">
        <div className="text-base font-semibold text-text-1">没有找到符合条件的资产</div>
        <div className="mt-2 text-sm text-text-3">可以试试放宽筛选，或回到顶部智能推荐入口重新描述需求。</div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBackToHero}
            className="h-10 rounded-lg bg-module-market px-5 text-sm font-medium text-white hover:opacity-90"
          >
            回到智能推荐入口
          </button>
          <button
            type="button"
            onClick={onOpenGap}
            className="h-10 rounded-lg border border-border bg-white px-5 text-sm font-medium text-text-2 hover:border-module-market/20"
          >
            提交缺口需求（mock）
          </button>
        </div>
      </div>
    );
  }

  return <AssetGrid items={items} role={role} showRanking={showRanking} />;
}

function GapRequestModal({
  open,
  onClose,
  onSubmit,
  submitting,
  submittedId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string }) => void;
  submitting: boolean;
  submittedId: string | null;
}) {
  const [title, setTitle] = useState('新增资产缺口需求');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-card border border-border bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-text-1">缺口需求</div>
          <button type="button" onClick={onClose} className="text-sm text-text-3 hover:text-text-1">
            关闭
          </button>
        </div>

        {submittedId ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">已提交（mock）：{submittedId}</div>
        ) : (
          <>
            <label className="block text-xs font-medium text-text-3">
              标题
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-market/40"
                placeholder="例如：需要跨域 X 类人群模板"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-text-3">
              描述
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-module-market/40"
                rows={5}
                placeholder="补充业务背景、目标指标、数据口径、期望时效等"
              />
            </label>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-lg border border-border bg-white px-4 text-sm font-medium text-text-2 hover:border-module-market/20"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onSubmit({ title, description })}
                className="h-9 rounded-lg bg-module-market px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? '提交中…' : '提交（mock）'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = useGlobalState((state) => state.currentView);
  const consumerSubRole = useGlobalState((state) => state.consumerSubRole);
  const setConsumerSubRole = useGlobalState((state) => state.setConsumerSubRole);
  const roleForCard: Role = consumerSubRole === 'algorithm' ? 'algo' : 'business';
  const favoriteIds = useFavoriteStore((state) => state.ids);

  const featureClass = (searchParams.get('featureClass') as FeatureClassParam) || 'all';
  const tab = (searchParams.get('tab') as MarketplaceTabParam) || 'all';
  const requestedSubRole = searchParams.get('subRole');

  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sortKey') as SortKey) || 'heat');
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('sortDir') as SortDir) || 'desc');
  const [gapOpen, setGapOpen] = useState(false);
  const [gapSubmitting, setGapSubmitting] = useState(false);
  const [gapSubmittedId, setGapSubmittedId] = useState<string | null>(null);
  const [items, setItems] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value == null || value === '') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const nextSubRole = requestedSubRole === 'algorithm' || requestedSubRole === 'business' ? requestedSubRole : consumerSubRole;
    if (nextSubRole !== consumerSubRole) {
      setConsumerSubRole(nextSubRole);
    }
  }, [consumerSubRole, requestedSubRole, setConsumerSubRole]);

  useEffect(() => {
    setParam('q', query || null);
  }, [query]);

  useEffect(() => {
    setParam('sortKey', sortKey === 'heat' ? null : sortKey);
  }, [sortKey]);

  useEffect(() => {
    setParam('sortDir', sortDir === 'desc' ? null : sortDir);
  }, [sortDir]);

  useEffect(() => {
    const handleOpenGapRequest = () => {
      setGapSubmittedId(null);
      setGapOpen(true);
    };

    window.addEventListener(MARKETPLACE_OPEN_GAP_REQUEST_EVENT, handleOpenGapRequest);
    return () => {
      window.removeEventListener(MARKETPLACE_OPEN_GAP_REQUEST_EVENT, handleOpenGapRequest);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAssetsApi({
      featureClass,
      tab,
      q: query,
      filters,
      sortKey,
      sortDir,
      favoriteIds,
    } satisfies AssetsRequest)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items as unknown as Asset[]);
        setTotal(response.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureClass, tab, query, filters, sortKey, sortDir, favoriteIds]);

  const selectedChips = useMemo(() => buildSelectedChips(filters, query), [filters, query]);

  const empty = items.length === 0;

  const handleScrollToHero = () => {
    focusRecommendationHeroInput();
  };

  const handleOpenGap = () => {
    setGapSubmittedId(null);
    setGapOpen(true);
  };

  const submitGap = async (payload: { title: string; description: string }) => {
    setGapSubmitting(true);
    try {
      const response = await postGapRequest({
        ...payload,
        context: {
          featureClass,
          tab,
          query,
          filters,
          sortKey,
          sortDir,
        },
      });
      setGapSubmittedId(response.requestId);
    } finally {
      setGapSubmitting(false);
    }
  };

  const clearChipById = (chipId: string) => {
    if (chipId === 'query') {
      setQuery('');
      return;
    }
    setFilters((previous) => ({ ...previous, [chipId]: null }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setQuery('');
    setSortKey('heat');
    setSortDir('desc');
  };

  const handleSubRoleChange = (nextSubRole: ConsumerSubRole) => {
    setConsumerSubRole(nextSubRole);
    setParam('subRole', nextSubRole);
  };

  if (currentView === 'producer') return <SupplierWorkbench />;
  if (currentView !== 'consumer') return null;

  return (
    <MarketPageShell title="智能推荐" subtitle="" action={<RoleSwitch value={consumerSubRole} onChange={handleSubRoleChange} />}>
      <RecommendationHomePanel />

      <PlatformRecommendSection
        subRole={consumerSubRole}
        onOpenGap={handleOpenGap}
      />

      <AssetLibrarySection
        controls={
          <FilterBar
            selectedChips={selectedChips}
            tab={tab}
            sortKey={sortKey}
            sortDir={sortDir}
            resultCount={total}
            onTabChange={(next) => setParam('tab', next === 'all' ? null : next)}
            onSortChange={(nextKey, nextDir) => {
              setSortKey(nextKey);
              setSortDir(nextDir);
            }}
            onClearChip={clearChipById}
            onResetAll={resetFilters}
          />
        }
      >
        <AssetLibraryContent
          loading={loading}
          error={error}
          empty={empty}
          items={items}
          role={roleForCard}
          showRanking={tab === 'ranking'}
          onBackToHero={handleScrollToHero}
          onOpenGap={handleOpenGap}
        />
      </AssetLibrarySection>

      <GapRequestModal
        open={gapOpen}
        onClose={() => setGapOpen(false)}
        onSubmit={submitGap}
        submitting={gapSubmitting}
        submittedId={gapSubmittedId}
      />
    </MarketPageShell>
  );
}
