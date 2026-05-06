import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { HealthBadge } from '../../components/common/HealthBadge';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import {
  getMyAgentHistoryApi,
  getMyAttributionReportsApi,
  getMyFavoritesApi,
  getMyStrategiesApi,
  getMySubscribersApi,
  getMySubscriptionsApi,
  type MyAgentHistoryItem,
  type MyAttributionReportItem,
  type MyFavoriteItem,
  type MyStrategyItem,
  type MySubscriberItem,
  type MySubscriptionItem,
} from '../../api/my';
import { useGlobalState } from '../../store/globalState';

type LoaderState<T> = {
  loading: boolean;
  error: string | null;
  data: T[];
};

function useMyList<T>(loader: () => Promise<T[]>) {
  const [state, setState] = useState<LoaderState<T>>({
    loading: true,
    error: null,
    data: [],
  });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    loader()
      .then((data) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : '加载失败',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}

function toneForView(view: 'consumer' | 'producer' | 'operator') {
  return view === 'producer' ? 'dashboard' : 'market';
}

function MyPageShell({
  title,
  subtitle,
  breadcrumb,
  children,
}: {
  title: string;
  subtitle: string;
  breadcrumb: Array<{ label: string; to?: string }>;
  children: ReactNode;
}) {
  const currentView = useGlobalState((s) => s.currentView);
  useBreadcrumb(breadcrumb);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title={title} subtitle={subtitle} moduleTone={toneForView(currentView)} />
        {children}
      </div>
    </div>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return <div className="rounded-card border border-border bg-white p-10 text-center text-sm text-text-3">{text}</div>;
}

function ErrorBlock({ text }: { text: string }) {
  return <div className="rounded-card border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">{text}</div>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="rounded-card border border-dashed border-border bg-white p-10 text-center text-sm text-text-3">{text}</div>;
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg px-3 py-2 text-xs text-text-3">
      <span>{label}</span>
      <span className="ml-2 font-semibold text-text-1">{value}</span>
    </div>
  );
}

function statusClass(status: MyAgentHistoryItem['status'] | MyAttributionReportItem['status']) {
  if (status === 'completed' || status === 'done') return 'bg-emerald-50 text-emerald-700';
  if (status === 'draft' || status === 'watch') return 'bg-amber-50 text-amber-700';
  if (status === 'shared' || status === 'active') return 'bg-sky-50 text-sky-700';
  return 'bg-gray-100 text-text-2';
}

export function MyFavoritesPage() {
  const { data, loading, error } = useMyList(getMyFavoritesApi);

  return (
    <MyPageShell
      title="我的收藏"
      subtitle="消费视角收藏夹，承接菜单 badge 的 favorites_count。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '我的收藏' }]}
    >
      {loading ? <LoadingBlock text="正在加载收藏资产..." /> : null}
      {error ? <ErrorBlock text={`收藏资产加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有收藏资产。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((asset: MyFavoriteItem) => (
            <article key={asset.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/marketplace/asset/${asset.id}?view=consumer`} className="block truncate text-sm font-semibold text-text-1 hover:text-module-market">
                    {asset.nameBiz || asset.name}
                  </Link>
                  <div className="mt-1 text-xs text-text-3">{asset.namespace}</div>
                </div>
                <HealthBadge level={asset.health.level} score={asset.health.score} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SummaryPill label="收藏于" value={asset.savedAt.slice(5, 10)} />
                <SummaryPill label="订阅数" value={String(asset.subs)} />
              </div>
              <p className="mt-4 text-sm text-text-2">{asset.reason}</p>
              <div className="mt-4 border-t border-border pt-4 text-xs text-text-3">{asset.description || asset.desc}</div>
            </article>
          ))}
        </section>
      ) : null}
    </MyPageShell>
  );
}

export function MySubscriptionsPage() {
  const { data, loading, error } = useMyList(getMySubscriptionsApi);

  return (
    <MyPageShell
      title="我的订阅"
      subtitle="承接消费视角订阅资产清单，并联动 `/catalog/my-assets?scope=subscribed`。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '我的订阅' }]}
    >
      {loading ? <LoadingBlock text="正在加载订阅资产..." /> : null}
      {error ? <ErrorBlock text={`订阅资产加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有订阅资产。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((asset: MySubscriptionItem) => (
            <article key={asset.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <Link to={`/marketplace/asset/${asset.id}?view=consumer`} className="text-sm font-semibold text-text-1 hover:text-module-market">
                    {asset.nameBiz || asset.name}
                  </Link>
                  <div className="mt-1 text-xs text-text-3">{asset.namespace}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SummaryPill label="订阅于" value={asset.subscribedAt.slice(5, 10)} />
                    <SummaryPill label="渠道数" value={String(asset.channelCount)} />
                    <SummaryPill label="最近使用" value={asset.lastUsedAt.slice(5, 16).replace('T', ' ')} />
                  </div>
                </div>
                <div className="text-right">
                  <HealthBadge level={asset.health.level} score={asset.health.score} />
                  <div className="mt-2 text-xs text-text-3">{asset.roi_hint}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </MyPageShell>
  );
}

export function MyStrategiesPage() {
  const { data, loading, error } = useMyList(getMyStrategiesApi);

  return (
    <MyPageShell
      title="我的策略"
      subtitle="沉淀消费侧保存过的推荐组合与子角色口径。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '我的策略' }]}
    >
      {loading ? <LoadingBlock text="正在加载策略..." /> : null}
      {error ? <ErrorBlock text={`策略加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有保存策略。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.map((strategy: MyStrategyItem) => (
            <article key={strategy.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-text-1">{strategy.title}</div>
                  <div className="mt-1 text-xs text-text-3">关联资产 {strategy.assetName}</div>
                </div>
                <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">{strategy.subRole === 'business' ? '业务运营' : '算法同学'}</span>
              </div>
              <p className="mt-3 text-sm text-text-2">{strategy.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SummaryPill label="特征类" value={strategy.featureClass} />
                <SummaryPill label="保存于" value={strategy.savedAt.slice(5, 16).replace('T', ' ')} />
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </MyPageShell>
  );
}

export function MyAgentHistoryPage() {
  const { data, loading, error } = useMyList(getMyAgentHistoryApi);

  return (
    <MyPageShell
      title="历史会话"
      subtitle="消费侧历史推荐/诊断会话，承接用户菜单中的历史会话入口。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '历史会话' }]}
    >
      {loading ? <LoadingBlock text="正在加载历史会话..." /> : null}
      {error ? <ErrorBlock text={`历史会话加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有历史会话。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item: MyAgentHistoryItem) => (
            <article key={item.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-text-1">{item.title}</div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>
                  </div>
                  <div className="mt-2 text-sm text-text-2">{item.summary}</div>
                </div>
                <div className="text-right text-xs text-text-3">
                  <div>更新时间 {item.updatedAt.slice(5, 16).replace('T', ' ')}</div>
                  <Link to={item.relatedPath} className="mt-2 inline-block text-sm font-medium text-module-market hover:opacity-80">
                    继续查看
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </MyPageShell>
  );
}

export function MyAttributionPage() {
  const { data, loading, error } = useMyList(getMyAttributionReportsApi);

  return (
    <MyPageShell
      title="我的归因报告"
      subtitle="供给视角个人归因清单，补齐 `/my/attribution` 二级页。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '我的归因报告' }]}
    >
      {loading ? <LoadingBlock text="正在加载归因报告..." /> : null}
      {error ? <ErrorBlock text={`归因报告加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有归因报告。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.map((item: MyAttributionReportItem) => (
            <article key={item.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-text-1">{item.title}</div>
                  <div className="mt-1 text-xs text-text-3">特征 {item.featureId}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SummaryPill label={item.impactMetric} value={item.impactValue} />
                <SummaryPill label="更新于" value={item.updatedAt.slice(5, 16).replace('T', ' ')} />
              </div>
              <div className="mt-4">
                <Link to={`/quality/attribution/${item.featureId}?view=producer`} className="text-sm font-medium text-module-dashboard hover:opacity-80">
                  打开归因详情
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </MyPageShell>
  );
}

export function MySubscribersPage() {
  const { data, loading, error } = useMyList(getMySubscribersApi);
  const newCount = useMemo(() => data.filter((item) => item.newIn7d).length, [data]);

  return (
    <MyPageShell
      title="我的订阅者"
      subtitle="供给视角订阅方列表，对应 badge 的 `new_subscribers_7d`。"
      breadcrumb={[{ label: '我的', to: '/my' }, { label: '我的订阅者' }]}
    >
      {loading ? <LoadingBlock text="正在加载订阅者..." /> : null}
      {error ? <ErrorBlock text={`订阅者加载失败：${error}`} /> : null}
      {!loading && !error && data.length === 0 ? <EmptyBlock text="当前还没有订阅者。" /> : null}
      {!loading && !error && data.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <SummaryPill label="订阅者总数" value={String(data.length)} />
            <SummaryPill label="近 7 天新增" value={String(newCount)} />
          </div>
          <div className="overflow-x-auto rounded-card border border-border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-bg">
                <tr className="text-xs uppercase tracking-wide text-text-3">
                  <th className="px-4 py-3 font-medium">订阅方</th>
                  <th className="px-4 py-3 font-medium">资产</th>
                  <th className="px-4 py-3 font-medium">场景</th>
                  <th className="px-4 py-3 font-medium">订阅时间</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item: MySubscriberItem) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-text-1">{item.subscriberName}</div>
                      <div className="mt-1 text-xs text-text-3">{item.teamName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/marketplace/asset/${item.assetId}?view=producer`} className="text-sm text-text-1 hover:text-module-dashboard">
                        {item.assetName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-2">{item.useCase}</td>
                    <td className="px-4 py-4 text-sm text-text-2">{item.subscribedAt.slice(5, 16).replace('T', ' ')}</td>
                    <td className="px-4 py-4">
                      {item.newIn7d ? <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">new</span> : <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">存量</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </MyPageShell>
  );
}
