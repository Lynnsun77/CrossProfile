import type { Asset } from '../types';
import { mockAssets, mockOpportunities } from '../mock';
import { getGovernanceTickets } from '../mock/quality';

export type MyBadgeRole = 'consumer' | 'producer';
export type MyBadgeSource =
  | 'favorites_count'
  | 'subscriptions_count'
  | 'strategies_count'
  | 'owned_assets_count'
  | 'unresolved_tickets'
  | 'new_subscribers_7d';

export type MyBadgeMap = Partial<Record<MyBadgeSource, number>>;

export type MyBadgesResponse = {
  role: MyBadgeRole;
  badges: MyBadgeMap;
};

export type MyFavoriteItem = Asset & {
  reason: string;
  savedAt: string;
};

export type MySubscriptionItem = Asset & {
  subscribedAt: string;
  channelCount: number;
  lastUsedAt: string;
};

export type MyStrategyItem = {
  id: string;
  title: string;
  summary: string;
  assetId: string;
  assetName: string;
  subRole: 'business' | 'algorithm';
  featureClass: 'all' | 'rule' | 'sequence' | 'algo' | 'vector' | 'llm_intent';
  savedAt: string;
};

export type MyAgentHistoryItem = {
  id: string;
  title: string;
  summary: string;
  status: 'completed' | 'draft' | 'shared';
  updatedAt: string;
  relatedPath: string;
};

export type MyAttributionReportItem = {
  id: string;
  title: string;
  featureId: string;
  impactMetric: string;
  impactValue: string;
  status: 'active' | 'watch' | 'done';
  updatedAt: string;
};

export type MySubscriberItem = {
  id: string;
  assetId: string;
  assetName: string;
  subscriberName: string;
  teamName: string;
  newIn7d: boolean;
  subscribedAt: string;
  useCase: string;
};

export type MyDashboardResponse = {
  favoritesCount: number;
  subscriptionsCount: number;
  strategiesCount: number;
  ownedAssetsCount: number;
  unresolvedTicketsCount: number;
  newSubscribersCount: number;
};

export const MY_BADGES_TTL_MS = 5 * 60 * 1000;
export const MY_BADGES_REFRESH_EVENT = 'cp:badge-refresh';
export const MY_OWNER_FILTER = 'me';
export const MY_ASSIGNEE_FILTER = 'me';
export const MY_ASSIGNEE_TEAM_ID = 'team_quality_vector';

type BadgeCacheEntry = {
  data: MyBadgesResponse | null;
  expiresAt: number;
  promise: Promise<MyBadgesResponse> | null;
};

const badgeCache = new Map<MyBadgeRole, BadgeCacheEntry>();

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withDate(day: number, hour: number) {
  return `2026-04-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function buildFavorites(): MyFavoriteItem[] {
  const sources = mockAssets
    .filter((asset) => asset.isAIRecommended || asset.subs >= 44)
    .slice(0, 8);

  return sources.map((asset, index) => ({
    ...asset,
    reason: index % 2 === 0 ? '最近在市集中多次对比并加入收藏' : '常用于复购和召回场景的常驻资产',
    savedAt: withDate(25 - index, 10 + (index % 4)),
  }));
}

function buildSubscriptions(): MySubscriptionItem[] {
  return mockAssets
    .slice()
    .sort((left, right) => right.subs - left.subs)
    .slice(0, 12)
    .map((asset, index) => ({
      ...asset,
      subscribedAt: withDate(24 - index, 9 + (index % 5)),
      channelCount: 2 + (index % 4),
      lastUsedAt: withDate(26 - (index % 6), 14 + (index % 3)),
    }));
}

function buildStrategies(): MyStrategyItem[] {
  return buildSubscriptions()
    .slice(0, 5)
    .map((asset, index) => ({
      id: `strategy_${index + 1}`,
      title: `${asset.nameBiz || asset.name}策略模版`,
      summary: index % 2 === 0 ? '偏业务口径，适合促活/召回投放' : '偏算法口径，适合建模和排序联调',
      assetId: asset.id,
      assetName: asset.nameBiz || asset.name,
      subRole: index % 2 === 0 ? 'business' : 'algorithm',
      featureClass: (['all', 'rule', 'sequence', 'algo', 'vector'] as const)[index] ?? 'all',
      savedAt: withDate(23 - index, 11 + index),
    }));
}

function buildAgentHistory(): MyAgentHistoryItem[] {
  return mockOpportunities.slice(0, 6).map((opp, index) => ({
    id: `history_${opp.id}`,
    title: opp.title,
    summary: opp.description,
    status: index === 0 ? 'draft' : index === 1 ? 'shared' : 'completed',
    updatedAt: withDate(26 - index, 15 + (index % 3)),
    relatedPath: `/marketplace/recommend?session=${opp.id}`,
  }));
}

function buildOwnedAssets(): Asset[] {
  return mockAssets.slice(0, 18);
}

function buildAttributionReports(): MyAttributionReportItem[] {
  return buildOwnedAssets().slice(0, 6).map((asset, index) => ({
    id: `attr_${asset.id}`,
    title: `${asset.nameBiz || asset.name} 归因追踪`,
    featureId: `feat_${String(index + 1).padStart(3, '0')}`,
    impactMetric: index % 2 === 0 ? 'GMV' : 'ROI',
    impactValue: index % 2 === 0 ? `+${12 - index}%` : `+${(1.8 - index * 0.1).toFixed(1)}x`,
    status: index === 0 ? 'watch' : index === 1 ? 'done' : 'active',
    updatedAt: withDate(25 - index, 13 + (index % 3)),
  }));
}

function buildSubscribers(): MySubscriberItem[] {
  const assets = buildOwnedAssets().slice(0, 6);
  return assets.map((asset, index) => ({
    id: `subscriber_${index + 1}`,
    assetId: asset.id,
    assetName: asset.nameBiz || asset.name,
    subscriberName: ['生服增长组', '电商营销组', 'CRM 平台', '推荐算法组', '品牌运营组', '搜索策略组'][index] ?? `订阅方${index + 1}`,
    teamName: ['业务运营', '数据智能', '平台增长', '推荐工程', '行业经营', '搜索团队'][index] ?? '业务团队',
    newIn7d: index < 3,
    subscribedAt: withDate(26 - index, 10 + (index % 4)),
    useCase: asset.scenarios[0] ?? '通用场景',
  }));
}

function buildBadgePayload(role: MyBadgeRole): MyBadgesResponse {
  const unresolvedTickets = getGovernanceTickets().filter(
    (ticket) =>
      ticket.assigneeTeamId === MY_ASSIGNEE_TEAM_ID &&
      (ticket.status === 'open' || ticket.status === 'processing'),
  ).length;

  if (role === 'consumer') {
    return {
      role,
      badges: {
        favorites_count: buildFavorites().length,
        subscriptions_count: buildSubscriptions().length,
        strategies_count: buildStrategies().length,
      },
    };
  }

  return {
    role,
    badges: {
      owned_assets_count: buildOwnedAssets().length,
      unresolved_tickets: unresolvedTickets,
      new_subscribers_7d: buildSubscribers().filter((item) => item.newIn7d).length,
    },
  };
}

export function buildMyBadgesUrl(role: MyBadgeRole) {
  return `/api/my/badges?role=${encodeURIComponent(role)}`;
}

export function getCachedMyBadges(role: MyBadgeRole) {
  return badgeCache.get(role)?.data ?? null;
}

export function isMyBadgesCacheExpired(role: MyBadgeRole) {
  const cached = badgeCache.get(role);
  if (!cached?.data) return true;
  return cached.expiresAt <= Date.now();
}

export function invalidateMyBadgesCache(role?: MyBadgeRole) {
  if (role) {
    badgeCache.delete(role);
    return;
  }
  badgeCache.clear();
}

export function emitMyBadgesRefresh(role?: MyBadgeRole) {
  window.dispatchEvent(new CustomEvent(MY_BADGES_REFRESH_EVENT, { detail: { role } }));
}

export async function getMyBadgesApi(role: MyBadgeRole, options: { force?: boolean } = {}): Promise<MyBadgesResponse> {
  void buildMyBadgesUrl(role);
  const now = Date.now();
  const cached = badgeCache.get(role);

  if (!options.force && cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (!options.force && cached?.promise) {
    return cached.promise;
  }

  const promise = (async () => {
    await delay(140);
    const data = buildBadgePayload(role);
    badgeCache.set(role, {
      data,
      expiresAt: Date.now() + MY_BADGES_TTL_MS,
      promise: null,
    });
    return data;
  })();

  badgeCache.set(role, {
    data: cached?.data ?? null,
    expiresAt: cached?.expiresAt ?? 0,
    promise,
  });

  return promise;
}

export async function getMyFavoritesApi(): Promise<MyFavoriteItem[]> {
  await delay(120);
  return buildFavorites();
}

export async function getMySubscriptionsApi(): Promise<MySubscriptionItem[]> {
  await delay(130);
  return buildSubscriptions();
}

export async function getMyStrategiesApi(): Promise<MyStrategyItem[]> {
  await delay(130);
  return buildStrategies();
}

export async function getMyAgentHistoryApi(): Promise<MyAgentHistoryItem[]> {
  await delay(110);
  return buildAgentHistory();
}

export async function getMyAttributionReportsApi(): Promise<MyAttributionReportItem[]> {
  await delay(130);
  return buildAttributionReports();
}

export async function getMySubscribersApi(): Promise<MySubscriberItem[]> {
  await delay(120);
  return buildSubscribers();
}

export async function getMyDashboardApi(): Promise<MyDashboardResponse> {
  await delay(100);
  const consumerBadges = buildBadgePayload('consumer').badges;
  const producerBadges = buildBadgePayload('producer').badges;
  return {
    favoritesCount: consumerBadges.favorites_count ?? 0,
    subscriptionsCount: consumerBadges.subscriptions_count ?? 0,
    strategiesCount: consumerBadges.strategies_count ?? 0,
    ownedAssetsCount: producerBadges.owned_assets_count ?? 0,
    unresolvedTicketsCount: producerBadges.unresolved_tickets ?? 0,
    newSubscribersCount: producerBadges.new_subscribers_7d ?? 0,
  };
}
