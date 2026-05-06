import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { Quadrant } from '../../components/common/Quadrant';
import { getCrowdDetailById, mockFeatures, mockPacks } from '../../mock';

export function FoundryHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>(mockFeatures.slice(0, 3).map((item) => item.id));
  const baseCrowdId = searchParams.get('base') || undefined;
  const baseCrowd = baseCrowdId ? getCrowdDetailById(baseCrowdId) : null;

  const quadrantData = useMemo(
    () =>
      mockFeatures.slice(0, 12).map((feature, index) => ({
        x: Number(feature.health.coverage) * 100,
        y: Number(feature.health.accuracy) * 100,
        size: 18 + (index % 4) * 6,
        name: feature.name,
        health: Math.min(5, 2 + (index % 4)),
      })),
    []
  );

  const selectedFeatures = mockFeatures.filter((item) => selectedIds.includes(item.id));
  const targetPackId = mockPacks[0]?.id ?? 'pack_001';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="工坊" subtitle="重要性 × 漂移四象限与特征购物车" moduleTone="foundry" />

      {baseCrowd ? (
        <div className="mb-6 rounded-2xl border border-module-workshop/15 bg-module-workshop/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="foundry">继续圈选</Badge>
                <Badge tone="market">{baseCrowd.crowdCode}</Badge>
              </div>
              <div className="text-base font-semibold text-text-1">
                当前从「{baseCrowd.crowdName}」进入 Foundry
              </div>
              <div className="mt-1 text-sm text-text-3">
                本页承接 `/factory/pack?base={baseCrowd.id}`，继续做规则收紧与特征挑选。
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/marketplace/crowd/${baseCrowd.id}`)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-workshop/30 hover:text-module-workshop"
            >
              返回诊断页
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-1">候选特征四象限</h2>
            <button
              type="button"
              onClick={() => navigate(`/factory/result/${targetPackId}`)}
              className="rounded-lg bg-[#7B5BF5] px-4 py-2 text-sm font-medium text-white"
            >
              生成推荐包
            </button>
          </div>
          <Quadrant data={quadrantData} />

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {mockFeatures.slice(0, 8).map((feature) => {
              const active = selectedIds.includes(feature.id);
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() =>
                    setSelectedIds((current) =>
                      current.includes(feature.id)
                        ? current.filter((id) => id !== feature.id)
                        : [...current, feature.id]
                    )
                  }
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active ? 'border-[#7B5BF5] bg-[#7B5BF5]/10' : 'border-border bg-bg'
                  }`}
                >
                  <div className="text-sm font-medium text-text-1">{feature.name}</div>
                  <div className="mt-1 text-xs text-text-3">{feature.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <div className="mb-4 text-lg font-semibold text-text-1">购物车</div>
          <div className="space-y-3">
            {selectedFeatures.map((feature) => (
              <div key={feature.id} className="rounded-lg border border-border bg-bg p-3">
                <div className="text-sm font-medium text-text-1">{feature.name}</div>
                <div className="mt-1 text-xs text-text-3">
                  AUC {(Number(feature.health.accuracy) * 100).toFixed(1)}% / 覆盖 {(Number(feature.health.coverage) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/factory/result/${targetPackId}`)}
            className="mt-4 w-full rounded-lg bg-[#7B5BF5] px-4 py-2.5 text-sm font-medium text-white"
          >
            查看特征包结果
          </button>
        </div>
      </div>
    </div>
  );
}
