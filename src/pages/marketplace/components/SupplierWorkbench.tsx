import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { HealthBadge } from '../../../components/common/HealthBadge';
import { Badge } from '../../../components/common/Badge';
import { useBreadcrumb } from '../../../hooks/useBreadcrumb';
import { track } from '../../../lib/track';
import { useGlobalState } from '../../../store/globalState';
import {
  buildSupplierAssetsUrl,
  getSupplierAssetsApi,
  type SupplierAssetRow,
  type SupplierAssetStatus,
} from '../../../api/supplier';
import { SupplierSummaryBar } from './SupplierSummaryBar';

const STATUS_TABS: Array<{ key: SupplierAssetStatus; label: string }> = [
  { key: 'listed', label: '我的上架' },
  { key: 'draft', label: '草稿' },
  { key: 'review', label: '评审中' },
  { key: 'offline', label: '已下架' },
];

function assetTypeLabel(type: SupplierAssetRow['type']) {
  if (type === 'tag') return '标签';
  if (type === 'crowd_template') return '人群模板';
  if (type === 'feature_pack') return '特征包';
  if (type === 'model') return '模型';
  return type;
}

function assetTypeTone(type: SupplierAssetRow['type']) {
  if (type === 'tag') return 'tag';
  if (type === 'crowd_template') return 'crowd';
  return 'feature';
}

function formatNumber(n: number) {
  return n.toLocaleString('zh-CN');
}

export function SupplierWorkbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = useGlobalState((s) => s.currentView);
  const [status, setStatus] = useState<SupplierAssetStatus>('listed');
  const [rows, setRows] = useState<SupplierAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumb = useMemo(() => [{ label: '智能推荐', to: '/marketplace' }, { label: '供给方工作台' }], []);
  useBreadcrumb(breadcrumb);

  useEffect(() => {
    const requestedStatus = searchParams.get('supplierStatus');
    if (requestedStatus === 'listed' || requestedStatus === 'draft' || requestedStatus === 'review' || requestedStatus === 'offline') {
      setStatus(requestedStatus);
    }
  }, [searchParams]);

  const setSupplierStatusParam = (nextStatus: SupplierAssetStatus) => {
    const next = new URLSearchParams(searchParams);
    next.set('supplierStatus', nextStatus);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSupplierAssetsApi({ status })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '加载失败');
        setRows([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="供给方工作台"
          subtitle="管理我的资产上架流程，并关注被消费 Top5 与需求缺口排行。"
          moduleTone="market"
          action={
            <button
              type="button"
              className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              onClick={() => track('supplier_create_asset_click', { from: 'supplier_workbench' })}
            >
              新建资产(占位)
            </button>
          }
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前为
          <span className="mx-1 font-semibold text-text-1">{currentView === 'producer' ? '供给视角' : '消费视角'}</span>
          ，筛选条件与 `?view=` 仍会一起保留在当前链接中。
        </div>

        <SupplierSummaryBar />

        <section className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium text-text-3">我的资产列表</div>
              <div className="mt-1 text-sm text-text-2">
                子 Tab 对应 `GET /api/supplier/assets?status=...`，当前 URL 形状：
                <span className="ml-1 font-mono text-xs text-text-3">{buildSupplierAssetsUrl({ status })}</span>
              </div>
            </div>
            <div role="tablist" aria-label="供给方工作台子 Tab" className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const selected = tab.key === status;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSupplierStatusParam(tab.key)}
                    className={[
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                      selected
                        ? 'border border-border bg-white text-text-1 shadow-sm'
                        : 'border border-transparent bg-bg text-text-2 hover:border-border hover:bg-white/70 hover:text-text-1',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              正在加载资产列表...
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              资产列表加载失败：{error}
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              当前状态下暂无资产。
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="min-w-full divide-y divide-border text-left">
                <thead className="bg-bg">
                  <tr className="text-xs uppercase tracking-wide text-text-3">
                    <th className="px-4 py-3 font-medium">资产名</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">版本(替代)</th>
                    <th className="px-4 py-3 font-medium">订阅数</th>
                    <th className="px-4 py-3 font-medium">健康度</th>
                    <th className="px-4 py-3 font-medium">最近更新</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <Link
                            to={`/marketplace/${row.id}?view=producer`}
                            className="block truncate text-sm font-medium text-text-1 hover:text-module-market"
                          >
                            {row.nameBiz || row.nameAlgo || row.name}
                          </Link>
                          <div className="mt-1 truncate text-xs text-text-3">{row.namespace}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={assetTypeTone(row.type) as any}>{assetTypeLabel(row.type)}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full border border-border bg-bg px-2.5 py-1 text-xs text-text-2">
                          {row.versionText}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-text-1">{formatNumber(row.subs)}</div>
                        <div className="text-xs text-text-3">Subs</div>
                      </td>
                      <td className="px-4 py-4">
                        <HealthBadge level={row.health.level} score={row.health.score} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-text-2">{row.updatedAt}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/marketplace/${row.id}?view=producer`}
                            className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-module-market/20 hover:text-module-market"
                          >
                            查看
                          </Link>
                          {(row.supplierStatus === 'draft' || row.supplierStatus === 'review') && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-module-market/20 hover:text-module-market"
                              onClick={() => track('supplier_asset_edit_click', { id: row.id, status: row.supplierStatus })}
                            >
                              编辑(占位)
                            </button>
                          )}
                          {row.supplierStatus === 'listed' && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-rose-200 hover:text-rose-600"
                              onClick={() => track('supplier_asset_offline_click', { id: row.id })}
                            >
                              下架(占位)
                            </button>
                          )}
                          {row.supplierStatus === 'offline' && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-emerald-200 hover:text-emerald-700"
                              onClick={() => track('supplier_asset_list_click', { id: row.id })}
                            >
                              上架(占位)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
