import { AgentTraceTimeline } from '../../../components/common/AgentTraceTimeline';
import type { ThinkingStep } from '../types';

function formatMmSs(ms?: number) {
  const value = Math.max(0, ms ?? 0);
  const sec = Math.floor(value / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `[${mm}:${ss}]`;
}

export function ThinkingPanel({ steps }: { steps: ThinkingStep[] }) {
  return (
    <section
      aria-label="Agent 思考链路区块"
      className="rounded-2xl border px-4 py-4 md:px-5"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--market-shadow-card)',
      }}
    >
      {steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-text-3" style={{ borderColor: 'var(--color-border)' }}>
          发送需求后，这里会展示脱敏后的 Agent 思考链路与节点状态。
        </div>
      ) : (
        <AgentTraceTimeline
          title="Agent 思考链路"
          steps={steps.map((step) => ({
            id: step.id,
            type: 'tool' as const,
            content: step.description ?? step.detail ?? '',
            toolName: formatMmSs(step.timestampMs),
            toolBody: `${step.label ?? step.title ?? step.id}${step.description || step.detail ? ` · ${step.description ?? step.detail}` : ''}`,
            status: step.status === 'running' ? 'loading' : step.status === 'done' ? 'done' : undefined,
          }))}
        />
      )}
    </section>
  );
}
