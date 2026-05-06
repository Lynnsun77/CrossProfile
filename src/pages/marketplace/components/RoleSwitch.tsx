import type { ConsumerSubRole } from '../../../store/globalState';

type RoleSwitchProps = {
  value: ConsumerSubRole;
  onChange: (next: ConsumerSubRole) => void;
  disabled?: boolean;
};

const options: Array<{ value: ConsumerSubRole; label: string }> = [
  { value: 'business', label: '业务运营' },
  { value: 'algorithm', label: '算法' },
];

export function RoleSwitch({ value, onChange, disabled = false }: RoleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center rounded-xl p-1 md:inline-flex" style={{ backgroundColor: 'var(--market-brand-softer)' }}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={
                active
                  ? {
                      background: 'var(--brand-gradient)',
                      color: 'white',
                      boxShadow: 'var(--market-brand-shadow-md)',
                    }
                  : {
                      color: 'var(--color-text-2)',
                    }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label className="md:hidden">
        <span className="sr-only">切换市集角色</span>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as ConsumerSubRole)}
          className="h-10 rounded-xl border bg-white px-3 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="切换市集角色"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
