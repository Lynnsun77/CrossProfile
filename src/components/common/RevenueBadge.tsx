import { formatCurrency } from '../../lib/format';

interface RevenueBadgeProps {
  value: number;
}

export function RevenueBadge({ value }: RevenueBadgeProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
      <span className="mr-1">💰</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
