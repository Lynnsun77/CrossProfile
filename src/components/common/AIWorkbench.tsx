import React, { useEffect, useRef, useState } from 'react';
import { AssistantAvatar } from './AssistantAvatar';
import { Loader2, Check } from 'lucide-react';

const sceneLabelMap = {
  local: '生服',
  ecom: '电商',
  cross: '跨域',
} as const;

type AgentPhase = 'idle' | 'sending' | 'thinking' | 'streaming_cards' | 'done';

export type ThinkingStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout' | null;

interface AIWorkbenchProps {
  onGoalsChange?: (goals: string[]) => void;
  onSearch?: (query: string) => void;
  selectedGoals?: string[];
  agentPhase?: AgentPhase;
  goalOptions?: Array<{ id: string; label: string }>;
  title?: string;
  placeholder?: string;
  clearLabel?: string;
  scene?: 'local' | 'ecom' | 'cross';
  onSceneChange?: (scene: 'local' | 'ecom' | 'cross') => void;
  role?: 'business' | 'algo';
  onRoleChange?: (role: 'business' | 'algo') => void;
  showPill?: boolean;
  pillText?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  submitLabel?: string;
  disabled?: boolean;
  thinkingStatus?: ThinkingStatus;
}

const metrics = [
  { id: 'gmv', label: 'GMV' },
  { id: 'mac', label: 'MAC' },
  { id: 'lt', label: 'LT' },
  { id: 'orders', label: '订单量' },
];

const roleOptions: Array<{ value: 'business' | 'algo'; label: string; icon: string }> = [
  { value: 'business', label: '业务运营', icon: '🎯' },
  { value: 'algo', label: '算法', icon: '✏️' },
];

export const AIWorkbench: React.FC<AIWorkbenchProps> = ({
  onGoalsChange,
  onSearch,
  selectedGoals = [],
  agentPhase = 'idle',
  goalOptions = metrics,
  title = '告诉我你的业务目标:',
  placeholder = '告诉我你的业务目标/你在找什么样的人',
  clearLabel = '清空',
  scene = 'cross',
  onSceneChange,
  role = 'business',
  onRoleChange,
  showPill = false,
  pillText = '',
  value,
  onValueChange,
  submitLabel,
  disabled = false,
  thinkingStatus = null,
}) => {
  const [innerQuery, setInnerQuery] = useState('');
  const debounceTimerRef = useRef<number | null>(null);
  const searchQuery = value ?? innerQuery;

  const updateQuery = (next: string) => {
    if (value == null) {
      setInnerQuery(next);
    }
    onValueChange?.(next);
  };

  useEffect(() => {
    const goalLabelMap = Object.fromEntries(goalOptions.map((opt) => [opt.id, opt.label]));
    if (selectedGoals.length > 0) {
      const goalLabels = selectedGoals.map((g) => goalLabelMap[g] || g);
      const goalLabelText = goalLabels.join('、');
      const sceneLabel = sceneLabelMap[scene];
      const nextAutoQuery = `帮我找能在 [${sceneLabel}] 提升 [${goalLabelText}] 的特征 / 人群 / 标签`;
      if (nextAutoQuery !== searchQuery) {
        updateQuery(nextAutoQuery);
      }
      return;
    }

    if (searchQuery.startsWith('帮我找能在 [')) {
      updateQuery('');
    }
  }, [goalOptions, scene, searchQuery, selectedGoals]);

  const handleMetricClick = (metricId: string) => {
    const newGoals = selectedGoals.includes(metricId) ? selectedGoals.filter((g) => g !== metricId) : [...selectedGoals, metricId];

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onGoalsChange?.(newGoals);
    }, 300);
  };

  const handleClearAll = () => {
    onGoalsChange?.([]);
  };

  const handleSend = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const isProcessing = agentPhase !== 'idle' && agentPhase !== 'done';
  const isDone = agentPhase === 'done';

  // 外部传入 submitLabel 时优先使用；否则根据 thinkingStatus 自动推导文案
  let effectiveSubmitLabel = submitLabel ?? '发送';
  if (submitLabel == null) {
    if (thinkingStatus === 'running' || thinkingStatus === 'pending') {
      effectiveSubmitLabel = '再次生成';
    } else if (thinkingStatus === 'failed') {
      effectiveSubmitLabel = '重试';
    }
  }

  // 思考中态允许点击（用于“再次生成”），其它处理态仍禁用
  const thinkingActive = thinkingStatus === 'running' || thinkingStatus === 'pending';
  const submitDisabled = disabled || !searchQuery.trim() || (isProcessing && !thinkingActive);

  return (
    <div
      className="rounded-2xl border p-5 md:p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--market-surface-muted) 100%)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--market-shadow-ai)',
      }}
    >
      {onRoleChange && (
        <div className="mb-5 inline-flex gap-0.5 rounded-xl p-1" style={{ backgroundColor: 'var(--market-accent-soft)' }}>
          {roleOptions.map((option) => {
            const active = option.value === role;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onRoleChange?.(option.value)}
                className="flex h-7 items-center gap-1.5 rounded-lg px-3.5 text-sm transition-all duration-160"
                style={
                  active
                    ? {
                        background: 'var(--brand-gradient)',
                        color: 'white',
                        boxShadow: 'var(--market-brand-shadow-sm)',
                      }
                    : { color: 'var(--color-text-2)' }
                }
              >
                <span className="text-sm">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center flex-wrap gap-3 min-w-0">
          <span className="whitespace-nowrap text-sm font-medium text-text-1">{title}</span>
          <div className="flex items-center flex-wrap gap-3">
            {goalOptions.map((metric) => {
              const isSelected = selectedGoals.includes(metric.id);
              return (
                <button
                  key={metric.id}
                  onClick={() => handleMetricClick(metric.id)}
                  aria-pressed={isSelected}
                  className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-160 hover:-translate-y-0.5"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--market-brand-soft)',
                          color: 'var(--market-brand)',
                          borderColor: 'var(--market-brand-border-active)',
                        }
                      : {
                          backgroundColor: 'white',
                          color: 'var(--color-text-2)',
                          borderColor: 'var(--color-border)',
                        }
                  }
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        </div>
        {selectedGoals.length > 0 && (
          <button
            onClick={handleClearAll}
            className="whitespace-nowrap text-sm transition-colors duration-160"
            style={{ color: 'var(--color-text-3)' }}
          >
            {clearLabel}
          </button>
        )}
      </div>

      <div className="mb-5 flex items-center flex-wrap gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-text-1">策略场景:</span>
        {(
          [
            { id: 'local' as const, label: '生服' },
            { id: 'ecom' as const, label: '电商' },
            { id: 'cross' as const, label: '跨域' },
          ] as const
        ).map((opt) => {
          const active = scene === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSceneChange?.(opt.id)}
              className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-160 hover:-translate-y-0.5"
              style={
                active
                  ? {
                      backgroundColor: 'var(--market-brand-soft)',
                      color: 'var(--market-brand)',
                      borderColor: 'var(--market-brand-border-active)',
                    }
                  : {
                      backgroundColor: 'white',
                      color: 'var(--color-text-2)',
                      borderColor: 'var(--color-border)',
                    }
              }
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-7 h-7 flex-shrink-0 mt-2.5">
          <AssistantAvatar size="small" />
        </div>

        <div className="flex-1 relative">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isProcessing}
              className="h-12 flex-1 rounded-xl border px-4 text-sm outline-none transition-all duration-160 disabled:opacity-70"
              style={{
                backgroundColor: 'var(--market-brand-softer)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-1)',
              }}
            />

            <button
              onClick={handleSend}
              disabled={submitDisabled}
              className="flex min-w-[96px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-all duration-160"
              style={
                submitDisabled
                  ? {
                      backgroundColor: 'var(--market-disabled-bg)',
                      color: 'var(--color-text-3)',
                    }
                  : {
                      background: 'var(--brand-gradient)',
                      color: 'white',
                    }
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{effectiveSubmitLabel}</span>
                </>
              ) : (
                <span>{effectiveSubmitLabel}</span>
              )}
            </button>
          </div>

          {showPill && pillText && (
            <div
              className="mt-2 inline-flex h-7 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all duration-300"
              style={
                isDone
                  ? {
                      backgroundColor: 'var(--market-semantic-positive-bg)',
                      color: 'var(--market-semantic-positive)',
                      borderColor: 'var(--market-semantic-positive-border)',
                    }
                  : {
                      backgroundColor: 'var(--market-brand-soft)',
                      color: 'var(--market-brand)',
                      borderColor: 'var(--market-brand-border-subtle)',
                    }
              }
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isDone ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{pillText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
