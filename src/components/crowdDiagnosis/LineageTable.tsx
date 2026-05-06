import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { CrowdLineageNode } from '../../types';

interface LineageTableProps {
  lineage: CrowdLineageNode[];
  title?: string;
  subtitle?: string;
  foundryPath?: string;
}

function normalizeFoundryPath(foundryPath?: string) {
  if (!foundryPath) {
    return '/factory';
  }

  if (foundryPath.startsWith('/factory')) {
    return foundryPath;
  }

  return '/factory';
}

function formatRatio(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function getMetricTone(value: number) {
  if (value >= 0.92) {
    return 'text-emerald-700 bg-emerald-50';
  }
  if (value >= 0.85) {
    return 'text-amber-700 bg-amber-50';
  }
  return 'text-rose-700 bg-rose-50';
}

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

export function LineageTable({
  lineage,
  title = '血缘表',
  subtitle = '只读查看规则依赖的数据表、字段与上游来源，保留前往工坊的入口。',
  foundryPath,
}: LineageTableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text-1">{title}</h3>
            <Badge tone="foundry">只读</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-2">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="market">{lineage.length} 张来源表</Badge>
          <button
            type="button"
            onClick={() => {
              const nextExpanded = !expanded;
              setExpanded(nextExpanded);
              track('crowd_lineage_toggle', {
                expanded: nextExpanded,
                foundryPath: normalizeFoundryPath(foundryPath),
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/20 hover:text-module-market"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? '收起血缘表' : '展开血缘表'}
          </button>
          <Link
            to={normalizeFoundryPath(foundryPath)}
            className="inline-flex items-center rounded-lg border border-module-workshop/20 bg-module-workshop/10 px-4 py-2 text-sm font-medium text-module-workshop transition hover:bg-module-workshop/15"
          >
            去工坊查看特征
          </Link>
        </div>
      </div>

      {!expanded ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
          展开后可查看规则依赖的数据表、字段与上游来源，当前保持只读浏览。
        </div>
      ) : lineage.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
          暂无血缘数据。
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-bg">
              <tr className="text-xs uppercase tracking-wide text-text-3">
                <th className="px-4 py-3 font-medium">来源表</th>
                <th className="px-4 py-3 font-medium">说明</th>
                <th className="px-4 py-3 font-medium">字段</th>
                <th className="px-4 py-3 font-medium">上游依赖</th>
                <th className="px-4 py-3 font-medium">质量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineage.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-text-1">{item.table}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs text-sm leading-6 text-text-2">{item.description}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex max-w-sm flex-wrap gap-2">
                      {item.fields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs text-text-2"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex max-w-sm flex-wrap gap-2">
                      {item.upstream.map((upstream) => (
                        <span
                          key={upstream}
                          className="rounded-full border border-module-workshop/15 bg-module-workshop/5 px-2.5 py-1 text-xs text-module-workshop"
                        >
                          {upstream}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2 text-sm text-text-2">
                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getMetricTone(item.confidence)}`}
                      >
                        置信度 {formatRatio(item.confidence)}
                      </div>
                      <div
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getMetricTone(item.coverage)}`}
                      >
                        覆盖率 {formatRatio(item.coverage)}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
