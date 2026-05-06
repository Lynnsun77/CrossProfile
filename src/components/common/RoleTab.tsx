import type { Role } from '../../types';

interface RoleTabProps {
  value: Role;
  onChange: (role: Role) => void;
}

const roleOptions: Array<{ value: Role; label: string; icon: string }> = [
  { value: 'business', label: '业务运营', icon: '🎯' },
  { value: 'algo', label: '算法', icon: '🧪' },
];

export function RoleTab({ value, onChange }: RoleTabProps) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
      {roleOptions.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              active
                ? 'bg-gradient-brand text-white shadow-sm'
                : 'text-text-2 hover:bg-bg hover:text-text-1'
            }`}
          >
            <span className="mr-1.5">{option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
