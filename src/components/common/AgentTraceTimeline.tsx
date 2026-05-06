import type { AgentToolStatus } from '../../types';

interface TraceStep {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  status?: AgentToolStatus;
  toolName?: string;
  toolBody?: string;
}

interface AgentTraceTimelineProps {
  steps: TraceStep[];
  title?: string;
  helperText?: string;
  secondaryAction?: React.ReactNode;
  onFullscreen?: () => void;
  onSaveRecipe?: () => void;
}

export function AgentTraceTimeline({ 
  steps, 
  title = 'Agent 思考链路',
  helperText,
  secondaryAction,
  onFullscreen,
  onSaveRecipe 
}: AgentTraceTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <div
      className="agent-trace relative rounded-xl border p-5"
      style={{
        borderColor: 'var(--market-accent-soft)',
        background: 'linear-gradient(to bottom, var(--market-accent-soft), transparent)',
        boxShadow: 'var(--market-accent-shadow-soft)',
      }}
    >
      {/* Header */}
      <div className="agent-trace__header flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-gradient">✨</span>
          <div>
            <div className="text-sm font-semibold text-text-1">{title}</div>
            {helperText ? <div className="mt-0.5 text-xs text-text-3">{helperText}</div> : null}
          </div>
        </div>
        <div className="agent-trace__actions flex items-center gap-3 text-xs">
          {secondaryAction}
          {onFullscreen && (
            <button 
              onClick={onFullscreen}
              className="transition-colors"
              style={{ color: 'var(--market-accent)' }}
            >
              全屏查看
            </button>
          )}
          {onSaveRecipe && (
            <button 
              onClick={onSaveRecipe}
              className="transition-colors"
              style={{ color: 'var(--market-accent)' }}
            >
              保存为 Recipe
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="trace-timeline relative pl-6">
        {/* 左侧品牌渐变竖线 */}
        <div 
          className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 rounded-full"
          style={{ 
            background: 'var(--brand-gradient)',
            opacity: 0.5 
          }} 
        />

        {/* Steps */}
        <div className="space-y-1">
          {steps.map((step, index) => {
            const isTool = step.type === 'tool';
            const isUser = step.type === 'user';
            const isAssistant = step.type === 'assistant';
            const status = step.status;
            const isLast = index === steps.length - 1;
            
            // 判断步骤状态
            let stepStatus: 'pending' | 'running' | 'done' = 'pending';
            if (status === 'done') stepStatus = 'done';
            else if (status === 'loading' || (isLast && isTool && !status)) stepStatus = 'running';

            return (
              <div 
                key={step.id}
                className={`trace-step relative -ml-2 grid items-center rounded-lg py-1.5 pl-2 pr-2 text-sm transition-all duration-160 ${
                  isTool ? 'cursor-pointer' : ''
                }`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--market-accent-soft)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                style={{ gridTemplateColumns: 'auto 1fr auto', columnGap: '10px' }}
              >
                {/* 状态圆点 */}
                <div 
                  className={`trace-step__dot absolute -left-[17px] top-2 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-300 ${
                    stepStatus === 'done' 
                      ? 'border-transparent bg-gradient-brand' 
                      : stepStatus === 'running'
                      ? 'animate-pulse'
                      : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: stepStatus === 'running' ? 'var(--market-accent)' : undefined,
                    boxShadow: stepStatus === 'running' ? '0 0 0 0 var(--market-accent-ring)' : undefined,
                    animation: stepStatus === 'running' ? 'pulse-ring 1.2s infinite' : undefined
                  }}
                >
                  {stepStatus === 'done' && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path 
                        d="M2 6L5 9L10 3" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Key/Label */}
                {isTool && (
                  <span
                    className="trace-step__key whitespace-nowrap rounded px-2 py-0.5 font-mono text-xs"
                    style={{ backgroundColor: 'var(--market-accent-soft)', color: 'var(--market-accent)' }}
                  >
                    {step.toolName}
                  </span>
                )}
                {isUser && (
                  <span
                    className="trace-step__key whitespace-nowrap rounded px-2 py-0.5 font-mono text-xs"
                    style={{ backgroundColor: 'var(--market-brand-soft)', color: 'var(--market-brand)' }}
                  >
                    用户
                  </span>
                )}
                {isAssistant && (
                  <span
                    className="trace-step__key whitespace-nowrap rounded px-2 py-0.5 font-mono text-xs"
                    style={{ backgroundColor: 'var(--market-accent-soft)', color: 'var(--market-accent)' }}
                  >
                    AI
                  </span>
                )}

                {/* Description */}
                <span className="trace-step__desc min-w-0 truncate text-text-2">
                  {isTool ? step.toolBody : step.content}
                </span>

                {/* Status Icon */}
                <span className="trace-step__status-icon flex-shrink-0">
                  {stepStatus === 'done' && (
                    <span className="text-emerald-500">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  {stepStatus === 'running' && (
                    <span className="inline-flex gap-0.5">
                      <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '0ms', backgroundColor: 'var(--market-accent)' }} />
                      <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '150ms', backgroundColor: 'var(--market-accent)' }} />
                      <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '300ms', backgroundColor: 'var(--market-accent)' }} />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyframes for pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 var(--market-accent-ring); }
          70% { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}
