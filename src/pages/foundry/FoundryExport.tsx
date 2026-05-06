import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { getPackById } from '../../mock';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FoundryExport() {
  const { packId } = useParams<{ packId: string }>();
  const pack = getPackById(packId || 'pack_001');
  const [splitRate, setSplitRate] = useState(0.8);
  const [period, setPeriod] = useState(14);
  const [showSuccess, setShowSuccess] = useState(false);

  useBreadcrumb([
    { label: '工坊', to: '/factory' },
    { label: 'A/B 导出' },
  ]);

  const exportPayload = useMemo(
    () => ({
      packId: pack.id,
      name: pack.name,
      features: pack.feature_ids,
      metrics: {
        auc: pack.auc,
        lift: pack.lift,
        ks: pack.ks,
      },
      abConfig: {
        splitRate,
        period,
      },
    }),
    [pack, period, splitRate]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="A/B 导出" subtitle="导出合法 JSON 配置" moduleTone="foundry" />

      {showSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">JSON 已下载。</div>}

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border p-6">
          <div className="mb-4 text-lg font-semibold text-text-1">{pack.name}</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-text-2">
              分流比例
              <input
                type="number"
                value={splitRate}
                min={0.5}
                max={0.95}
                step={0.05}
                onChange={(event) => setSplitRate(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
              />
            </label>
            <label className="text-sm text-text-2">
              观测周期(天)
              <input
                type="number"
                value={period}
                min={7}
                max={60}
                onChange={(event) => setPeriod(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="border-b border-border p-6">
          <div className="mb-4 text-lg font-semibold text-text-1">JSON 预览</div>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-emerald-300">
            {JSON.stringify(exportPayload, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end gap-3 p-6">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2))}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-2"
          >
            复制
          </button>
          <button
            type="button"
            onClick={() => {
              downloadJson(`${pack.id}.json`, exportPayload);
              setShowSuccess(true);
              window.setTimeout(() => setShowSuccess(false), 1500);
            }}
            className="rounded-lg bg-[#7B5BF5] px-4 py-2 text-sm font-medium text-white"
          >
            下载 JSON
          </button>
        </div>
      </div>
    </div>
  );
}
