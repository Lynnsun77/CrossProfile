import React from 'react';

type ModuleTone = 'market' | 'foundry' | 'dashboard';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  moduleTone?: ModuleTone;
  tone?: ModuleTone;
  action?: React.ReactNode;
  extra?: React.ReactNode;
}

const toneColors: Record<ModuleTone, string> = {
  market: 'bg-module-market',
  foundry: 'bg-module-workshop',
  dashboard: 'bg-module-dashboard',
};

const toneGlow: Record<ModuleTone, string> = {
  market: 'var(--page-header-glow-market)',
  foundry: 'var(--page-header-glow-foundry)',
  dashboard: 'var(--page-header-glow-dashboard)',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  moduleTone = 'market',
  tone,
  action,
  extra,
}) => {
  const resolvedTone = tone ?? moduleTone;
  const resolvedAction = extra ?? action;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {/* Identity stripe */}
        <div className={`h-7 w-1 rounded-full ${toneColors[resolvedTone]}`} style={{ boxShadow: toneGlow[resolvedTone] }} />
        
        {/* Title & Subtitle in one line */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-text-2">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Action button */}
      {resolvedAction && (
        <div>
          {resolvedAction}
        </div>
      )}
    </div>
  );
};
