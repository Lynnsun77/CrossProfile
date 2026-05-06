import { useEffect, useMemo, useRef, useState } from 'react';
import { AssistantAvatar } from './AssistantAvatar';
import type { CrowdAssistantConfig, CrowdAssistantReply } from '../../types';

type PanelMessage =
  | {
      id: string;
      role: 'assistant' | 'user';
      content: string;
      chart?: false;
    }
  | {
      id: string;
      role: 'assistant' | 'user';
      content: string;
      chart: true;
    };

interface AiFloatingPanelProps {
  crowdName: string;
  assistant: CrowdAssistantConfig;
  detailId?: string;
  defaultOpen?: boolean;
}

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

function createMessageId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ChartPlaceholder({ crowdName }: { crowdName: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-module-market/15 bg-module-market/5 p-3">
      <div className="mb-2 text-xs font-medium text-module-market">对比图占位</div>
      <svg viewBox="0 0 280 120" className="h-[120px] w-full">
        <line x1="22" y1="14" x2="22" y2="100" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="22" y1="100" x2="258" y2="100" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="54" y="34" width="42" height="66" rx="8" fill="#2A6DF4" opacity="0.88" />
        <rect x="112" y="52" width="42" height="48" rx="8" fill="#7B5BF5" opacity="0.82" />
        <rect x="170" y="28" width="42" height="72" rx="8" fill="#1F8A70" opacity="0.82" />
        <text x="75" y="113" textAnchor="middle" fontSize="11" fill="#64748B">
          规模
        </text>
        <text x="133" y="113" textAnchor="middle" fontSize="11" fill="#64748B">
          置信度
        </text>
        <text x="191" y="113" textAnchor="middle" fontSize="11" fill="#64748B">
          生服结构
        </text>
      </svg>
      <div className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-text-3">
        当前为 SVG mock 图表占位，用于承接“{crowdName}”与参考人群的规模、置信度和生服结构对比。
      </div>
    </div>
  );
}

function findReplyByRule(question: string, replies: CrowdAssistantReply[]) {
  const normalizedQuestion = question.trim().toLowerCase();
  const exactMatched = replies.find((item) => item.question.trim().toLowerCase() === normalizedQuestion);

  if (exactMatched) {
    return exactMatched;
  }

  if (/差异|区别|对比/.test(question)) {
    return (
      replies.find((item) => item.chart || /差异|区别|对比/.test(item.question)) ?? {
        id: 'assistant-diff-fallback',
        question,
        answer:
          '从 mock 结论看，当前人群与 a_004 的差异主要集中在规模、画像置信度和生服结构分布，适合先看结构差异再决定是否调整圈选条件。',
        chart: true,
      }
    );
  }

  if (/收紧|缩到|缩至|200万|200 万|圈选条件/.test(question)) {
    return (
      replies.find((item) => /收紧|200 万|200万|圈选条件/.test(item.question)) ?? {
        id: 'assistant-tighten-fallback',
        question,
        answer: '建议增加 2 个高意图条件并抬高近 30 天活跃门槛，预计可将规模收敛到 200 万以内。',
      }
    );
  }

  if (/短信|合规|触达/.test(question)) {
    return (
      replies.find((item) => /短信/.test(item.question)) ?? {
        id: 'assistant-sms-fallback',
        question,
        answer: '建议先结合渠道权限、频控策略和内容分层结果再决定是否投短信，当前更适合作为辅助手段而非主渠道。',
      }
    );
  }

  return {
    id: 'assistant-default-fallback',
    question,
    answer: '已收到问题。当前组件仅接入关键词 mock 回复，你可以优先尝试“差异”“收紧到 200 万以内”或“短信”相关提问。',
  };
}

export function AiFloatingPanel({
  crowdName,
  assistant,
  detailId,
  defaultOpen = false,
}: AiFloatingPanelProps) {
  const quickPrompts = assistant.prompts.slice(0, 3);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const replyTimerRef = useRef<number>();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inputValue, setInputValue] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<PanelMessage[]>([
    {
      id: createMessageId('welcome'),
      role: 'assistant',
      content: `我是人群诊断助手，当前正在服务「${crowdName}」。你可以直接点击快捷提问，或输入差异、收紧条件、短信合规等问题。`,
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        id: createMessageId('welcome'),
        role: 'assistant',
        content: `我是人群诊断助手，当前正在服务「${crowdName}」。你可以直接点击快捷提问，或输入差异、收紧条件、短信合规等问题。`,
      },
    ]);
    setInputValue('');
    setIsReplying(false);
  }, [crowdName]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isReplying]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const panelTitle = useMemo(() => `${crowdName} AI 助手`, [crowdName]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    track(nextOpen ? 'crowd_ai_panel_open' : 'crowd_ai_panel_close', {
      detailId,
      crowdName,
    });
  };

  const appendAssistantReply = (question: string, source: 'quick_prompt' | 'input') => {
    const matchedReply = findReplyByRule(question, assistant.replies);
    const shouldShowChart = Boolean(matchedReply.chart || /差异|区别|对比/.test(question));

    setIsReplying(true);
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('assistant'),
          role: 'assistant',
          content: matchedReply.answer,
          chart: shouldShowChart,
        },
      ]);
      setIsReplying(false);
      track('crowd_ai_panel_reply', {
        detailId,
        crowdName,
        source,
        question,
        replyId: matchedReply.id,
        chart: shouldShowChart,
      });
    }, 360);
  };

  const handleAsk = (question: string, source: 'quick_prompt' | 'input') => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isReplying) {
      return;
    }

    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('user'),
        role: 'user',
        content: trimmedQuestion,
      },
    ]);

    if (source === 'input') {
      setInputValue('');
    }

    track(source === 'quick_prompt' ? 'crowd_ai_panel_quick_prompt_click' : 'crowd_ai_panel_send', {
      detailId,
      crowdName,
      question: trimmedQuestion,
    });

    appendAssistantReply(trimmedQuestion, source);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <div className="pointer-events-auto flex h-[560px] w-[420px] flex-col overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <AssistantAvatar size="medium" animated={false} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text-1">人群诊断助手</div>
                <div className="truncate text-xs text-text-3">{panelTitle}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-3 transition hover:border-module-market/30 hover:text-module-market"
            >
              收起
            </button>
          </div>

          <div className="border-b border-border px-4 py-3">
            <div className="mb-2 text-xs font-medium text-text-3">快捷提问</div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAsk(prompt, 'quick_prompt')}
                  disabled={isReplying}
                  className="rounded-full border border-module-market/15 bg-module-market/5 px-3 py-1.5 text-xs font-medium text-module-market transition hover:bg-module-market/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={messageViewportRef} className="flex-1 space-y-3 overflow-y-auto bg-bg/60 px-4 py-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      isUser
                        ? 'bg-module-market text-white'
                        : 'border border-border bg-white text-text-2'
                    }`}
                  >
                    <div>{message.content}</div>
                    {message.chart ? <ChartPlaceholder crowdName={crowdName} /> : null}
                  </div>
                </div>
              );
            })}

            {isReplying ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-3 shadow-sm">
                  正在整理与当前人群相关的 mock 结论...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border bg-white px-4 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAsk(inputValue, 'input');
                  }
                }}
                placeholder="输入问题，支持关键词：差异 / 收紧 / 短信"
                disabled={isReplying}
                className="h-11 flex-1 rounded-xl border border-border bg-bg px-4 text-sm text-text-1 outline-none transition focus:border-module-market disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleAsk(inputValue, 'input')}
                disabled={!inputValue.trim() || isReplying}
                className="h-11 rounded-xl bg-module-market px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-module-market/15 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(42,109,244,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(42,109,244,0.22)]"
        >
          <AssistantAvatar size="small" animated={false} />
          <div className="text-left">
            <div className="text-sm font-semibold text-text-1">AI 助手</div>
            <div className="text-xs text-text-3">查看当前人群的快捷分析</div>
          </div>
        </button>
      )}
    </div>
  );
}
