import { Badge } from '../../../components/common/Badge';
import { MetricDelta } from '../../../components/common/MetricDelta';
import { formatCurrency, formatLargeNumber } from '../../../lib/format';
import type { CrowdDetail, CrowdRevenuePoint, CrowdSceneCard } from '../../../types';

type ConsumerMatrixProps = {
  detail: CrowdDetail;
  id?: string;
  indexLabel?: string;
  title?: string;
  className?: string;
};

type Point = {
  x: number;
  y: number;
};

const SCENE_STATUS_META: Record<
  CrowdSceneCard['status'],
  { label: string; className: string }
> = {
  recommended: {
    label: '推荐',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  review: {
    label: '需评审',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  blocked: {
    label: '受限',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};

const CONSUMER_STATUS_META = {
  active: {
    label: '生效中',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  paused: {
    label: '已暂停',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
} as const;

const RANK_GRADIENTS = [
  'linear-gradient(135deg,#FFD66B,#F59E0B)',
  'linear-gradient(135deg,#DCE3EE,#9AA4B2)',
  'linear-gradient(135deg,#E9B892,#C97B3B)',
];

function formatRoi(value: number) {
  return `${value.toFixed(2)}x`;
}

function formatShortDate(date: string) {
  return date.slice(5).replace('-', '/');
}

function formatDelta(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function scaleValue(value: number, min: number, max: number, top: number, bottom: number) {
  if (max === min) {
    return (top + bottom) / 2;
  }

  const ratio = (value - min) / (max - min);
  return bottom - ratio * (bottom - top);
}

function buildChartPoints(
  points: CrowdRevenuePoint[],
  values: number[],
  width: number,
  top: number,
  bottom: number,
  min: number,
  max: number,
) {
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  return values.map((value, index) => ({
    x: stepX * index,
    y: scaleValue(value, min, max, top, bottom),
  }));
}

function toPolyline(points: Point[], offsetX: number) {
  return points.map((point) => `${point.x + offsetX},${point.y}`).join(' ');
}

function toAreaPath(points: Point[], offsetX: number, baseline: number) {
  if (points.length === 0) {
    return '';
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x + offsetX} ${point.y}`)
    .join(' ');

  return `${linePath} L ${lastPoint.x + offsetX} ${baseline} L ${firstPoint.x + offsetX} ${baseline} Z`;
}

function createTicks(min: number, max: number, count: number) {
  if (count <= 1) {
    return [max];
  }

  return Array.from({ length: count }, (_, index) => max - ((max - min) / (count - 1)) * index);
}

function RevenueTimeline({
  timeline,
  estimatedRevenue,
}: {
  timeline: CrowdRevenuePoint[];
  estimatedRevenue: number;
}) {
  const chartWidth = 720;
  const chartHeight = 280;
  const padding = { top: 20, right: 20, bottom: 34, left: 20 };
  const width = chartWidth - padding.left - padding.right;
  const top = padding.top;
  const bottom = chartHeight - padding.bottom;

  const gmvValues = timeline.map((item) => item.gmv);
  const roiValues = timeline.map((item) => item.roi);

  const gmvMin = Math.min(...gmvValues);
  const gmvMax = Math.max(...gmvValues);
  const roiMin = Math.min(...roiValues);
  const roiMax = Math.max(...roiValues);

  const gmvPad = Math.max(6000, (gmvMax - gmvMin) * 0.12);
  const roiPad = Math.max(0.08, (roiMax - roiMin) * 0.2);

  const normalizedGmvMin = gmvMin - gmvPad;
  const normalizedGmvMax = gmvMax + gmvPad;
  const normalizedRoiMin = Math.max(0, roiMin - roiPad);
  const normalizedRoiMax = roiMax + roiPad;

  const gmvPoints = buildChartPoints(
    timeline,
    gmvValues,
    width,
    top,
    bottom,
    normalizedGmvMin,
    normalizedGmvMax,
  );
  const roiPoints = buildChartPoints(
    timeline,
    roiValues,
    width,
    top,
    bottom,
    normalizedRoiMin,
    normalizedRoiMax,
  );

  const gmvPath = toPolyline(gmvPoints, padding.left);
  const roiPath = toPolyline(roiPoints, padding.left);
  const gmvAreaPath = toAreaPath(gmvPoints, padding.left, bottom);

  const tickIndices = Array.from(new Set([0, 29, 59, timeline.length - 1])).filter(
    (index) => index >= 0 && index < timeline.length,
  );
  const gridValues = createTicks(normalizedGmvMin, normalizedGmvMax, 4);
  const totalGmv = timeline.reduce((sum, item) => sum + item.gmv, 0);
  const avgRoi = timeline.reduce((sum, item) => sum + item.roi, 0) / timeline.length;
  const latestPoint = timeline[timeline.length - 1];
  const weeklyBaseline = timeline[Math.max(0, timeline.length - 8)];
  const weeklyDelta = weeklyBaseline
    ? ((latestPoint.gmv - weeklyBaseline.gmv) / weeklyBaseline.gmv) * 100
    : 0;
  const targetCompletion = estimatedRevenue > 0 ? (totalGmv / estimatedRevenue) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-base font-semibold text-text-1">90 天收益时间线</div>
          <p className="mt-1 text-sm text-text-3">
            以 GMV 为主轴、ROI 为辅轴观察近 90 天收益质量和投放波动。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-bg px-3 py-2">
            <div className="text-xs text-text-3">累计 GMV</div>
            <div className="mt-1 text-sm font-semibold text-text-1">{formatCurrency(totalGmv)}</div>
          </div>
          <div className="rounded-xl bg-bg px-3 py-2">
            <div className="text-xs text-text-3">平均 ROI</div>
            <div className="mt-1 text-sm font-semibold text-text-1">{formatRoi(avgRoi)}</div>
          </div>
          <div className="rounded-xl bg-bg px-3 py-2">
            <div className="text-xs text-text-3">近 7 天 GMV</div>
            <div className="mt-1">
              <MetricDelta value={formatDelta(weeklyDelta)} expected="up" />
            </div>
          </div>
          <div className="rounded-xl bg-bg px-3 py-2">
            <div className="text-xs text-text-3">对比预估收益</div>
            <div className="mt-1 text-sm font-semibold text-text-1">
              {targetCompletion.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-module-market/10 bg-[linear-gradient(180deg,rgba(78,123,255,0.06),rgba(78,123,255,0.01))]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[280px] w-full">
          <defs>
            <linearGradient id="consumer-matrix-gmv-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4E7BFF" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4E7BFF" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y = scaleValue(value, normalizedGmvMin, normalizedGmvMax, top, bottom);
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={chartWidth - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#E5E8F0"
                  strokeDasharray="4 6"
                />
                <text x={padding.left} y={y - 6} fontSize="11" fill="#8A94A6">
                  {formatLargeNumber(Math.round(value))}
                </text>
              </g>
            );
          })}

          <path d={gmvAreaPath} fill="url(#consumer-matrix-gmv-fill)" />
          <polyline
            fill="none"
            points={gmvPath}
            stroke="#4E7BFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            fill="none"
            points={roiPath}
            stroke="#8B5CF6"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {timeline.length > 0 ? (
            <>
              <circle
                cx={padding.left + gmvPoints[gmvPoints.length - 1].x}
                cy={gmvPoints[gmvPoints.length - 1].y}
                r="5"
                fill="#4E7BFF"
              />
              <circle
                cx={padding.left + roiPoints[roiPoints.length - 1].x}
                cy={roiPoints[roiPoints.length - 1].y}
                r="4"
                fill="#8B5CF6"
              />
            </>
          ) : null}

          {tickIndices.map((index) => {
            const x = padding.left + (timeline.length > 1 ? (width / (timeline.length - 1)) * index : 0);
            return (
              <g key={`${timeline[index].date}-${index}`}>
                <line x1={x} x2={x} y1={bottom} y2={bottom + 6} stroke="#CBD5E1" />
                <text x={x} y={chartHeight - 10} textAnchor="middle" fontSize="11" fill="#8A94A6">
                  {formatShortDate(timeline[index].date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-3">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-module-market" />
          GMV 主线
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-module-workshop" />
          ROI 辅线
        </span>
        <span>最新 GMV {formatCurrency(latestPoint.gmv)}</span>
        <span>最新 ROI {formatRoi(latestPoint.roi)}</span>
      </div>
    </div>
  );
}

export function ConsumerMatrix({
  detail,
  id = 'module-2',
  indexLabel = '②',
  title = '谁在消费它',
  className = '',
}: ConsumerMatrixProps) {
  const activeCount = detail.consumers.rows.filter((item) => item.status === 'active').length;
  const totalMatrixGmv = detail.consumers.rows.reduce((sum, item) => sum + item.gmv, 0);
  const bestRoi = detail.consumers.rows.reduce(
    (best, item) => (item.roi > best ? item.roi : best),
    0,
  );
  const topScenes = detail.topScenes.slice(0, 3);

  return (
    <section
      id={id}
      className={`scroll-mt-32 rounded-card border border-border bg-surface p-6 shadow-sm ${className}`.trim()}
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-module-market/10 text-sm font-semibold text-module-market">
          {indexLabel}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-text-1">{title}</h2>
            <Badge tone="market">消费视角</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-text-3">
            统一呈现消费矩阵、Top3 场景卡和 90 天收益趋势，帮助快速判断当前人群被谁消费、在哪些场景更有效。
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm text-text-3">消费方数量</div>
          <div className="mt-2 text-2xl font-semibold text-text-1">
            {detail.consumers.rows.length}
          </div>
          <div className="mt-2 text-xs text-text-3">其中 {activeCount} 个处于生效中</div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm text-text-3">矩阵累计 GMV</div>
          <div className="mt-2 text-2xl font-semibold text-text-1">
            {formatCurrency(totalMatrixGmv)}
          </div>
          <div className="mt-2 text-xs text-text-3">
            对应整体规模 {formatLargeNumber(detail.scale)}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm text-text-3">矩阵最高 ROI</div>
          <div className="mt-2 text-2xl font-semibold text-text-1">{formatRoi(bestRoi)}</div>
          <div className="mt-2 text-xs text-text-3">用于快速判断最优消费承接位</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-text-1">消费矩阵</div>
              <p className="mt-1 text-sm text-text-3">
                横向对比消费方、投放渠道、收益表现与当前状态。
              </p>
            </div>
            <Badge tone="market">{detail.consumers.columns.length} 列</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {detail.consumers.columns.slice(0, 4).map((column, index) => (
                    <th
                      key={`${column}-${index}`}
                      className="border-b border-border px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-text-3"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.consumers.rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="border-b border-border/70 px-4 py-4">
                      <div className="font-medium text-text-1">{row.consumer}</div>
                      {row.note ? <div className="mt-1 text-xs text-text-3">{row.note}</div> : null}
                    </td>
                    <td className="border-b border-border/70 px-4 py-4">
                      <div className="text-text-1">{row.channel}</div>
                    </td>
                    <td className="border-b border-border/70 px-4 py-4">
                      <div className="font-medium text-text-1">{formatCurrency(row.gmv)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-text-3">ROI {formatRoi(row.roi)}</span>
                        {row.ctrDelta !== null ? (
                          <MetricDelta value={formatDelta(row.ctrDelta)} expected="up" />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            CTR 未回传
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-border/70 px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${CONSUMER_STATUS_META[row.status].className}`}
                      >
                        {CONSUMER_STATUS_META[row.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-text-1">Top3 场景卡</div>
                <p className="mt-1 text-sm text-text-3">
                  优先展示当前最值得承接的人群消费场景。
                </p>
              </div>
              <Badge tone="market">{topScenes.length} 张</Badge>
            </div>

            <div className="space-y-3">
              {topScenes.map((scene, index) => (
                <article
                  key={scene.id}
                  className="relative overflow-hidden rounded-2xl border border-border bg-bg px-4 py-4"
                >
                  <div
                    className="absolute left-0 top-0 h-full w-1"
                    style={{ background: RANK_GRADIENTS[index] ?? RANK_GRADIENTS[2] }}
                  />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: RANK_GRADIENTS[index] ?? RANK_GRADIENTS[2] }}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-text-1">{scene.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-text-2">{scene.summary}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${SCENE_STATUS_META[scene.status].className}`}
                    >
                      {SCENE_STATUS_META[scene.status].label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 pl-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-white px-3 py-3">
                      <div className="text-xs text-text-3">承接渠道</div>
                      <div className="mt-1 text-sm font-medium text-text-1">{scene.channel}</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3">
                      <div className="text-xs text-text-3">预估 GMV</div>
                      <div className="mt-1 text-sm font-medium text-text-1">
                        {formatCurrency(scene.expectedGmv)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3">
                      <div className="text-xs text-text-3">场景 ROI</div>
                      <div className="mt-1 text-sm font-medium text-text-1">{formatRoi(scene.roi)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <RevenueTimeline
            timeline={detail.revenueTimeline90d}
            estimatedRevenue={detail.estimatedRevenue}
          />
        </div>
      </div>
    </section>
  );
}
