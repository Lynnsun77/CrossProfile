import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import type { CrowdRuleNode, CrowdRuleViews } from '../../types';

type RuleViewMode = 'natural' | 'sql' | 'tree';

interface RuleCardProps {
  rule: CrowdRuleViews;
  title?: string;
  subtitle?: string;
  foundryLabel?: string;
}

const VIEW_OPTIONS: Array<{ key: RuleViewMode; label: string }> = [
  { key: 'natural', label: '自然语言' },
  { key: 'sql', label: 'SQL' },
  { key: 'tree', label: '规则树' },
];

function normalizeFoundryPath(foundryPath?: string) {
  if (!foundryPath) {
    return '/factory';
  }

  if (foundryPath.startsWith('/factory')) {
    return foundryPath;
  }

  return '/factory';
}

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

function countLeaves(node: CrowdRuleNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }

  return node.children.reduce((total, child) => total + countLeaves(child), 0);
}

function countGroups(node: CrowdRuleNode): number {
  if (!node.children || node.children.length === 0) {
    return 0;
  }

  return 1 + node.children.reduce((total, child) => total + countGroups(child), 0);
}

function RuleTreeNode({ node, depth = 0 }: { node: CrowdRuleNode; depth?: number }) {
  if (node.type === 'leaf') {
    return (
      <div
        className="rounded-2xl border border-border bg-white p-4"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="foundry">条件</Badge>
          {typeof node.contribution === 'number' ? (
            <Badge tone="market">贡献 {(node.contribution * 100).toFixed(0)}%</Badge>
          ) : null}
        </div>
        <div className="mt-3 text-sm font-medium text-text-1">{node.label}</div>
        <div className="mt-2 rounded-xl bg-bg px-3 py-2 text-xs text-text-2">
          {node.field} {node.comparator} {node.value}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-border bg-bg p-4"
      style={{ marginLeft: `${depth * 16}px` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="foundry">分组</Badge>
        {node.operator ? <Badge tone="market">{node.operator}</Badge> : null}
      </div>
      <div className="mt-3 text-sm font-semibold text-text-1">{node.label}</div>
      <div className="mt-4 space-y-3">
        {node.children?.map((child) => (
          <RuleTreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export function RuleCard({
  rule,
  title = '圈人规则',
  subtitle = '只读浏览规则定义，并保留进入工坊继续加工的入口。',
  foundryLabel = '前往工坊继续加工',
}: RuleCardProps) {
  const [activeView, setActiveView] = useState<RuleViewMode>('natural');

  const stats = useMemo(
    () => ({
      leafCount: countLeaves(rule.tree),
      groupCount: countGroups(rule.tree),
      foundryPath: normalizeFoundryPath(rule.foundryPath),
    }),
    [rule],
  );

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
          <Badge tone="market">{stats.groupCount} 个分组</Badge>
          <Badge tone="market">{stats.leafCount} 个条件</Badge>
          <Link
            to={stats.foundryPath}
            className="inline-flex items-center rounded-lg border border-module-workshop/20 bg-module-workshop/10 px-4 py-2 text-sm font-medium text-module-workshop transition hover:bg-module-workshop/15"
          >
            {foundryLabel}
          </Link>
        </div>
      </div>

      <div className="mt-5 inline-flex gap-1 rounded-xl border border-border bg-white p-1">
        {VIEW_OPTIONS.map((option) => {
          const active = option.key === activeView;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setActiveView(option.key);
                track('crowd_rule_view_switch', {
                  view: option.key,
                  foundryPath: stats.foundryPath,
                });
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-module-workshop text-white shadow-sm'
                  : 'text-text-2 hover:bg-bg hover:text-text-1'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {activeView === 'natural' ? (
        <div className="mt-5 rounded-2xl border border-border bg-white p-5">
          <div className="text-sm font-medium text-text-3">规则说明</div>
          <p className="mt-3 text-sm leading-7 text-text-1">{rule.naturalLanguage}</p>
        </div>
      ) : null}

      {activeView === 'sql' ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-slate-950">
          <div className="border-b border-slate-800 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-300">
            SQL Preview
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 text-slate-100">
            <code>{rule.sql}</code>
          </pre>
        </div>
      ) : null}

      {activeView === 'tree' ? (
        <div className="mt-5 space-y-3">
          <RuleTreeNode node={rule.tree} />
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-dashed border-module-workshop/20 bg-module-workshop/5 px-4 py-3 text-sm text-module-workshop">
        🔒 本页只读；如需修改条件请点击规则卡顶部「去 Foundry 修改」
      </div>
    </section>
  );
}
