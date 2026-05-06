import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './Badge';
import { HealthBadge } from './HealthBadge';
import { MetricDelta } from './MetricDelta';
import { TruncatedText } from './TruncatedText';
import { DataSourceBadge } from './DataSourceBadge';
import type { Asset, FeatureType, Role, RecommendMeta } from '../../types';
import { track } from '../../lib/track';

interface AssetCardProps {
  asset: Asset;
  role: Role;
  onPrimaryAction?: (asset: Asset) => void;
  onSecondaryAction?: (asset: Asset) => void;
  recommendMeta?: RecommendMeta; // 仅 Agent 推荐卡片展示
  isAIRecommended?: boolean;
  extraActions?: React.ReactNode;
}

const domainLabels: Record<string, string> = {
  cross: '跨域',
  ecommerce: '电商',
  ecom: '电商',
  lifestyle: '生服',
  local: '生服',
};

const lifecycleLabels: Record<string, string> = {
  new: '新上架',
  active: '活跃',
  hot: '热门',
  deprecated: '待下线',
};

const typeIconColors: Record<string, { bg: string; text: string }> = {
  crowd: { bg: 'var(--market-brand-soft)', text: 'var(--asset-crowd)' },
  tag: { bg: 'rgba(6, 182, 212, 0.12)', text: 'var(--asset-tag)' },
  pack: { bg: 'var(--market-accent-soft)', text: 'var(--asset-feature)' },
  model: { bg: 'rgba(245, 158, 11, 0.12)', text: '#b45309' },
};

type FeatureClassIconConfig = {
  emoji: string;
  label: string;
  className: string;
};

const FEATURE_CLASS_ICON: Record<FeatureType, FeatureClassIconConfig> = {
  rule: { emoji: '📏', label: '规则', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sequence: { emoji: '📊', label: '序列', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  algo: { emoji: '🧠', label: '算法推理', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  vector: { emoji: '🧭', label: '向量', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  llm_intent: { emoji: '💬', label: 'LLM 意图', className: 'bg-amber-50 text-amber-800 border-amber-200' },
};

function FeatureClassIcon({ featureClass }: { featureClass: FeatureType }) {
  const cfg = FEATURE_CLASS_ICON[featureClass];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span aria-hidden>{cfg.emoji}</span>
      <span className="hidden sm:inline">{cfg.label}</span>
    </span>
  );
}

function AssetIcon({ icon = 'crowd' }: { icon?: string }) {
  const tone = typeIconColors[icon] ?? typeIconColors.crowd;
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: tone.bg, color: tone.text }}>
      {icon === 'crowd' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {icon === 'tag' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )}
      {icon === 'pack' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      )}
      {icon === 'model' && (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.75L4.5 9l5.25 5.25M14.25 3.75L19.5 9l-5.25 5.25M14.25 20.25l-4.5-22.5" />
        </svg>
      )}
    </div>
  );
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  role,
  onPrimaryAction,
  onSecondaryAction,
  recommendMeta,
  isAIRecommended: propIsAIRecommended,
  extraActions,
}) => {
  const navigate = useNavigate();
  const title = role === 'business' ? asset.nameBiz || asset.name : asset.nameAlgo || asset.namespace;
  const chips = role === 'business' ? asset.chipsBiz || asset.scenarios : asset.chipsAlgo || [];
  const consumers = asset.consumers || asset.consumer || [];
  const featureClass = (asset as Asset & { featureClass?: FeatureType }).featureClass;
  const recommendText = recommendMeta
    ? `匹配 ${recommendMeta.scene} 场景，预计带动 ${recommendMeta.goal} 提升 ${Math.round(recommendMeta.goalLift * 100)}%`
    : '';
  const isAIRecommended = propIsAIRecommended || asset.isAIRecommended || !!recommendMeta;

  const handleCardClick = () => {
    track('asset_card_click', { assetId: asset.id, from: 'marketplace_list' });
    if (onSecondaryAction) onSecondaryAction(asset);
    else if (onPrimaryAction) onPrimaryAction(asset);
    navigate(`/marketplace/asset/${asset.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none"
      style={{
        minHeight: '284px',
        borderColor: isAIRecommended ? 'var(--market-accent-border)' : 'var(--color-border)',
        background: isAIRecommended
          ? 'linear-gradient(180deg, var(--market-surface-card-top) 0%, var(--color-surface) 100%)'
          : 'var(--color-surface)',
        boxShadow: isAIRecommended ? 'var(--market-shadow-ai)' : 'var(--market-shadow-card)',
      }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${title}，${asset.type === 'tag' ? '标签' : asset.type === 'crowd_template' ? '人群模板' : asset.type === 'feature_pack' ? '特征包' : '模型'}，点击查看详情`}
    >
      {isAIRecommended && (
        <div
          className="absolute -top-2 left-4 z-10 flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold text-white shadow-sm"
          style={{ backgroundColor: 'var(--market-accent)' }}
        >
          <span>✨</span>
          <span>AI推荐</span>
        </div>
      )}
      <div className="flex h-full flex-col gap-3">
        <div className="flex min-h-8 items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <AssetIcon icon={asset.icon} />
            <TruncatedText
              text={title}
              lines={1}
              as="h3"
              className="text-base font-semibold text-text-1"
            />
            {featureClass ? <FeatureClassIcon featureClass={featureClass} /> : null}
            <DataSourceBadge type={asset.dataSourceType} />
          </div>
          {extraActions ? (
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              {extraActions}
            </div>
          ) : null}
        </div>

        <div className="grid min-h-6 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2">
          <Badge tone={asset.domain === 'cross' ? 'market' : asset.domain === 'ecommerce' ? 'foundry' : 'dashboard'} className="flex-shrink-0">
            {domainLabels[asset.domain] ?? asset.domain}
          </Badge>
          {asset.lifecycle && (
            <Badge tone={asset.lifecycle === 'hot' ? 'hot' : 'active'} className="flex-shrink-0">
              {lifecycleLabels[asset.lifecycle]}
            </Badge>
          )}
          <div className="min-w-0">
            {recommendText ? (
              <TruncatedText text={recommendText} lines={1} className="text-xs text-text-3" />
            ) : (
              <span className="text-xs text-text-3">{asset.category || '资产推荐'}</span>
            )}
          </div>
          <div className="justify-self-end">
            {asset.uplift ? (
              <div className="inline-flex items-center gap-1">
                <span className="text-xs text-text-3">{asset.uplift.metric}</span>
                <MetricDelta
                  value={asset.uplift.unit === 'x' ? asset.uplift.value.toFixed(1) : `${Math.round(asset.uplift.value)}%`}
                  semantic="good"
                  hideWhenNegative
                  showArrow
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-[40px]">
          <TruncatedText text={asset.description || asset.desc || ''} lines={2} className="text-sm leading-5 text-text-2" />
        </div>

        <div className="min-h-[28px]">
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.slice(0, 4).map((chip) => (
                <span key={chip} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: 'var(--market-semantic-neutral-bg)', color: 'var(--color-text-2)' }}>
                  {chip}
                </span>
              ))}
              {chips.length > 4 && (
                <span className="rounded-full px-2 py-1 text-xs" style={{ backgroundColor: 'var(--market-semantic-neutral-bg)', color: 'var(--color-text-3)' }}>
                  +{chips.length - 4}
                </span>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="min-h-[20px]">
          <div className="flex items-center justify-between gap-2 text-sm text-text-2">
            <TruncatedText text={`消费方：${consumers.join('、') || '-'}`} lines={1} className="text-sm text-text-2" />
            <span className="shrink-0 text-xs text-text-3">{asset.namespace}</span>
          </div>
        </div>

        <div className="mt-auto border-t" style={{ borderColor: 'var(--market-divider)' }} />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1 text-sm text-text-3">
            <span>消费热度</span>
            <span className="font-semibold tabular-nums text-text-1">{asset.heat ?? asset.subs}</span>
          </div>
          <div className="flex items-center gap-2">
            <HealthBadge health={asset.assetHealth} level={asset.health?.level} score={asset.health?.score} />
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--market-brand-soft)', color: 'var(--market-brand)' }}
              aria-hidden
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
