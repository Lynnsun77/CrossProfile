import { Loader2 } from 'lucide-react';
import { useRecommendStore } from '../store/useRecommendStore';
import { DEFAULT_CHAIN_NODE_LIMIT } from '../types';

const PHASE_LABEL = {
  parse: 'Step 1 · 需求解析',
  recommend: 'Step 2 · 双轨推荐',
  gap: 'Step 3 · 缺口识别',
} as const;

interface ThinkingStreamProps {
  onRetry?: () => void;
}

export function ThinkingStream({ onRetry }: ThinkingStreamProps) {
  const thinking = useRecommendStore((s) => s.thinking);
  const phase = useRecommendStore((s) => s.phase);
  const thinkingTask = useRecommendStore((s) => s.thinkingTask);
  const resetRecommend = useRecommendStore((s) => s.resetRecommend);

  const status = thinkingTask?.status ?? null;
  const showLoading = status === 'pending' || status === 'running';
  const showTimeout = status === 'timeout';
  const showDone = status === 'success';

  if (thinking.length === 0 && !thinkingTask) return null;

  const groups = (['parse', 'recommend', 'gap'] as const)
    .map((item) => ({ phase: item, items: thinking.filter((event) => event.phase === item) }))
    .filter((group) => group.items.length > 0);

  const totalNodes = thinkingTask?.nodes.length
    ? thinkingTask.nodes.length
    : DEFAULT_CHAIN_NODE_LIMIT;
  const doneNodes = thinkingTask?.nodes.filter((node) => node.status === 'done').length ?? 0;

  const handleRetry = () => {
    resetRecommend();
    onRetry?.();
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gradient-to-b from-indigo-50/40 to-white p-4">
      {showLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>收到你的需求，正在思考中...</span>
        </div>
      ) : null}

      {(showLoading || showDone) && thinkingTask ? (
        <div className="text-xs text-gray-500">
          ✓ 已完成 {doneNodes}/{totalNodes}
        </div>
      ) : null}

      {showTimeout ? (
        <div className="flex items-center gap-3 text-sm text-amber-600">
          <span>思考超时，请重试</span>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs text-amber-700 hover:bg-amber-50"
          >
            重试
          </button>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.phase}>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <span aria-hidden>✨</span>
            {PHASE_LABEL[group.phase]}
            {phase === group.phase ? <span className="animate-pulse text-xs text-gray-400">· 分析中…</span> : null}
          </div>
          <ul className="space-y-1 border-l border-indigo-200 pl-4 text-[13px]">
            {group.items.map((event) => (
              <li key={event.id} className="flex items-start gap-2">
                <span className="shrink-0 font-mono text-gray-400">[{String(Math.floor(event.t / 1000)).padStart(2, '0')}s]</span>
                <span className={`shrink-0 font-mono ${event.status === 'failed' ? 'text-amber-600' : 'text-emerald-600'}`}>{event.node}</span>
                <span className="text-gray-700">{event.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
