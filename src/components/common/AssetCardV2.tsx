import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './Badge';
import { MetricDelta } from './MetricDelta';
import { DataSourceBadge } from './DataSourceBadge';

type AssetType = 'crowd' | 'tag' | 'feature';
type DomainType = 'cross' | 'ecommerce' | 'lifestyle';
type DataSourceTypeValue = 'btm_plus' | 'external' | 'cross_domain' | 'private_end';

interface AssetCardProps {
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
  dataSourceType?: DataSourceTypeValue;
  onClick?: () => void;
}

const domainLabels: Record<DomainType, string> = {
  cross: '跨域',
  ecommerce: '电商',
  lifestyle: '生服',
};

const typeIconColors: Record<AssetType, string> = {
  crowd: 'bg-asset-crowd/10 text-asset-crowd',
  tag: 'bg-asset-tag/10 text-asset-tag',
  feature: 'bg-asset-feature/10 text-asset-feature',
};

const domainBadgeTone: Record<DomainType, 'market' | 'foundry' | 'dashboard'> = {
  cross: 'market',
  ecommerce: 'foundry',
  lifestyle: 'dashboard',
};

export const AssetCardV2: React.FC<AssetCardProps> = ({
  id,
  type,
  name,
  domain,
  description,
  scenarios = [],
  consumer = [],
  subs,
  roiHint,
  hotness,
  dataSourceType,
  onClick,
}) => {
  const getNavigatePath = () => {
    if (type === 'crowd' || type === 'tag') {
      return `/marketplace/crowd/${id}`;
    }
    return `/factory/result`;
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

  const getHotnessBadge = () => {
    if (!hotness) return null;
    
    if (hotness.label.includes('热门') || hotness.label.includes('🔥')) {
      return <Badge tone="hot">🔥 热门</Badge>;
    }
    if (hotness.label.includes('活跃')) {
      return <Badge tone="active">活跃</Badge>;
    }
    return null;
  };

  return (
    <Link
      to={getNavigatePath()}
      onClick={onClick}
      className="group block bg-surface border border-border rounded-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-brand-500/20 transition-all duration-platform relative overflow-hidden"
    >
      {/* Left accent stripe on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-platform" />
      
      {/* Header section */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-start gap-3">
          <TypeIcon />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-medium text-text-1 truncate">{name}</h3>
              <Badge tone={domainBadgeTone[domain]}>
                {domainLabels[domain]}
              </Badge>
              <DataSourceBadge type={dataSourceType} />
            </div>
          </div>
        </div>
        {getHotnessBadge()}
      </div>

      {/* Tooltip for description */}
      {description && (
        <div className="absolute left-0 right-0 bottom-full mb-2 px-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
          <div className="bg-text-1 text-surface text-xs p-3 rounded-lg max-w-xs shadow-xl">
            {description}
            <div className="absolute left-6 bottom-0 w-2 h-2 bg-text-1 transform rotate-45 translate-y-1" />
          </div>
        </div>
      )}

      {/* Scenario tags */}
      {scenarios.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 relative z-10">
          {scenarios.slice(0, 2).map((scenario, i) => (
            <span key={i} className="px-2 py-1 bg-bg text-text-2 text-xs rounded-chip">
              {scenario}
            </span>
          ))}
          {scenarios.length > 2 && (
            <span className="text-xs text-text-3">+{scenarios.length - 2}</span>
          )}
          
          {/* Consumer info */}
          {consumer.length > 0 && (
            <span className="ml-auto text-xs text-text-3">
              消费方：
              <span className="text-text-2 font-medium">
                {consumer.join('、')}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Footer metrics */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-text-3">
          消费热度：{subs}
        </span>
        <MetricDelta 
          value={roiHint.replace(/[^0-9.-]/g, '')}
          expected="up"
          unit=""
        />
      </div>
    </Link>
  );
};
