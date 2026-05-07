import { useState } from 'react';
import { useRecommendStore, useIntentParsed } from '../store/useRecommendStore';
import { DEFAULT_CHAIN_NODE_LIMIT } from '../types';
import type { ChainNode } from '../types';

function StatusIndicator({ status }: { status: ChainNode['status'] }) {
  if (status === 'done') {
    return (
      <span
        aria-label="已完成"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
      >
        ✓
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span
        aria-label="进行中"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center gap-0.5"
      >
        <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
      </span>
    );
  }
  return (
    <span
      aria-label="待执行"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-3)' }}
    >
      ·
    </span>
  );
}

const CIRCLED_DIGITS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function circledOrder(order: number): string {
  if (order >= 1 && order <= CIRCLED_DIGITS.length) {
    return CIRCLED_DIGITS[order - 1];
  }
  return `(${order})`;
}

function chipStatusSymbol(status: ChainNode['status']): string {
  if (status === 'done') return '✓';
  if (status === 'running') return '⏳';
  return '';
}

const INTENT_CATEGORY_STYLES: Array<{
  key: 'goals' | 'scenes' | 'features';
  label: string;
  background: string;
  color: string;
  border: string;
}> = [
  {
    key: 'goals',
    label: '目标',
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#4338ca',
    border: 'rgba(99, 102, 241, 0.32)',
  },
  {
    key: 'scenes',
    label: '场景',
    background: 'rgba(14, 165, 233, 0.12)',
    color: '#0369a1',
    border: 'rgba(14, 165, 233, 0.32)',
  },
  {
    key: 'features',
    label: '核心特征',
    background: 'rgba(245, 158, 11, 0.14)',
    color: '#b45309',
    border: 'rgba(245, 158, 11, 0.34)',
  },
];

export function RecommendChainPanel() {
  const thinkingTask = useRecommendStore((s) => s.thinkingTask);
  const intentParsed = useIntentParsed();
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  if (!thinkingTask) return null;
  const nodes = thinkingTask.nodes ?? [];
  const hasParsedEntities =
    intentParsed.goals.length > 0 ||
    intentParsed.scenes.length > 0 ||
    intentParsed.features.length > 0;
  if (
    nodes.length === 0 &&
    thinkingTask.status !== 'running' &&
    !hasParsedEntities
  ) {
    return null;
  }

  const total = nodes.length;
  const visibleNodes = expanded ? nodes : nodes.slice(0, DEFAULT_CHAIN_NODE_LIMIT);
  const chipNodes = nodes.slice(0, DEFAULT_CHAIN_NODE_LIMIT);

  const toggleLabel = collapsed
    ? total > DEFAULT_CHAIN_NODE_LIMIT
      ? `查看完整推荐链路 (${total})`
      : '查看完整推荐链路'
    : '收起';

  const handleToggle = () => {
    if (collapsed) {
      setCollapsed(false);
      setExpanded(true);
    } else {
      setCollapsed(true);
      setExpanded(false);
    }
  };

  return (
    <section
      aria-label="智能推荐链路"
      className="rounded-2xl border px-4 py-4 md:px-5"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--market-shadow-card)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: 'var(--color-text-1)' }}
        >
          <span aria-hidden>🧠</span>
          智能推荐链路
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-md px-2.5 py-1 text-xs transition-colors"
          style={{
            color: 'var(--market-brand, #4f46e5)',
            borderColor: 'var(--color-border)',
            border: '1px solid var(--color-border)',
          }}
          aria-expanded={!collapsed}
        >
          {toggleLabel}
        </button>
      </div>

      {collapsed ? (
        <>
          {hasParsedEntities ? (
            <div
              className="mt-2 flex flex-wrap items-center gap-2 text-xs"
              style={{ color: 'var(--color-text-2)' }}
            >
              <span style={{ color: 'var(--color-text-2)' }}>AI 已识别您的诉求：</span>
              {INTENT_CATEGORY_STYLES.map((cat) => {
                const items = intentParsed[cat.key];
                if (!items || items.length === 0) return null;
                return (
                  <span
                    key={cat.key}
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: cat.background,
                      color: cat.color,
                      borderColor: cat.border,
                    }}
                  >
                    {cat.label}: {items.join('、')}
                  </span>
                );
              })}
            </div>
          ) : null}
          {chipNodes.length > 0 ? (
            <div
              className={`${hasParsedEntities ? 'mt-2' : 'mt-2'} flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs`}
              style={{ color: 'var(--color-text-2)', maxHeight: 64 }}
            >
              {chipNodes.map((node, idx) => {
                const symbol = chipStatusSymbol(node.status);
                return (
                  <span key={node.id} className="flex items-center gap-1">
                    <span className="flex items-center gap-1">
                      <span aria-hidden>{circledOrder(node.order)}</span>
                      <span style={{ color: 'var(--color-text-1)' }}>{node.title}</span>
                      {symbol ? <span aria-hidden>{symbol}</span> : null}
                    </span>
                    {idx < chipNodes.length - 1 ? (
                      <span aria-hidden style={{ color: 'var(--color-text-3)' }}>
                        →
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="mt-1.5 text-xs" style={{ color: 'var(--color-text-3)' }}>
            仅展示脱敏后的业务节点，最多默认展示 {DEFAULT_CHAIN_NODE_LIMIT} 个
          </div>

          {visibleNodes.length === 0 ? (
            <div
              className="mt-3 rounded-xl border border-dashed px-4 py-5 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-3)' }}
            >
              正在初始化推荐链路…
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {visibleNodes.map((node) => {
                const isRunning = node.status === 'running';
                return (
                  <li
                    key={node.id}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                      isRunning ? 'ring-2' : ''
                    }`}
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      ...(isRunning
                        ? { boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.25)' }
                        : {}),
                    }}
                  >
                    <span
                      className="shrink-0 font-mono text-xs"
                      style={{ color: 'var(--color-text-3)' }}
                    >
                      #{node.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-1)' }}
                      >
                        {node.title}
                      </div>
                      {node.desc ? (
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: 'var(--color-text-2)' }}
                        >
                          {node.desc}
                        </div>
                      ) : null}
                    </div>
                    <StatusIndicator status={node.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
