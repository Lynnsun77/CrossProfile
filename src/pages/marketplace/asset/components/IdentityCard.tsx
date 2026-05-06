import type { AssetDetailIdentity, AssetDetailQueryState } from '../types';
import type { DerivedAsset } from '../../../../api/assets';
import { EmptyState } from './EmptyState';

interface IdentityCardProps {
  asset?: DerivedAsset;
  identity?: AssetDetailIdentity;
  query: AssetDetailQueryState;
  loading?: boolean;
  error?: string | null;
}

const viewLabelMap = {
  consumer: '消费方视角',
  producer: '供给方视角',
  operator: '运营方视角',
};

export function IdentityCard({ asset, identity, query, loading, error }: IdentityCardProps) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="身份卡加载失败" description={error} />;
  }
  if (!asset || !identity) {
    return <EmptyState title="暂无身份信息" description="未获取到资产身份卡所需字段。" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-text-3">Identity</div>
          <div className="mt-2 text-xl font-semibold text-text-1">{identity.displayName}</div>
          <div className="mt-1 text-sm text-text-3">{identity.technicalName}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-text-2">
          <span className="rounded-full bg-bg px-3 py-1">{viewLabelMap[query.view]}</span>
          <span className="rounded-full bg-bg px-3 py-1">{asset.domain}</span>
          <span className="rounded-full bg-bg px-3 py-1">{asset.type}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-bg px-4 py-3">
          <div className="text-xs text-text-3">订阅热度</div>
          <div className="mt-1 text-lg font-semibold text-text-1">{asset.subs}</div>
        </div>
        <div className="rounded-xl bg-bg px-4 py-3">
          <div className="text-xs text-text-3">健康度</div>
          <div className="mt-1 text-lg font-semibold text-text-1">{asset.health.score}</div>
        </div>
        <div className="rounded-xl bg-bg px-4 py-3">
          <div className="text-xs text-text-3">收益提示</div>
          <div className="mt-1 text-lg font-semibold text-emerald-600">{asset.roi_hint}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {identity.scenarios.map((scenario) => (
          <span key={scenario} className="rounded-full border border-border px-3 py-1 text-xs text-text-2">
            {scenario}
          </span>
        ))}
      </div>
    </div>
  );
}
