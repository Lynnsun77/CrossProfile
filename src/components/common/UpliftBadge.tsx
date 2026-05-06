import type { UpliftBadge as UpliftBadgeType } from '../../types';
import { Tooltip } from './Tooltip';

interface UpliftBadgeProps {
  uplift?: UpliftBadgeType;
}

export function UpliftBadge({ uplift }: UpliftBadgeProps) {
  // 前置条件：value > 0 才渲染
  if (!uplift || uplift.value <= 0) {
    return null;
  }

  const { metric, value, unit = '%' } = uplift;
  
  // 格式化显示值
  const displayValue = unit === 'x' ? value.toFixed(1) : Math.round(value);
  
  // Tooltip 文案
  const tooltipText = `基于历史同类投放预估，提升 ${displayValue}${unit}`;

  return (
    <Tooltip content={tooltipText}>
      <div className="uplift-badge group/badge inline-flex items-center gap-1 h-[22px] px-2.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 transition-shadow duration-160 hover:shadow-[0_0_0_2px_rgba(16,185,129,0.14)]">
        <span className="uplift-badge__label">{metric}</span>
        <svg 
          className="uplift-badge__arrow w-2.5 h-2.5" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path 
            d="M6 2.5V9.5M6 2.5L3 5.5M6 2.5L9 5.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className="uplift-badge__value font-variant-numeric tabular-nums">
          {displayValue}{unit}
        </span>
      </div>
    </Tooltip>
  );
}
