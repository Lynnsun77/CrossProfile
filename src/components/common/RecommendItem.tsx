import React from 'react';
import { MetricDelta } from './MetricDelta';

type AssetType = 'crowd' | 'tag' | 'feature';

interface RecommendItemProps {
  id: string;
  type: AssetType;
  title: string;
  reason: string;
  expectedMetric: {
    key: string;
    delta: number;
    expected: 'up' | 'down';
  };
  onViewDiagnosis?: (id: string) => void;
  onAddToFoundry?: (id: string) => void;
}

const typeLabels: Record<AssetType, string> = {
  crowd: '人',
  tag: '标',
  feature: '特'
};

const typeIconColors = {
  crowd: 'bg-blue-100 text-blue-600',
  tag: 'bg-purple-100 text-purple-600',
  feature: 'bg-green-100 text-green-600'
};

const typeColors = {
  crowd: 'bg-blue-500',
  tag: 'bg-purple-500',
  feature: 'bg-green-500'
};

export const RecommendItem: React.FC<RecommendItemProps> = ({
  id,
  type,
  title,
  reason,
  expectedMetric,
  onViewDiagnosis,
  onAddToFoundry
}) => {
  return (
    <div className="group relative flex items-start gap-4 p-4 border-b border-gray-200 last:border-b-0 hover:-translate-y-0.5 transition-all duration-160">
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${typeColors[type]} opacity-0 group-hover:opacity-100 transition-opacity duration-160`} />
      
      <div className={`w-9 h-9 rounded-lg ${typeIconColors[type]} flex items-center justify-center flex-shrink-0 font-semibold`}>
        {typeLabels[type]}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{reason}</p>
      </div>

      <div className="flex flex-col items-end gap-3">
        <MetricDelta
          value={`${expectedMetric.delta}`}
          expected={expectedMetric.expected}
          unit={` ${expectedMetric.key}`}
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => onViewDiagnosis?.(id)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-160"
          >
            查看诊断
          </button>
          <button
            onClick={() => onAddToFoundry?.(id)}
            className="px-3 py-1.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-160"
          >
            加入工坊
          </button>
        </div>
      </div>
    </div>
  );
};
