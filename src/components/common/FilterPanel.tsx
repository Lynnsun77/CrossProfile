import { useState } from 'react';
import type { AssetType, Domain, HealthDotLevel, LifeCycle } from '../../types';

export interface MarketFilters {
  assetTypes: AssetType[];
  domains: Domain[];
  lifeCycles: LifeCycle[];
  healthLevels: HealthDotLevel[];
  categories: string[];
}

interface FilterPanelProps {
  filters: MarketFilters;
  categories: string[];
  onResetDomains: () => void;
  onToggleAssetType: (value: AssetType) => void;
  onToggleDomain: (value: Domain) => void;
  onToggleLifeCycle: (value: LifeCycle) => void;
  onToggleHealth: (value: HealthDotLevel) => void;
  onCategoryChange: (value: string[]) => void;
}

// FIX-M5: 自定义 Checkbox 组件
function FilterCheckbox({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-checkbox inline-flex items-center gap-2 h-7 cursor-pointer transition-all duration-120 ${
        checked ? 'filter-checkbox--checked' : ''
      }`}
    >
      <span 
        className={`filter-checkbox__box w-4 h-4 rounded border-[1.5px] transition-all duration-120 flex items-center justify-center ${
          checked 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent' 
            : 'border-gray-300 bg-white'
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
            <path 
              d="M2 6L5 9L10 3" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={`filter-checkbox__label text-sm transition-colors ${
        checked ? 'text-gray-900 font-medium' : 'text-gray-600'
      }`}>
        {label}
      </span>
    </button>
  );
}

// 折叠面板组件
function CollapseSection({
  title,
  defaultExpanded = true,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <section className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{title}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 animate-fadeIn">
          {children}
        </div>
      )}
    </section>
  );
}

export function FilterPanel({
  filters,
  categories,
  onResetDomains,
  onToggleAssetType,
  onToggleDomain,
  onToggleLifeCycle,
  onToggleHealth,
  onCategoryChange,
}: FilterPanelProps) {
  // 计算已选项数量
  const selectedCount = 
    filters.assetTypes.length + 
    filters.domains.length + 
    filters.lifeCycles.length + 
    filters.healthLevels.length + 
    filters.categories.length;

  // 清空所有筛选
  const handleClearAll = () => {
    onResetDomains();
    // 重置其他筛选器
    filters.assetTypes.forEach(type => onToggleAssetType(type));
    filters.lifeCycles.forEach(lc => onToggleLifeCycle(lc));
    filters.healthLevels.forEach(hl => onToggleHealth(hl));
    onCategoryChange([]);
  };

  const hasSelected = selectedCount > 0;

  return (
    <div className="filter-panel rounded-xl border border-gray-200 bg-white p-4">
      {/* FIX-M5: 面板顶部操作区 */}
      <div className="filter-panel__header flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">筛选面板</h3>
        {hasSelected && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">已选 {selectedCount} 项</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              清空
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* 资产类型 - 默认展开 */}
        <CollapseSection title="资产类型" defaultExpanded={true}>
          <FilterCheckbox 
            checked={filters.assetTypes.includes('tag')} 
            label="标签" 
            onClick={() => onToggleAssetType('tag')} 
          />
          <FilterCheckbox 
            checked={filters.assetTypes.includes('crowd_template')} 
            label="人群模板" 
            onClick={() => onToggleAssetType('crowd_template')} 
          />
          <FilterCheckbox 
            checked={filters.assetTypes.includes('feature_pack')} 
            label="特征包" 
            onClick={() => onToggleAssetType('feature_pack')} 
          />
          <FilterCheckbox 
            checked={filters.assetTypes.includes('model')} 
            label="模型" 
            onClick={() => onToggleAssetType('model')} 
          />
        </CollapseSection>

        {/* 业务域 - 默认展开 */}
        <CollapseSection title="业务域" defaultExpanded={true}>
          <FilterCheckbox 
            checked={filters.domains.length === 0} 
            label="全部" 
            onClick={onResetDomains} 
          />
          <FilterCheckbox 
            checked={filters.domains.includes('ecommerce')} 
            label="电商" 
            onClick={() => onToggleDomain('ecommerce')} 
          />
          <FilterCheckbox 
            checked={filters.domains.includes('lifestyle')} 
            label="生服" 
            onClick={() => onToggleDomain('lifestyle')} 
          />
          <FilterCheckbox 
            checked={filters.domains.includes('cross')} 
            label="跨域" 
            onClick={() => onToggleDomain('cross')} 
          />
        </CollapseSection>

        {/* 生命周期 - 默认展开 */}
        <CollapseSection title="生命周期" defaultExpanded={true}>
          <FilterCheckbox 
            checked={filters.lifeCycles.includes('new')} 
            label="新上架" 
            onClick={() => onToggleLifeCycle('new')} 
          />
          <FilterCheckbox 
            checked={filters.lifeCycles.includes('active')} 
            label="活跃" 
            onClick={() => onToggleLifeCycle('active')} 
          />
          <FilterCheckbox 
            checked={filters.lifeCycles.includes('hot')} 
            label="热门" 
            onClick={() => onToggleLifeCycle('hot')} 
          />
          <FilterCheckbox 
            checked={filters.lifeCycles.includes('deprecated')} 
            label="待下线" 
            onClick={() => onToggleLifeCycle('deprecated')} 
          />
        </CollapseSection>

        {/* 健康度 - 默认展开 */}
        <CollapseSection title="健康度" defaultExpanded={true}>
          <div className="space-y-1.5">
            <FilterCheckbox 
              checked={filters.healthLevels.includes('green')} 
              label="高" 
              onClick={() => onToggleHealth('green')} 
            />
            <FilterCheckbox 
              checked={filters.healthLevels.includes('yellow')} 
              label="中" 
              onClick={() => onToggleHealth('yellow')} 
            />
            <FilterCheckbox 
              checked={filters.healthLevels.includes('red')} 
              label="低" 
              onClick={() => onToggleHealth('red')} 
            />
          </div>
        </CollapseSection>

        {/* 品类 - 默认折叠 */}
        <CollapseSection title="品类" defaultExpanded={false}>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {categories.map((category) => (
              <FilterCheckbox
                key={category}
                checked={filters.categories.includes(category)}
                label={category}
                onClick={() => {
                  const newCategories = filters.categories.includes(category)
                    ? filters.categories.filter(c => c !== category)
                    : [...filters.categories, category];
                  onCategoryChange(newCategories);
                }}
              />
            ))}
          </div>
        </CollapseSection>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 160ms ease-out;
        }
      `}</style>
    </div>
  );
}
