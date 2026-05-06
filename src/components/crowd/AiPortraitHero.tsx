import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { CrowdDetail } from '../../types';

interface AiPortraitHeroProps {
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

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

export function AiPortraitHero({ detail, className = '' }: AiPortraitHeroProps) {
  const [portraitText, setPortraitText] = useState(detail.portrait.summary);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const regenerateTimerRef = useRef<number>();
  const copiedTimerRef = useRef<number>();
  const sentTimerRef = useRef<number>();

  useEffect(() => {
    setPortraitText(detail.portrait.summary);
    setIsRegenerating(false);
    setCopied(false);
    setSent(false);
  }, [detail]);

  useEffect(() => {
    return () => {
      if (regenerateTimerRef.current) {
        window.clearTimeout(regenerateTimerRef.current);
      }
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
      if (sentTimerRef.current) {
        window.clearTimeout(sentTimerRef.current);
      }
    };
  }, []);

  const handleRegenerate = () => {
    if (isRegenerating) {
      return;
    }

    track('crowd_ai_portrait_regenerate', { crowdId: detail.id });
    setIsRegenerating(true);

    regenerateTimerRef.current = window.setTimeout(() => {
      const appendedNote = detail.portrait.regeneratedNote ?? '已重新生成。';
      const nextText = detail.portrait.summary.includes(appendedNote)
        ? detail.portrait.summary
        : `${detail.portrait.summary} ${appendedNote}`;

      setPortraitText(nextText);
      setIsRegenerating(false);
    }, 800);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portraitText);
      track('crowd_ai_portrait_copy', { crowdId: detail.id });
      setCopied(true);

      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('[AiPortraitHero] copy failed', error);
    }
  };

  const handleSendTeam = () => {
    track('crowd_ai_portrait_send_team', { crowdId: detail.id, team: detail.owner.team });
    setSent(true);

    if (sentTimerRef.current) {
      window.clearTimeout(sentTimerRef.current);
    }
    sentTimerRef.current = window.setTimeout(() => setSent(false), 1800);
  };

  return (
    <section
      className={`rounded-[24px] border border-border bg-surface p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="market">AI 自然语言画像</Badge>
            <Badge tone="feature">置信度 {formatConfidence(detail.portrait.confidence)}</Badge>
          </div>

          <div className="rounded-2xl border border-module-market/15 bg-module-market/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-module-market">
              <Sparkles size={16} />
              <span>画像摘要</span>
            </div>

            <p className="text-sm leading-7 text-text-1">{portraitText}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                isRegenerating
                  ? 'cursor-wait bg-module-market text-white'
                  : 'bg-module-market text-white hover:opacity-90'
              }`}
            >
              {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {isRegenerating ? '生成中...' : '重新生成'}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/30 hover:text-module-market"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制' : '复制'}
            </button>

            <button
              type="button"
              onClick={handleSendTeam}
              className="inline-flex items-center gap-2 rounded-lg border border-module-market/20 bg-module-market/10 px-4 py-2 text-sm font-medium text-module-market transition hover:bg-module-market/15"
            >
              {sent ? <Check size={16} /> : <Send size={16} />}
              {sent ? '已发送团队' : '发送团队'}
            </button>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-border bg-white p-5 lg:max-w-[360px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-text-1">画像来源</div>
              <div className="mt-1 text-xs text-text-3">按 spec 使用来源表展示当前画像依据</div>
            </div>
            <div className="rounded-full bg-bg px-3 py-1 text-xs text-text-2">
              {detail.portrait.sources.length} 项
            </div>
          </div>

          <div className="space-y-2">
            {detail.portrait.sources.map((source) => (
              <div
                key={source.label}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-bg px-3 py-3"
              >
                <span className="text-sm text-text-2">{source.label}</span>
                <span className="text-sm font-medium text-text-1">{source.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-3 text-xs leading-6 text-text-3">
            来源覆盖交易、会员、偏好与触达响应数据，仅做只读展示，不在本页内编辑规则。
          </div>
        </div>
      </div>
    </section>
  );
}
