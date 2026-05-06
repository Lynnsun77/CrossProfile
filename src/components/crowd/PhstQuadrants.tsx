import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { CrowdDetail } from '../../types';

interface PhstQuadrantsProps {
  detail: CrowdDetail;
  className?: string;
}

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

function getHeatColor(value: number) {
  if (value >= 0.7) {
    return '#4E7BFF';
  }
  if (value >= 0.58) {
    return '#7FA0FF';
  }
  if (value >= 0.46) {
    return '#B7C8FF';
  }
  if (value >= 0.34) {
    return '#DCE5FF';
  }
  return '#EEF3FF';
}

function formatActivity(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function PhstQuadrants({ detail, className = '' }: PhstQuadrantsProps) {
  const [timeExpanded, setTimeExpanded] = useState(false);
  const staticQuadrants = useMemo(
    () => detail.quadrants.filter((item) => item.key !== 'time'),
    [detail.quadrants],
  );
  const timeQuadrant = useMemo(
    () => detail.quadrants.find((item) => item.key === 'time'),
    [detail.quadrants],
  );

  const toggleTime = () => {
    const nextValue = !timeExpanded;
    setTimeExpanded(nextValue);
    track('crowd_phst_time_toggle', { crowdId: detail.id, expanded: nextValue });
  };

  return (
    <section className={`rounded-[24px] border border-border bg-surface p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="market">P-H-S-T 四象限</Badge>
            <Badge tone="feature">时空热力折叠</Badge>
          </div>
          <h3 className="text-lg font-semibold text-text-1">从人、货、场、时快速理解资产结构</h3>
          <p className="mt-1 text-sm text-text-3">“时”象限默认收起，展开后展示 7x24 活跃热力。</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {staticQuadrants.map((quadrant) => (
          <article
            key={quadrant.key}
            className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-module-market/10 text-sm font-semibold text-module-market">
                {quadrant.title}
              </div>
              <div className="text-xs text-text-3">象限概览</div>
            </div>

            <div className="text-base font-semibold text-text-1">{quadrant.summary}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quadrant.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {timeQuadrant ? (
        <div className="mt-4 rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-module-market/10 text-sm font-semibold text-module-market">
                  {timeQuadrant.title}
                </div>
                <div>
                  <div className="text-base font-semibold text-text-1">时段分布</div>
                  <div className="mt-1 text-sm text-text-3">{timeQuadrant.summary}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {timeQuadrant.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTime}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
            >
              {timeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {timeExpanded ? '收起热力图' : '展开热力图'}
            </button>
          </div>

          {timeExpanded ? (
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[80px_repeat(24,minmax(24px,1fr))] gap-1">
                  <div />
                  {detail.timeHeatmap.hours.map((hour) => (
                    <div
                      key={`hour-${hour}`}
                      className="flex h-7 items-center justify-center text-[11px] text-text-3"
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                <div className="mt-1 space-y-1">
                  {detail.timeHeatmap.days.map((day, rowIndex) => (
                    <div
                      key={day}
                      className="grid grid-cols-[80px_repeat(24,minmax(24px,1fr))] gap-1"
                    >
                      <div className="flex h-8 items-center text-xs font-medium text-text-2">{day}</div>
                      {detail.timeHeatmap.values[rowIndex].map((value, colIndex) => (
                        <div
                          key={`${day}-${colIndex}`}
                          title={`${day} ${detail.timeHeatmap.hours[colIndex]}:00 活跃度 ${formatActivity(value)}`}
                          className="h-8 rounded-md border border-white/60"
                          style={{ backgroundColor: getHeatColor(value) }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-3">
                  <span>活跃度低</span>
                  <div className="flex items-center gap-1">
                    {[0.28, 0.4, 0.52, 0.64, 0.76].map((value) => (
                      <span
                        key={value}
                        className="h-3 w-8 rounded-sm"
                        style={{ backgroundColor: getHeatColor(value) }}
                      />
                    ))}
                  </div>
                  <span>活跃度高</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-text-3">
              展开后可查看 7x24 活跃热力，帮助快速判断最佳触达时段。
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
