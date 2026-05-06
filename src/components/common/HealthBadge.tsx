import type { AssetHealth, HealthDimensions, HealthLevel } from '../../types';
import { Tooltip } from './Tooltip';

interface HealthBadgeProps {
  health?: AssetHealth;
  // 兼容旧 API
  level?: HealthLevel;
  score?: number;
}

const statusConfig = {
  good: { label: '健康', bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  warn: { label: '关注', bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  risk: { label: '预警', bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
};

// 兼容旧的健康等级映射
const legacyLevelMap: Record<string, 'good' | 'warn' | 'risk'> = {
  excellent: 'good',
  good: 'good',
  qualified: 'good',
  'needs_improvement': 'warn',
  risk: 'risk',
  green: 'good',
  yellow: 'warn',
  red: 'risk',
};

const dimensionLabels: Record<keyof HealthDimensions, string> = {
  freshness: '数据新鲜度',
  coverage: '覆盖率',
  stability: '稳定性',
};

export function HealthBadge({ health, level, score }: HealthBadgeProps) {
  // 优先使用新的 health API
  if (health) {
    const { overall, dimensions } = health;
    const config = statusConfig[overall];

    // Popover 内容
    const detailContent = (
      <div className="space-y-2 py-1">
        {(Object.keys(dimensions) as Array<keyof HealthDimensions>).map((key) => {
          const status = dimensions[key];
          const dimConfig = statusConfig[status];
          return (
            <div key={key} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${dimConfig.dot}`} />
                <span className="text-gray-600">{dimensionLabels[key]}</span>
              </div>
              <span className={`font-medium ${dimConfig.text}`}>{dimConfig.label}</span>
            </div>
          );
        })}
      </div>
    );

    return (
      <Tooltip content={detailContent}>
        <div className={`health-badge inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <span className="health-badge__dot w-1.5 h-1.5 rounded-full bg-current" />
          <span>{config.label}</span>
        </div>
      </Tooltip>
    );
  }

  // 兼容旧 API
  if (level) {
    const mappedLevel = legacyLevelMap[level] || 'good';
    const config = statusConfig[mappedLevel];
    const content = score !== undefined ? `健康度 ${score}分` : config.label;

    return (
      <Tooltip content={content}>
        <div className={`health-badge inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <span className="health-badge__dot w-1.5 h-1.5 rounded-full bg-current" />
          <span>{config.label}</span>
        </div>
      </Tooltip>
    );
  }

  return null;
}
