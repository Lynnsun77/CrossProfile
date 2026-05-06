import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../../types';
import { Badge } from '../../../components/common/Badge';
import { getConsumedTopAssetsTop5, getGapRankingApi, type GapRankingResponse } from '../../../api/supplier';

function formatNumber(n: number) {
  return n.toLocaleString('zh-CN');
}

function domainLabel(domain: Asset['domain']) {
  if (domain === 'cross') return '跨域';
  if (domain === 'ecommerce' || domain === 'ecom') return '电商';
  if (domain === 'lifestyle' || domain === 'local') return '生服';
  return String(domain);
}

function gapDomainTone(domain: Asset['domain']) {
  if (domain === 'cross') return 'market';
  if (domain === 'ecommerce' || domain === 'ecom') return 'foundry';
  return 'dashboard';
}

export function SupplierSummaryBar() {
  const consumedTop5 = useMemo(() => getConsumedTopAssetsTop5(), []);
  const [gap, setGap] = useState<GapRankingResponse | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);
  const [loadingGap, setLoadingGap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingGap(true);
    setGapError(null);
    getGapRankingApi()
      .then((res) => {
        if (cancelled) return;
        setGap(res);
      })
      .catch((e) => {
        if (cancelled) return;
        setGapError(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingGap(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-text-3">我的标签被消费 Top5</div>
            <div className="mt-1 text-sm text-text-2">按订阅数(Subs)排序，展示供给侧最常被消费的资产。</div>
          </div>
          <Badge tone="market">Top5</Badge>
        </div>

        <div className="mt-5 space-y-3">
          {consumedTop5.map((asset, idx) => (
            <Link
              key={asset.id}
              to={`/marketplace/${asset.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-module-market/20 hover:bg-bg"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-bg text-xs font-semibold text-text-2">
                    {idx + 1}
                  </span>
                  <div className="truncate text-sm font-medium text-text-1">
                    {asset.nameBiz || asset.nameAlgo || asset.name}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-3">
                  <span className="rounded-full border border-border bg-bg px-2 py-0.5">{domainLabel(asset.domain)}</span>
                  <span className="truncate">{asset.namespace}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-text-1">{formatNumber(asset.subs)}</div>
                <div className="text-xs text-text-3">Subs</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-text-3">需求缺口 Top5</div>
            <div className="mt-1 text-sm text-text-2">来自 `GET /api/gap-ranking` 的 mock 排行。</div>
          </div>
          <Badge tone="foundry">Top5</Badge>
        </div>

        <div className="mt-5 space-y-3">
          {loadingGap ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              正在加载缺口排行...
            </div>
          ) : gapError ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              缺口排行加载失败：{gapError}
            </div>
          ) : gap?.items?.length ? (
            gap.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-bg text-xs font-semibold text-text-2">
                      {idx + 1}
                    </span>
                    <div className="truncate text-sm font-medium text-text-1">{item.title}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-3">
                    <Badge tone={gapDomainTone(item.domain) as any}>{domainLabel(item.domain)}</Badge>
                    <span>需求量 {formatNumber(item.demand)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-text-1">{item.gapScore}</div>
                  <div className="text-xs text-text-3">缺口指数</div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
              暂无缺口排行数据。
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

