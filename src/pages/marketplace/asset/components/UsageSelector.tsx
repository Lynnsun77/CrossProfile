import { EmptyState } from './EmptyState';
import type { AssetDetailUseCaseOption } from '../types';

interface UsageSelectorProps {
  options?: AssetDetailUseCaseOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function UsageSelector({ options, selectedKey, onSelect, loading, error }: UsageSelectorProps) {
  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-bg" />;
  }
  if (error) {
    return <EmptyState title="用途选择加载失败" description={error} />;
  }
  if (!options?.length) {
    return <EmptyState title="暂无用途选项" />;
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">用途选择</div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const selected = option.key === selectedKey;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              className={[
                'rounded-2xl border px-4 py-3 text-left transition',
                selected ? 'border-module-market bg-module-market/5' : 'border-border bg-white hover:border-module-market/30',
              ].join(' ')}
            >
              <div className="text-sm font-medium text-text-1">{option.label}</div>
              <div className="mt-1 text-xs leading-5 text-text-3">{option.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
