import React from 'react';

interface MetricDeltaProps {
  value: number | string;
  expected?: 'up' | 'down';
  unit?: string;
  className?: string;
  isPercentage?: boolean;
  semantic?: 'good' | 'bad' | 'neutral';
  hideWhenNegative?: boolean;
  showArrow?: boolean;
}

export const MetricDelta: React.FC<MetricDeltaProps> = ({
  value,
  expected = 'up',
  unit = '',
  className = '',
  isPercentage = false,
  semantic,
  hideWhenNegative = false,
  showArrow = true,
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^\d.-]/g, ''));
  const hasNumber = Number.isFinite(numericValue);
  const isPositive = hasNumber && numericValue > 0;
  const isNegative = hasNumber && numericValue < 0;

  if (hideWhenNegative && (!hasNumber || !isPositive)) {
    return null;
  }

  let displayValue = typeof value === 'number' ? String(value) : value;
  if (typeof value === 'number' && isPercentage) {
    displayValue = (value * 100).toFixed(0);
  }

  const derivedSemantic = semantic ?? (() => {
    if (!hasNumber || numericValue === 0) return 'neutral';
    const isGood = (expected === 'up' && isPositive) || (expected === 'down' && isNegative);
    return isGood ? 'good' : 'bad';
  })();

  const stylesBySemantic = {
    good: {
      color: 'var(--market-semantic-positive)',
      backgroundColor: 'var(--market-semantic-positive-bg)',
    },
    bad: {
      color: 'var(--market-semantic-negative)',
      backgroundColor: 'var(--market-semantic-negative-bg)',
    },
    neutral: {
      color: 'var(--market-semantic-neutral-text)',
      backgroundColor: 'var(--market-semantic-neutral-bg)',
    },
  } as const;

  const arrow = isPositive ? '↑' : isNegative ? '↓' : '•';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${className}`}
      style={stylesBySemantic[derivedSemantic]}
    >
      {showArrow ? <span aria-hidden>{arrow}</span> : null}
      <span>{displayValue}</span>
      {unit && <span>{unit}</span>}
    </div>
  );
};
