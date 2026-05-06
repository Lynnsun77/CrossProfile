import { useEffect, useState } from 'react';
import { useRecommendStore } from '../store/useRecommendStore';

export interface UnmetDemandDialogProps {
  open: boolean;
  onClose: () => void;
}

const PROMPT = '请告诉我们，您刚才期望找到什么样的人群特征但没有找到？';

export function UnmetDemandDialog({ open, onClose }: UnmetDemandDialogProps) {
  const appendUnmetDemand = useRecommendStore((s) => s.appendUnmetDemand);
  const captureInvalidQuery = useRecommendStore((s) => s.captureInvalidQuery);
  const submitTicket = useRecommendStore((s) => s.submitTicket);
  const [text, setText] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!open) {
      setText('');
      setToast('');
    }
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast('');
      onClose();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!open) return null;

  const canSubmit = text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    appendUnmetDemand(text.trim());
    // 兜底：同步触发一次工单
    try {
      submitTicket(`unmet_${Date.now()}`);
    } catch {
      // 忽略兜底失败
    }
    setToast('已记录，将自动同步至需求看板');
  };

  const handleCancel = () => {
    captureInvalidQuery();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="就地需求捕获"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="relative w-[480px] rounded-xl bg-white p-5 shadow-2xl">
        <div className="text-sm font-semibold text-gray-900">我要提需更多画像</div>
        <div className="mt-2 text-xs text-gray-600">{PROMPT}</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="例如：想找近 30 天有美妆购买意向、且在小红书活跃的年轻女性"
          className="mt-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            提交反馈
          </button>
        </div>
        {toast ? (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/80 px-3 py-1.5 text-xs text-white">
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default UnmetDemandDialog;
