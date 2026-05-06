import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import type { CrowdDetail, CrowdDistributionGroup, CrowdSegmentItem } from '../../types';

interface DualSystemDistributionProps {
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

function formatRatio(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

function getBarTone(group: CrowdDistributionGroup) {
  return group.system === 'ecommerce'
    ? 'bg-module-market'
    : 'bg-module-workshop';
}

function getTgiTone(tgi: number) {
  if (tgi >= 130) {
    return 'text-emerald-600 bg-emerald-50';
  }
  if (tgi >= 100) {
    return 'text-amber-600 bg-amber-50';
  }
  return 'text-text-3 bg-bg';
}

function SegmentRow({
  detailId,
  group,
  segment,
}: {
  detailId: string;
  group: CrowdDistributionGroup;
  segment: CrowdSegmentItem;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleNavigate = () => {
    track('crowd_distribution_sample_click', {
      crowdId: detailId,
      system: group.system,
      segKey: segment.key,
      target: segment.samplePath,
    });
    navigate(segment.samplePath);
  };

  return (
    <div
      className="rounded-2xl border border-border bg-white px-4 py-4 transition hover:border-module-market/20 hover:shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-text-1">{segment.label}</div>
          <div className="mt-1 text-xs text-text-3">{segment.key}</div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTgiTone(segment.tgi)}`}>
          TGI {segment.tgi}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
          <div
            className={`h-full rounded-full ${getBarTone(group)}`}
            style={{ width: `${Math.max(segment.ratio * 100, 8)}%` }}
          />
        </div>
        <div className="w-12 text-right text-sm font-medium text-text-1">{formatRatio(segment.ratio)}</div>
      </div>

      <div
        className={`mt-3 overflow-hidden transition-all duration-200 ${
          hovered ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={handleNavigate}
          className="inline-flex items-center gap-1 text-sm font-medium text-module-market transition hover:opacity-80"
        >
          去 P2 看样本 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function DualSystemDistribution({
  detail,
  className = '',
}: DualSystemDistributionProps) {
  const groups = useMemo(() => detail.distributions, [detail.distributions]);

  return (
    <section className={`rounded-[24px] border border-border bg-surface p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="market">双体系分布</Badge>
            <Badge tone="feature">只读概览</Badge>
          </div>
          <h3 className="text-lg font-semibold text-text-1">电商 8 大人群与生服 5A 分布</h3>
          <p className="mt-1 text-sm text-text-3">hover 某个分布条后可下钻到 P2 样本页。</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">TGI ≥ 130 高偏好</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">100-129 接近均值</span>
          <span className="rounded-full bg-bg px-2.5 py-1 text-text-3">TGI &lt; 100 低于均值</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {groups.map((group) => (
          <div key={group.system} className="rounded-2xl border border-border bg-bg/60 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-text-1">{group.title}</div>
                <div className="mt-1 text-xs text-text-3">{group.segments.length} 个分层，只读预览</div>
              </div>
              <div
                className={`h-2.5 w-14 rounded-full ${
                  group.system === 'ecommerce' ? 'bg-module-market' : 'bg-module-workshop'
                }`}
              />
            </div>

            <div className="space-y-3">
              {group.segments.map((segment) => (
                <SegmentRow
                  key={`${group.system}-${segment.key}`}
                  detailId={detail.id}
                  group={group}
                  segment={segment}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
