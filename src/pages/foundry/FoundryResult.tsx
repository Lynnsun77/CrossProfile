import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { getPackById, mockPacks } from '../../mock';

export function FoundryResult() {
  const { packId } = useParams<{ packId: string }>();
  const selectedPack = getPackById(packId || mockPacks[0].id);

  useBreadcrumb([
    { label: '工坊', to: '/factory' },
    { label: '特征包结果' },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="特征包结果" subtitle="AUC / Lift / KS 对比" moduleTone="foundry" />

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {mockPacks.map((pack) => (
          <Link
            key={pack.id}
            to={`/factory/result/${pack.id}`}
            className={`rounded-card border p-5 transition-all ${
              selectedPack.id === pack.id ? 'border-[#7B5BF5] bg-[#7B5BF5]/10' : 'border-border bg-surface'
            }`}
          >
            <div className="text-lg font-semibold text-text-1">{pack.name}</div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-text-3">AUC</div>
                <div className="font-semibold text-text-1">{pack.auc}</div>
              </div>
              <div>
                <div className="text-text-3">Lift</div>
                <div className="font-semibold text-emerald-600">+{((pack.lift ?? 0) * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-text-3">KS</div>
                <div className="font-semibold text-text-1">{pack.ks}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-1">{selectedPack.name}</h2>
          <Link to={`/factory/export/${selectedPack.id}`} className="rounded-lg bg-[#7B5BF5] px-4 py-2 text-sm font-medium text-white">
            A/B 导出 JSON
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-lg font-medium text-text-1">A/B 历史</div>
            <div className="space-y-3">
              {selectedPack.ab_history.map((item) => (
                <div key={item.ab_name} className="rounded-lg border border-border bg-bg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-1">{item.ab_name}</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {item.result > 0 ? '+' : ''}
                      {(item.result * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-text-3">
                    {item.metric} / {item.adopted ? '已采用' : '待观察'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-lg font-medium text-text-1">特征明细</div>
            <div className="space-y-2">
              {selectedPack.feature_ids.map((featureId) => (
                <Link
                  key={featureId}
                  to={`/factory/feature/${featureId}`}
                  className="block rounded-lg border border-border bg-bg p-3 text-sm text-text-1 transition-colors hover:border-[#7B5BF5]"
                >
                  {featureId}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
