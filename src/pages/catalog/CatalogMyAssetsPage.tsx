import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { HealthBadge } from '../../components/common/HealthBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { getSupplierAssetsApi, type SupplierAssetRow } from '../../api/supplier';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { fetcher } from '../../lib/fetcher';
import { updateSearchParam } from '../../lib/view';
import { useGlobalState } from '../../store/globalState';
import type { AppView, Asset } from '../../types';
import { MY_OWNER_FILTER } from '../../api/my';

type MyAssetsScope = 'subscribed' | 'owned';

const SCOPE_TABS: Array<{ key: MyAssetsScope; label: string; desc: string }> = [
  { key: 'subscribed', label: '我订阅的', desc: '消费侧已订阅资产与最近使用入口' },
  { key: 'owned', label: '我拥有的', desc: '供给侧资产与上架中的工作项' },
];

function resolveScope(view: AppView, rawScope: string | null, owner: string | null): MyAssetsScope {
  if (rawScope === 'subscribed' || rawScope === 'owned') return rawScope;
  if (owner === MY_OWNER_FILTER) return 'owned';
  return view === 'consumer' ? 'subscribed' : 'owned';
}

function assetTypeLabel(type: Asset['type']) {
  if (type === 'tag') return '标签';
  if (type === 'crowd_template') return '人群模板';
  if (type === 'feature_pack') return '特征包';
  if (type === 'model') return '模型';
  return type;
}

function supplierAssetTypeLabel(type: SupplierAssetRow['type']) {
  if (type === 'tag') return '标签';
  if (type === 'crowd_template') return '人群模板';
  if (type === 'feature_pack') return '特征包';
  if (type === 'model') return '模型';
  return type;
}

function assetTypeTone(type: Asset['type']) {
  if (type === 'tag') return 'tag';
  if (type === 'crowd_template') return 'crowd';
  return 'feature';
}

function supplierAssetTypeTone(type: SupplierAssetRow['type']) {
  if (type === 'tag') return 'tag';
  if (type === 'crowd_template') return 'crowd';
  return 'feature';
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN');
}

export function CatalogMyAssetsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentView = useGlobalState((s) => s.currentView);

  const ownerFilter = searchParams.get('owner');
  const scope = resolveScope(currentView, searchParams.get('scope'), ownerFilter);

  const [subscribedAssets, setSubscribedAssets] = useState<Asset[]>([]);
  const [ownedAssets, setOwnedAssets] = useState<SupplierAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumb = useMemo(() => [{ label: '我的资产' }, { label: scope === 'subscribed' ? '我订阅的' : '我拥有的' }], [scope]);
  useBreadcrumb(breadcrumb);

  const setScopeParam = (nextScope: MyAssetsScope) => {
    const next = new URLSearchParams(searchParams);
    next.set('scope', nextScope);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const task =
      scope === 'subscribed'
        ? fetcher<Asset[]>('/mock/assets.json').then((items) => {
            if (cancelled) return;
            setSubscribedAssets(items.slice(0, 8));
          })
        : getSupplierAssetsApi({ status: 'listed', owner: ownerFilter ?? undefined }).then((res) => {
            if (cancelled) return;
            setOwnedAssets(res.items);
          });

    task
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
  }, [ownerFilter, scope]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="我的资产"
          subtitle={`当前路径 ${location.pathname}，通过 ?scope= 承接订阅与拥有两种资产范围，额外支持 ?owner=me 过滤`}
          moduleTone="market"
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前按
          <span className="mx-1 font-semibold text-text-1">{currentView === 'consumer' ? '消费视角' : '供给视角'}</span>
          解析资产范围；未传 `scope` 时会回退到该视角的默认范围。
        </div>

        <section className="rounded-card border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-text-1">范围切换</div>
              <div className="mt-1 text-sm text-text-3">`scope=subscribed|owned` 决定当前页面承接的资产范围，老路由继续可用。</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCOPE_TABS.map((tab) => {
                const active = tab.key === scope;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setScopeParam(tab.key)}
                    className={[
                      'rounded-lg px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'border border-border bg-blue-600 text-white shadow-sm'
                        : 'border border-border bg-white text-text-2 hover:border-module-market/20 hover:text-text-1',
                    ].join(' ')}
                    title={tab.desc}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 rounded-card border border-border bg-white p-10 text-center text-sm text-text-3">正在加载资产...</div>
        ) : error ? (
          <div className="mt-6 rounded-card border border-border bg-white p-10 text-center text-sm text-text-3">资产加载失败：{error}</div>
        ) : scope === 'subscribed' ? (
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscribedAssets.map((asset) => (
              <article key={asset.id} className="rounded-card border border-border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/marketplace/asset/${asset.id}?view=consumer`} className="block truncate text-sm font-semibold text-text-1 hover:text-module-market">
                      {asset.nameBiz || asset.nameAlgo || asset.name}
                    </Link>
                    <div className="mt-1 text-xs text-text-3">{asset.namespace}</div>
                  </div>
                  <HealthBadge level={asset.health.level} score={asset.health.score} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge tone={assetTypeTone(asset.type) as never}>{assetTypeLabel(asset.type)}</Badge>
                  <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-2">订阅 {formatNumber(asset.subs)}</span>
                </div>
                <div className="mt-4 line-clamp-2 text-sm text-text-2">{asset.description || asset.desc}</div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="text-xs text-text-3">{asset.roi_hint}</div>
                  <Link to={`/marketplace/asset/${asset.id}?view=consumer`} className="text-sm font-medium text-module-market hover:opacity-80">
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-6 rounded-card border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-text-1">我拥有的资产</div>
                <div className="mt-1 text-sm text-text-3">供给入口默认落到 `/catalog/my-assets?scope=owned`，同时保留 `/marketplace?view=producer` 的工作台兼容入口。</div>
              </div>
              <Link
                to={{ pathname: '/marketplace', search: updateSearchParam(location.search, 'view', 'producer') }}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/20 hover:text-module-market"
              >
                打开供给工作台
              </Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-bg">
                  <tr className="text-xs uppercase tracking-wide text-text-3">
                    <th className="px-4 py-3 font-medium">资产名</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">版本</th>
                    <th className="px-4 py-3 font-medium">订阅数</th>
                    <th className="px-4 py-3 font-medium">健康度</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ownedAssets.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <Link to={`/marketplace/asset/${row.id}?view=producer`} className="block truncate text-sm font-medium text-text-1 hover:text-module-market">
                            {row.nameBiz || row.nameAlgo || row.name}
                          </Link>
                          <div className="mt-1 text-xs text-text-3">{row.namespace}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={supplierAssetTypeTone(row.type) as never}>{supplierAssetTypeLabel(row.type)}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-text-2">{row.versionText}</td>
                      <td className="px-4 py-4 text-sm text-text-2">{formatNumber(row.subs)}</td>
                      <td className="px-4 py-4">
                        <HealthBadge level={row.health.level} score={row.health.score} />
                      </td>
                      <td className="px-4 py-4">
                        <Link to={`/marketplace/asset/${row.id}?view=producer`} className="text-sm font-medium text-module-market hover:opacity-80">
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
