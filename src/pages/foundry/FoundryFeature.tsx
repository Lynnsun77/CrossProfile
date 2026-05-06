import { Link, useParams } from 'react-router-dom';
import { Quadrant } from '../../components/common/Quadrant';
import { HealthBadge } from '../../components/common/HealthBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { getFeatureById } from '../../mock';

export function FoundryFeature() {
  const { id } = useParams<{ id: string }>();
  const feature = getFeatureById(id || 'feat_001');
  const accuracy = Number(feature.health.accuracy);
  const coverage = Number(feature.health.coverage);

  useBreadcrumb([
    { label: '工坊', to: '/factory' },
    { label: '查看特征详情' },
  ]);

  const quadrantData = [
    {
      x: coverage * 100,
      y: accuracy * 100,
      size: Math.max(24, feature.health.lift * 240),
      name: feature.name,
      health: 4,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={feature.name}
        subtitle={`工坊入口 · 查看特征详情 · ${feature.description}`}
        moduleTone="foundry"
        action={<HealthBadge level={feature.health.level} score={feature.health.score} />}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">准确率</div>
          <div className="mt-1 text-2xl font-semibold text-text-1">{(accuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">覆盖率</div>
          <div className="mt-1 text-2xl font-semibold text-text-1">{(coverage * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">增益</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">+{(feature.health.lift * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-4 text-lg font-semibold text-text-1">分布四象限</div>
          <Quadrant data={quadrantData} />
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-4 text-lg font-semibold text-text-1">近 10 天趋势</div>
          <div className="space-y-2">
            {feature.trend_30d.map((item) => (
              <div key={item.date} className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                <span className="text-text-3">{item.date}</span>
                <span className="text-text-1">准确率 {(item.accuracy * 100).toFixed(1)}%</span>
                <span className="text-text-1">覆盖率 {(item.coverage * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-card border border-border bg-surface p-6">
        <div className="mb-4 text-lg font-semibold text-text-1">血缘关系</div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-medium text-text-3">上游依赖</div>
            <div className="space-y-2">
              {feature.lineage.upstream.map((item) => (
                <div key={item} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-1">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-sm font-medium text-text-3">下游使用</div>
            <div className="space-y-2">
              {feature.lineage.downstream.map((item) => (
                <Link
                  key={item}
                  to={item.startsWith('pack_') ? `/factory/result/${item}` : `/marketplace/crowd/${item}`}
                  className="block rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-1 transition-colors hover:border-[#7B5BF5]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
