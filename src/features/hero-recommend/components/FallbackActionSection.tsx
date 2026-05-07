const MARKETPLACE_OPEN_GAP_REQUEST_EVENT = 'marketplace:open-gap-request';

interface Props {
  active: boolean;
  reason?: string;
  onRetryDescribe: () => void;
}

export function FallbackActionSection({ active, reason, onRetryDescribe }: Props) {
  return (
    <section className={`rounded-2xl border p-5 ${active ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">都不符合你的诉求？</h3>
        <p className="text-sm leading-6 text-slate-600">可能是资产尚未入驻平台，或诉求过于定制。</p>
        {reason ? <p className="text-sm leading-6 text-slate-500">{reason}</p> : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(MARKETPLACE_OPEN_GAP_REQUEST_EVENT))}
          className="h-10 rounded-lg bg-module-market px-5 text-sm font-medium text-white hover:opacity-90"
        >
          去提需更多画像标签建设
        </button>
        <button
          type="button"
          onClick={onRetryDescribe}
          className="h-10 rounded-lg border border-border bg-white px-5 text-sm font-medium text-text-2 hover:border-module-market/20"
        >
          重新描述需求
        </button>
      </div>
    </section>
  );
}

export { MARKETPLACE_OPEN_GAP_REQUEST_EVENT };
