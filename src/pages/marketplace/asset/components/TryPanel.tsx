import { useMemo, useState } from 'react';
import { EmptyState } from './EmptyState';
import type { AssetDetailTryRunPreset, AssetDetailTryRunResult } from '../types';

interface TryPanelProps {
  presets?: AssetDetailTryRunPreset[];
  initialResult?: AssetDetailTryRunResult;
  loading?: boolean;
  error?: string | null;
}

function buildResult(preset: AssetDetailTryRunPreset): AssetDetailTryRunResult {
  return {
    selectedPresetId: preset.id,
    expectedReach: preset.expectedReach,
    expectedLift: preset.expectedLift,
    expectedRisk: preset.id === 'preset-reco' ? '稳定性波动需持续观测' : '风险可控',
    latencyMs: preset.id === 'preset-reco' ? 2180 : preset.id === 'preset-retention' ? 1960 : 1840,
  };
}

export function TryPanel({ presets, initialResult, loading, error }: TryPanelProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(initialResult?.selectedPresetId || presets?.[0]?.id || '');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(initialResult || null);

  const selectedPreset = useMemo(
    () => presets?.find((preset) => preset.id === selectedPresetId) || presets?.[0] || null,
    [presets, selectedPresetId],
  );

  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="试算面板加载失败" description={error} />;
  }
  if (!presets?.length) {
    return <EmptyState title="暂无试算 preset" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-1">Try-before-subscribe 试算</div>
        <span className="text-xs text-text-3">目标 &lt; 3s</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {presets.map((preset) => {
          const active = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              className={[
                'rounded-2xl border px-4 py-3 text-left transition',
                active ? 'border-module-market bg-module-market/5' : 'border-border bg-white hover:border-module-market/30',
              ].join(' ')}
            >
              <div className="text-sm font-medium text-text-1">{preset.label}</div>
              <div className="mt-1 text-xs text-text-3">{preset.scenario}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={running || !selectedPreset}
          onClick={() => {
            if (!selectedPreset) return;
            setRunning(true);
            window.setTimeout(() => {
              setResult(buildResult(selectedPreset));
              setRunning(false);
            }, 900);
          }}
        >
          {running ? '试算中...' : '运行试算'}
        </button>
      </div>
      {result ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">预估触达</div><div className="mt-1 text-lg font-semibold text-text-1">{result.expectedReach.toLocaleString()}</div></div>
          <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">预估提升</div><div className="mt-1 text-lg font-semibold text-emerald-600">+{(result.expectedLift * 100).toFixed(0)}%</div></div>
          <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">风险提示</div><div className="mt-1 text-sm font-medium text-text-1">{result.expectedRisk}</div></div>
          <div className="rounded-xl bg-bg px-4 py-3"><div className="text-xs text-text-3">响应时间</div><div className="mt-1 text-lg font-semibold text-text-1">{result.latencyMs}ms</div></div>
        </div>
      ) : null}
    </div>
  );
}
