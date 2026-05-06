import { Tooltip } from '../../../../components/common/Tooltip';

const P2_ITEMS = [
  'F0.11',
  'F1.6',
  'F1.11',
  'F2.3',
  'F2.8',
  'F2.9',
  'F2.10',
  'F3.3',
  'F3.10',
  'F3.11',
  'F3.12',
  'F3.13',
  'FX.5',
  'FX.8',
] as const;

export function P2PlaceholderGrid() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">P2 占位区</div>
      <div className="mt-2 text-sm text-text-2">以下能力点位已挂灰态占位，将在后续版本继续完善。</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {P2_ITEMS.map((item) => (
          <Tooltip key={item} content="敬请期待">
            <button type="button" className="cursor-not-allowed rounded-full border border-border bg-bg px-3 py-1 text-xs text-text-3">
              {item}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
