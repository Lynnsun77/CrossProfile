import { EmptyState } from './EmptyState';
import type { AssetDetailStabilityPoint } from '../types';

interface StabilityCurveProps {
  points?: AssetDetailStabilityPoint[];
  loading?: boolean;
  error?: string | null;
}

export function StabilityCurve({ points, loading, error }: StabilityCurveProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="稳定性曲线加载失败" description={error} />;
  }
  if (!points?.length) {
    return <EmptyState title="暂无稳定性曲线" />;
  }

  const width = 640;
  const height = 220;
  const minScore = Math.min(...points.map((point) => Math.min(point.score, point.baseline))) - 4;
  const maxScore = Math.max(...points.map((point) => Math.max(point.score, point.baseline))) + 4;
  const mapX = (index: number) => 40 + (index * (width - 80)) / Math.max(points.length - 1, 1);
  const mapY = (value: number) => height - 30 - ((value - minScore) / Math.max(maxScore - minScore, 1)) * (height - 60);
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${mapX(index)} ${mapY(point.score)}`).join(' ');
  const baselinePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${mapX(index)} ${mapY(point.baseline)}`).join(' ');

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">稳定性曲线</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full overflow-visible">
        <path d={baselinePath} fill="none" stroke="var(--color-text-3)" strokeDasharray="4 4" strokeWidth="2" />
        <path d={linePath} fill="none" stroke="var(--market-brand)" strokeWidth="3" />
        {points.map((point, index) => (
          <g key={point.date}>
            <circle cx={mapX(index)} cy={mapY(point.score)} r="4" fill="var(--market-brand)" />
            <text x={mapX(index)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--color-text-2)">{point.date}</text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-3">
        <span>实线: 实际稳定性</span>
        <span>虚线: 基线</span>
      </div>
    </div>
  );
}
