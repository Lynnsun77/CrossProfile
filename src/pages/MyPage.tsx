import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { getMyDashboardApi, MY_ASSIGNEE_FILTER, MY_OWNER_FILTER, type MyDashboardResponse } from '../api/my';
import { getNavigationViewLabel } from '../lib/navigation';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
import { useGlobalState } from '../store/globalState';

const DEFAULT_DASHBOARD: MyDashboardResponse = {
  favoritesCount: 0,
  subscriptionsCount: 0,
  strategiesCount: 0,
  ownedAssetsCount: 0,
  unresolvedTicketsCount: 0,
  newSubscribersCount: 0,
};

function toneForView(view: 'consumer' | 'producer' | 'operator') {
  return view === 'producer' ? 'dashboard' : 'market';
}

export function MyPage() {
  const currentView = useGlobalState((s) => s.currentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MyDashboardResponse>(DEFAULT_DASHBOARD);

  useBreadcrumb([{ label: '我的' }]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyDashboardApi()
      .then((result) => {
        if (cancelled) return;
        setStats(result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const consumerCards = useMemo(
    () => [
      { title: '我的收藏', desc: '收藏的高频资产与推荐候选', count: stats.favoritesCount, to: '/my/favorites' },
      { title: '我的订阅', desc: '正在使用的订阅资产与渠道', count: stats.subscriptionsCount, to: '/my/subscriptions' },
      { title: '我的策略', desc: '按子角色保存的策略组合', count: stats.strategiesCount, to: '/my/strategies' },
      { title: '历史会话', desc: '推荐与诊断历史记录', count: null, to: '/my/agent-history' },
    ],
    [stats.favoritesCount, stats.strategiesCount, stats.subscriptionsCount],
  );

  const producerCards = useMemo(
    () => [
      { title: '我的资产', desc: '供给侧资产目录与 owner=me 过滤', count: stats.ownedAssetsCount, to: `/catalog/my-assets?owner=${MY_OWNER_FILTER}` },
      { title: '我负责的工单', desc: '质量治理待处理项', count: stats.unresolvedTicketsCount, to: `/quality/tickets?assignee=${MY_ASSIGNEE_FILTER}` },
      { title: '我的归因报告', desc: '最近跟进的归因结果', count: null, to: '/my/attribution' },
      { title: '我的订阅者', desc: '近 7 天新增订阅方', count: stats.newSubscribersCount, to: '/my/subscribers' },
    ],
    [stats.newSubscribersCount, stats.ownedAssetsCount, stats.unresolvedTicketsCount],
  );

  const cards = currentView === 'producer' ? producerCards : consumerCards;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="个人中心"
          subtitle={`当前身份 ${currentUser.name} · ${getNavigationViewLabel(currentView)}视角${currentView === 'consumer' ? ` · ${consumerSubRole === 'algorithm' ? '算法同学' : '业务运营'}` : ''}`}
          moduleTone={toneForView(currentView)}
        />

        <section className="rounded-card border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-semibold text-text-1">{currentUser.name}</div>
              <div className="mt-1 text-sm text-text-3">
                {currentUser.team} · 当前在 {currentView === 'producer' ? '供给' : '消费'}动线中浏览个人入口
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-bg px-3 py-2 text-text-2">用户 ID {currentUser.id}</span>
              <span className="rounded-full bg-bg px-3 py-2 text-text-2">团队 {currentUser.teamId}</span>
            </div>
          </div>
        </section>

        {loading ? <div className="mt-6 rounded-card border border-border bg-white p-10 text-center text-sm text-text-3">正在加载个人概览...</div> : null}
        {error ? <div className="mt-6 rounded-card border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">个人概览加载失败：{error}</div> : null}

        {!loading && !error ? (
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link key={card.to} to={card.to} className="rounded-card border border-border bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text-1">{card.title}</div>
                    <div className="mt-2 text-sm text-text-3">{card.desc}</div>
                  </div>
                  {card.count != null ? (
                    <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">{card.count}</span>
                  ) : (
                    <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-3">详情</span>
                  )}
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
