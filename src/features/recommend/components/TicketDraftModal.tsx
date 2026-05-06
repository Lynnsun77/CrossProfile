import { useEffect, useMemo, useState } from 'react';
import type { GapItem } from '../types';
import { useRecommendStore } from '../store/useRecommendStore';

function createDraft(gap: GapItem) {
  return {
    title: `【${gap.title}】`,
    source: '智能推荐 · 飞书文档推荐链路',
    desc: `希望补齐该能力以支撑当前推荐链路。\n影响：${gap.impact}`,
    assignee: gap.suggestedOwner,
  };
}

export function TicketDraftModal({ gap, onClose }: { gap: GapItem; onClose: () => void }) {
  const submitTicket = useRecommendStore((s) => s.submitTicket);
  const [draft, setDraft] = useState(() => createDraft(gap));
  const [toast, setToast] = useState('');
  const toastDelay = useMemo(() => 1500, []);

  useEffect(() => {
    setDraft(createDraft(gap));
  }, [gap]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast('');
      onClose();
    }, toastDelay);
    return () => window.clearTimeout(timer);
  }, [onClose, toast, toastDelay]);

  const submit = () => {
    submitTicket(gap.id);
    setToast('已提需,可在 我的 > 我的提需 查看');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-[520px] rounded-xl bg-white p-5 shadow-lg">
        <div className="text-sm font-semibold">📮 提需工单草稿</div>

        <Labeled label="标题">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </Labeled>
        <Labeled label="来源">
          <div className="text-sm text-gray-600">{draft.source}</div>
        </Labeled>
        <Labeled label="描述">
          <textarea
            value={draft.desc}
            onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
            rows={4}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </Labeled>
        <Labeled label="@ 责任人">
          <div className="text-sm">{draft.assignee}</div>
        </Labeled>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1.5 text-sm">
            取消
          </button>
          <button type="button" onClick={submit} className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white">
            提交工单
          </button>
        </div>

        {toast ? (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/80 px-3 py-1.5 text-xs text-white">{toast}</div>
        ) : null}
      </div>
    </div>
  );
}

const Labeled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-3">
    <div className="mb-0.5 text-xs text-gray-500">{label}</div>
    {children}
  </div>
);
