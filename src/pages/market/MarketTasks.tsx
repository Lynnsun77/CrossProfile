import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { formatLargeNumber } from '../../lib/format';
import { mockDispatchTasks } from '../../mock';
import type { DispatchTask } from '../../types';

const statusMeta = {
  queued: { label: '排队中', dot: 'bg-slate-400' },
  running: { label: '执行中', dot: 'bg-amber-400 animate-pulse' },
  done: { label: '已完成', dot: 'bg-emerald-500' },
  completed: { label: '已完成', dot: 'bg-emerald-500' },
};

export function MarketTasks() {
  const [tasks, setTasks] = useState<DispatchTask[]>(mockDispatchTasks);
  const [expandedId, setExpandedId] = useState<string | null>(mockDispatchTasks[0]?.id ?? null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((current) =>
        current.map((task) => {
          if (task.status === 'queued') return { ...task, status: 'running' };
          if (task.status === 'running') {
            return {
              ...task,
              status: 'done',
              result: task.result ?? {
                gmv_lift: 0.021,
                mac_change: -0.058,
                cvr: 0.017,
              },
            };
          }
          return task;
        })
      );
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader title="任务列表" subtitle="Mock 下发状态流转" moduleTone="market" />

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="overflow-hidden rounded-card border border-border bg-surface">
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-bg"
            >
              <div className="flex items-center gap-4">
                <span className={`h-3 w-3 rounded-full ${statusMeta[task.status].dot}`} />
                <div>
                  <div className="font-medium text-text-1">{task.title}</div>
                  <div className="text-sm text-text-3">{task.created_at}</div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-xs text-text-3">人群规模</div>
                  <div className="text-sm font-medium text-text-1">{formatLargeNumber(task.crowd_size)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-3">状态</div>
                  <div className="text-sm font-medium text-text-1">{statusMeta[task.status].label}</div>
                </div>
              </div>
            </button>

            {expandedId === task.id && (
              <div className="border-t border-border bg-bg px-4 py-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {task.channels.map((channel) => (
                    <span key={channel} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-2">
                      {channel}
                    </span>
                  ))}
                </div>

                {task.result ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <div className="text-sm text-text-3">GMV 提升</div>
                      <div className="mt-1 text-xl font-semibold text-emerald-600">
                        +{((task.result.gmv_lift ?? 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <div className="text-sm text-text-3">MAC 变化</div>
                      <div className="mt-1 text-xl font-semibold text-brand-500">
                        {((task.result.mac_change ?? 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <div className="text-sm text-text-3">CVR</div>
                      <div className="mt-1 text-xl font-semibold text-[#7B5BF5]">
                        {((task.result.cvr ?? 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-3">任务执行中，实时效果将自动刷新。</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
