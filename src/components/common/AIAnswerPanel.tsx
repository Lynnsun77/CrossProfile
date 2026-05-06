import React from 'react';
import { RecommendItem } from './RecommendItem';

type AssetType = 'crowd' | 'tag' | 'feature';

interface Recommend {
  id: string;
  type: AssetType;
  title: string;
  reason: string;
  expectedMetric: {
    key: string;
    delta: number;
    expected: 'up' | 'down';
  };
  score: number;
}

interface AIAnswerPanelProps {
  selectedGoals: string[];
  recommendations: Recommend[];
  onReRecommend: () => void;
  onCloseAll: () => void;
  onViewDiagnosis?: (id: string) => void;
  onAddToFoundry?: (id: string) => void;
}

const goalLabels: Record<string, string> = {
  gmv: 'GMV',
  mac: 'MAC',
  lt: 'LT',
  orders: '订单量'
};

export const AIAnswerPanel: React.FC<AIAnswerPanelProps> = ({
  selectedGoals,
  recommendations,
  onReRecommend,
  onCloseAll,
  onViewDiagnosis,
  onAddToFoundry
}) => {
  const displayGoals = selectedGoals.map(g => goalLabels[g] || g).join(', ');

  return (
    <div className="mt-2 bg-white border border-purple-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
        <div className="text-sm text-gray-500">
          基于你选择的 [{displayGoals}]，为你推荐：
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReRecommend}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            重新推荐
          </button>
          <button 
            onClick={onCloseAll}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-purple-100">
        {recommendations.map((rec) => (
          <RecommendItem
            key={rec.id}
            id={rec.id}
            type={rec.type}
            title={rec.title}
            reason={rec.reason}
            expectedMetric={rec.expectedMetric}
            onViewDiagnosis={onViewDiagnosis}
            onAddToFoundry={onAddToFoundry}
          />
        ))}
      </div>
    </div>
  );
};
