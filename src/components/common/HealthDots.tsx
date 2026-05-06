import type { HealthDotLevel } from '../../types';

interface HealthDotsProps {
  accuracy: HealthDotLevel;
  coverage: HealthDotLevel;
  freshness: HealthDotLevel;
}

const dotTone: Record<HealthDotLevel, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
};

export function HealthDots({ accuracy, coverage, freshness }: HealthDotsProps) {
  const dots = [
    { label: '准确率', value: accuracy },
    { label: '覆盖率', value: coverage },
    { label: '新鲜度', value: freshness },
  ];

  return (
    <div className="flex items-center gap-2 text-xs text-text-3">
      <span>健康度</span>
      <div className="flex items-center gap-1.5">
        {dots.map((dot) => (
          <span key={dot.label} title={dot.label} className={`h-2.5 w-2.5 rounded-full ${dotTone[dot.value]}`} />
        ))}
      </div>
    </div>
  );
}
