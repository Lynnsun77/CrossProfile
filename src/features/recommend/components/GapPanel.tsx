import { useState } from 'react';
import type { GapItem } from '../types';
import { useRecommendStore } from '../store/useRecommendStore';
import { TicketDraftModal } from './TicketDraftModal';

export function GapPanel() {
  const gaps = useRecommendStore((s) => s.gaps);
  const tickets = useRecommendStore((s) => s.tickets);
  const [open, setOpen] = useState<GapItem | null>(null);
  if (gaps.length === 0) return null;

  return (
    <>
      <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/60 p-5">
        <div className="text-sm font-semibold text-amber-700">⚠️ 平台缺口提示（共 {gaps.length} 条，建议提需给供给方）</div>
        {gaps.map((gap, index) => {
          const submitted = tickets.some((ticket) => ticket.gapId === gap.id);
          return (
            <div key={gap.id} className="flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-white p-3">
              <div className="flex-1 text-sm">
                <div className="font-medium">
                  {index + 1}. {gap.title}
                </div>
                <div className="mt-1 text-xs text-gray-600">影响: {gap.impact}</div>
                <div className="mt-0.5 text-xs text-gray-500">建议责任方: {gap.suggestedOwner}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submitted) setOpen(gap);
                }}
                disabled={submitted}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
                  submitted ? 'cursor-default bg-emerald-100 text-emerald-700' : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                {submitted ? '✓ 已提需' : '📮 一键提需'}
              </button>
            </div>
          );
        })}
      </div>
      {open ? <TicketDraftModal gap={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
