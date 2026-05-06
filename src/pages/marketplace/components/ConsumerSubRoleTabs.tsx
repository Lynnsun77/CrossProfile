import type { ConsumerSubRole } from '../../../store/globalState';

export function ConsumerSubRoleTabs({
  value,
  onChange,
}: {
  value: ConsumerSubRole;
  onChange: (next: ConsumerSubRole) => void;
}) {
  const options: Array<{ key: ConsumerSubRole; label: string; desc: string }> = [
    { key: 'business', label: '业务', desc: '更偏增长与可落地动作' },
    { key: 'algorithm', label: '算法', desc: '更偏可复用与效果稳定' },
  ];

  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              active ? 'bg-gradient-brand text-white shadow-sm' : 'text-text-2 hover:bg-bg hover:text-text-1',
            ].join(' ')}
            aria-pressed={active}
            title={opt.desc}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

