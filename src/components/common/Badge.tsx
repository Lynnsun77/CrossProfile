import React from 'react';

type BadgeTone = 'hot' | 'active' | 'new' | 'market' | 'foundry' | 'dashboard' | 'crowd' | 'tag' | 'feature';

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  hot: 'bg-orange-50 text-orange-700 border-orange-200',
  active: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  market: 'bg-module-market/10 text-module-market border-module-market/20',
  foundry: 'bg-module-workshop/10 text-module-workshop border-module-workshop/20',
  dashboard: 'bg-module-dashboard/10 text-module-dashboard border-module-dashboard/20',
  crowd: 'bg-asset-crowd/10 text-asset-crowd border-asset-crowd/20',
  tag: 'bg-asset-tag/10 text-asset-tag border-asset-tag/20',
  feature: 'bg-asset-feature/10 text-asset-feature border-asset-feature/20',
};

export const Badge: React.FC<BadgeProps> = ({ tone, children, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded-chip transition-colors duration-platform ${toneStyles[tone]} ${className}`}>
      {children}
    </span>
  );
};
