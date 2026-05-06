import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './Badge';
import { MetricDelta } from './MetricDelta';

type AssetType = 'crowd' | 'tag' | 'feature';
type DomainType = 'cross' | 'ecommerce' | 'lifestyle';

interface AssetRankingItemProps {
  index: number;
  id: string;
  type: AssetType;
  name: string;
  domain: DomainType;
  description?: string;
  scenarios?: string[];
  consumer?: string[];
  subs: number;
  roiHint: string;
  hotness?: { label: string; color: string } | null;
}

// Rank colors and styles
const rankGradients: Record<number, string> = {
  0: 'linear-gradient(135deg,#FFD66B,#F59E0B)',
  1: 'linear-gradient(135deg,#DCE3EE,#9AA4B2)',
  2: 'linear-gradient(135deg,#E9B892,#C97B3B)',
};

const rankBorderColors: Record<number, string> = {
  0: 'border-yellow-500',
  1: 'border-gray-400',
  2: 'border-amber-600',
};

const typeIconColors = {
  crowd: 'bg-asset-crowd/10 text-asset-crowd',
  tag: 'bg-asset-tag/10 text-asset-tag',
  feature: 'bg-asset-feature/10 text-asset-feature',
};

const domainLabels = {
  cross: '跨域',
  ecommerce: '电商',
  lifestyle: '生服',
};

const domainBadgeTone = {
  cross: 'market',
  ecommerce: 'foundry',
  lifestyle: 'dashboard',
};

export const AssetRankingItem: React.FC<AssetRankingItemProps> = ({
  index,
  id,
  type,
  name,
  domain,
  scenarios = [],
  consumer = [],
  subs,
  roiHint,
  hotness,
}) => {
  const isTop3 = index < 3;
  
  const getHotnessBadge = () => {
    if (!hotness) return null;
    if (hotness.label.includes('热门') || hotness.label.includes('🔥')) {
      return <Badge tone="hot">🔥热门</Badge>;
    }
    if (hotness.label.includes('活跃')) {
      return <Badge tone="active">活跃</Badge>;
    }
    return null;
  };

  const TypeIcon = () => (
    <div className={`w-9 h-9 rounded-lg ${typeIconColors[type]} flex items-center justify-center flex-shrink-0`}>
      {type === 'crowd' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {type === 'tag' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )}
      {type === 'feature' && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )}
    </div>
  );

  return (
    <Link
      to={`/marketplace/crowd/${id}`}
      role="row"
      tabIndex={0}
      className="group relative flex items-center gap-5 bg-surface border border-border rounded-card p-3 pl-5 hover:bg-brand-soft transition-all duration-160 focus:outline-none focus:ring-2 focus:ring-gradient-brand cursor-pointer"
    >
      {/* Left accent stripe for Top3 */}
      {isTop3 && (
        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${rankBorderColors[index]}`} />
      )}

      {/* Grid layout */}
      <div className="grid grid-cols-[56px_48px_minmax(280px,1.6fr)_72px_72px_minmax(160px,1fr)_minmax(180px,1fr)] items-center gap-5 w-full">
        
        {/* [rank] Rank number */}
        <div role="cell" className="flex justify-center">
          <div className={`transition-transform duration-160 group-hover:scale-104 ${isTop3 ? 'w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_8px_rgba(0,0,0,0.25)]' : 'text-text-3 font-medium text-base'}`}
               style={isTop3 ? { background: rankGradients[index] } : undefined}>
            {index + 1}
          </div>
        </div>

        {/* [icon] Type icon */}
        <div role="cell" className="flex justify-center">
          <TypeIcon />
        </div>

        {/* [main] Main content */}
        <div role="cell" className="min-w-0">
          <h3 className="text-base font-semibold text-text-1 truncate mb-1">{name}</h3>
          <div className="flex flex-wrap gap-1.5">
            {scenarios.slice(0, 2).map((scenario, i) => (
              <span key={i} className="px-2 py-1 bg-bg text-text-2 text-xs rounded-chip">
                {scenario}
              </span>
            ))}
            {scenarios.length > 2 && (
              <span className="text-xs text-text-3">+{scenarios.length - 2}</span>
            )}
          </div>
        </div>

        {/* Vertical separator */}
        <div className="hidden md:block w-px h-7 bg-border" />

        {/* [domain] Domain */}
        <div role="cell" className="flex justify-center">
          <Badge tone={domainBadgeTone[domain] as any}>
            {domainLabels[domain]}
          </Badge>
        </div>

        {/* [status] Status badge */}
        <div role="cell" className="flex justify-center">
          {getHotnessBadge() || <span className="text-text-3 text-xs">-</span>}
        </div>

        {/* Vertical separator */}
        <div className="hidden md:block w-px h-7 bg-border" />

        {/* [consumer] Consumer */}
        <div role="cell" className="text-right hidden lg:block">
          {consumer.length > 0 ? (
            <div className="relative group/consumer">
              <p className="text-sm text-text-1 truncate max-w-[200px]"
                 title={consumer.join('、')}>
                <span className="text-text-3">消费方:</span> {consumer.join('、')}
              </p>
            </div>
          ) : (
            <span className="text-text-3 text-xs">-</span>
          )}
        </div>

        {/* [metric] Metrics */}
        <div role="cell" className="text-right">
          <p className="text-sm text-text-3 mb-1">消费热度: {subs}</p>
          <MetricDelta
            value={roiHint.replace(/[^0-9.-]/g, '')}
            expected="up"
            unit=""
          />
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-160 text-text-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};
