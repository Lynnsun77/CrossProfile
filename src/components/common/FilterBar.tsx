import { useState, useRef, useEffect, useMemo } from 'react';
import { Settings2, X, SlidersHorizontal } from 'lucide-react';
import type { AssetType, Domain, HealthDotLevel, LifeCycle } from '../../types';

export interface MarketFilters {
  assetTypes: AssetType[];
  domains: Domain[];
  lifeCycles: LifeCycle[];
  healthLevels: HealthDotLevel[];
  categories: string[];
}

interface FilterBarProps {
  filters: MarketFilters;
  categories: string[];
  activeTab: 'assets' | 'ranking';
  sortBy: 'revenue' | 'heat' | 'latest';
  onTabChange: (tab: 'assets' | 'ranking') => void;
  onSortChange: (sort: 'revenue' | 'heat' | 'latest') => void;
  onResetDomains?: () => void;
  onToggleAssetType: (value: AssetType) => void;
  onToggleDomain: (value: Domain) => void;
  onToggleLifeCycle: (value: LifeCycle) => void;
  onToggleHealth: (value: HealthDotLevel) => void;
  onCategoryChange: (value: string[]) => void;
  onClearAll: () => void;
}

// 选项配置
const assetTypeOptions: { value: AssetType; label: string }[] = [
  { value: 'tag', label: '标签' },
  { value: 'crowd_template', label: '人群模板' },
  { value: 'feature_pack', label: '特征包' },
  { value: 'model', label: '模型' },
];

const domainOptions: { value: Domain; label: string }[] = [
  { value: 'ecommerce', label: '电商' },
  { value: 'lifestyle', label: '生服' },
  { value: 'cross', label: '跨域' },
];

const lifeCycleOptions: { value: LifeCycle; label: string }[] = [
  { value: 'new', label: '新上架' },
  { value: 'active', label: '活跃' },
  { value: 'hot', label: '热门' },
  { value: 'deprecated', label: '待下线' },
];

const healthLevelOptions: { value: HealthDotLevel; label: string }[] = [
  { value: 'green', label: '高' },
  { value: 'yellow', label: '中' },
  { value: 'red', label: '低' },
];

// 获取选项标签
function getOptionLabel(type: string, value: string): string {
  switch (type) {
    case 'assetType':
      return assetTypeOptions.find((o) => o.value === value)?.label || value;
    case 'domain':
      return domainOptions.find((o) => o.value === value)?.label || value;
    case 'lifeCycle':
      return lifeCycleOptions.find((o) => o.value === value)?.label || value;
    case 'healthLevel':
      return healthLevelOptions.find((o) => o.value === value)?.label || value;
    case 'category':
      return value;
    default:
      return value;
  }
}

// 筛选 Chip 组件
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="filter-chip inline-flex items-center gap-1 h-6 px-2 rounded-md bg-violet-50 text-violet-600 text-xs flex-shrink-0">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="filter-chip__close inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-violet-100 transition-colors"
        aria-label={`移除 ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// 筛选选项 Pill 组件
function FilterOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-option inline-flex items-center gap-1 h-7 px-3 rounded-full text-sm transition-all duration-160 ${
        checked
          ? 'filter-option--checked bg-violet-50 border-violet-500 text-violet-600 font-medium'
          : 'border-gray-200 text-gray-600 hover:border-violet-500 hover:text-violet-600'
      }`}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && <span className="text-xs">✓</span>}
      <span>{label}</span>
    </button>
  );
}

// 筛选分组组件
function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="filter-group">
      <h4 className="filter-group__title text-xs font-semibold text-gray-500 mb-2 tracking-wide">
        {title}
      </h4>
      <div className="filter-group__options flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// 移动端 Drawer 组件
function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  categories,
  selectedChips,
  selectedCount,
  onToggleAssetType,
  onToggleDomain,
  onToggleLifeCycle,
  onToggleHealth,
  onCategoryChange,
  onClearAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: MarketFilters;
  categories: string[];
  selectedChips: { id: string; label: string; onRemove: () => void }[];
  selectedCount: number;
  onToggleAssetType: (value: AssetType) => void;
  onToggleDomain: (value: Domain) => void;
  onToggleLifeCycle: (value: LifeCycle) => void;
  onToggleHealth: (value: HealthDotLevel) => void;
  onCategoryChange: (value: string[]) => void;
  onClearAll: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // ESC 键关闭
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer 面板 */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[360px] bg-white shadow-2xl transform transition-transform duration-300 ease-out animate-slideInRight"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">筛选</span>
            {selectedCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium">
                {selectedCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 已选 chips 区 */}
        {selectedChips.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedChips.map((chip) => (
                <FilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </div>
          </div>
        )}

        {/* 筛选内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {/* 资产类型 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">资产类型</h4>
            <div className="flex flex-wrap gap-2">
              {assetTypeOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.assetTypes.includes(option.value)}
                  onClick={() => onToggleAssetType(option.value)}
                />
              ))}
            </div>
          </div>

          {/* 业务域 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">业务域</h4>
            <div className="flex flex-wrap gap-2">
              {domainOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.domains.includes(option.value)}
                  onClick={() => onToggleDomain(option.value)}
                />
              ))}
            </div>
          </div>

          {/* 生命周期 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">生命周期</h4>
            <div className="flex flex-wrap gap-2">
              {lifeCycleOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.lifeCycles.includes(option.value)}
                  onClick={() => onToggleLifeCycle(option.value)}
                />
              ))}
            </div>
          </div>

          {/* 健康度 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">健康度</h4>
            <div className="flex flex-wrap gap-2">
              {healthLevelOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.healthLevels.includes(option.value)}
                  onClick={() => onToggleHealth(option.value)}
                />
              ))}
            </div>
          </div>

          {/* 品类 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">品类</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterOption
                  key={category}
                  label={category}
                  checked={filters.categories.includes(category)}
                  onClick={() => {
                    const newCategories = filters.categories.includes(category)
                      ? filters.categories.filter((c) => c !== category)
                      : [...filters.categories, category];
                    onCategoryChange(newCategories);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClearAll}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              完成
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export function FilterBar({
  filters,
  categories,
  activeTab,
  sortBy,
  onTabChange,
  onSortChange,
  onToggleAssetType,
  onToggleDomain,
  onToggleLifeCycle,
  onToggleHealth,
  onCategoryChange,
  onClearAll,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 计算已选项数量
  const selectedCount = useMemo(() => {
    return (
      filters.assetTypes.length +
      filters.domains.length +
      filters.lifeCycles.length +
      filters.healthLevels.length +
      filters.categories.length
    );
  }, [filters]);

  // 生成已选 chips 列表
  const selectedChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    filters.assetTypes.forEach((value) => {
      chips.push({
        id: `assetType-${value}`,
        label: getOptionLabel('assetType', value),
        onRemove: () => onToggleAssetType(value),
      });
    });

    filters.domains.forEach((value) => {
      chips.push({
        id: `domain-${value}`,
        label: getOptionLabel('domain', value),
        onRemove: () => onToggleDomain(value),
      });
    });

    filters.lifeCycles.forEach((value) => {
      chips.push({
        id: `lifeCycle-${value}`,
        label: getOptionLabel('lifeCycle', value),
        onRemove: () => onToggleLifeCycle(value),
      });
    });

    filters.healthLevels.forEach((value) => {
      chips.push({
        id: `healthLevel-${value}`,
        label: getOptionLabel('healthLevel', value),
        onRemove: () => onToggleHealth(value),
      });
    });

    filters.categories.forEach((value) => {
      chips.push({
        id: `category-${value}`,
        label: getOptionLabel('category', value),
        onRemove: () => onCategoryChange(filters.categories.filter((c) => c !== value)),
      });
    });

    return chips;
  }, [filters, onToggleAssetType, onToggleDomain, onToggleLifeCycle, onToggleHealth, onCategoryChange]);

  // 点击外部关闭面板（桌面端）
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 键关闭面板（桌面端）
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 显示的品类（默认显示前 6 个）
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 6);
  const hasMoreCategories = categories.length > 6;

  return (
    <div className="filter-bar-wrapper">
      {/* 筛选条 - 收起态 */}
      <div className="filter-bar flex items-center justify-between gap-2 sm:gap-3 h-auto sm:h-12 px-3 sm:px-4 py-2 sm:py-0 bg-white border border-gray-200 rounded-xl mb-4">
        {/* 左区：齿轮按钮 + 已选 chips */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* 齿轮按钮 - 桌面端显示文字，移动端只显示 icon */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              // 检测是否为移动端
              if (window.innerWidth < 768) {
                setIsMobileOpen(true);
              } else {
                setIsOpen(!isOpen);
              }
            }}
            className={`filter-bar__trigger inline-flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-lg text-sm transition-all duration-160 flex-shrink-0 ${
              isOpen || isMobileOpen
                ? 'filter-bar__trigger--active bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent'
                : selectedCount > 0
                  ? 'filter-bar__trigger--has-selected border-violet-300 text-violet-600 bg-violet-50'
                  : 'border-gray-200 text-gray-600 hover:border-violet-500 hover:text-violet-600 hover:bg-violet-50'
            }`}
            aria-expanded={isOpen || isMobileOpen}
            aria-controls="filter-panel"
            role="button"
          >
            <Settings2 className={`w-4 h-4 transition-transform duration-240 ${isOpen ? 'rotate-90' : ''}`} />
            <span className="hidden sm:inline">筛选</span>
            {selectedCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                {selectedCount}
              </span>
            )}
          </button>

          {/* 已选 chips 区 - 移动端简化显示 */}
          <div className="filter-bar__selected flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            {selectedChips.length > 0 && (
              <>
                {/* 桌面端显示多个 chips */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {selectedChips.slice(0, 3).map((chip) => (
                    <FilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
                  ))}
                  {selectedChips.length > 3 && (
                    <span className="text-xs text-gray-500 flex-shrink-0">+{selectedChips.length - 3}</span>
                  )}
                </div>
                {/* 移动端只显示数量 */}
                <span className="sm:hidden text-sm text-violet-600 font-medium">
                  已选 {selectedCount} 项
                </span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="filter-bar__clear-all text-xs text-gray-400 hover:text-rose-500 transition-colors flex-shrink-0 ml-1"
                >
                  清空
                </button>
              </>
            )}
          </div>
        </div>

        {/* 右区：Tab + 排序 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Tab 切换 */}
          <div className="inline-flex gap-0.5 sm:gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:p-1">
            <button
              type="button"
              onClick={() => onTabChange('assets')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">全域资产</span>
              <span className="sm:hidden">资产</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('ranking')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'ranking'
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">应用排行</span>
              <span className="sm:hidden">排行</span>
            </button>
          </div>

          {/* 排序下拉 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden lg:inline">排序</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'revenue' | 'heat' | 'latest')}
              className="h-8 px-2 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 outline-none focus:border-violet-500 transition-colors"
            >
              <option value="revenue">历史收益</option>
              <option value="heat">消费热度</option>
              <option value="latest">最新上架</option>
            </select>
          </div>
        </div>
      </div>

      {/* 桌面端展开态：筛选面板 */}
      <div
        ref={panelRef}
        id="filter-panel"
        className={`filter-panel hidden md:block overflow-hidden transition-all duration-280 ease-out ${
          isOpen ? 'filter-panel--open max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-label="筛选面板"
      >
        <div className="filter-panel__inner bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          {/* 筛选分组网格 */}
          <div className="filter-panel__groups grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
            {/* 资产类型 */}
            <FilterGroup title="资产类型">
              {assetTypeOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.assetTypes.includes(option.value)}
                  onClick={() => onToggleAssetType(option.value)}
                />
              ))}
            </FilterGroup>

            {/* 业务域 */}
            <FilterGroup title="业务域">
              {domainOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.domains.includes(option.value)}
                  onClick={() => onToggleDomain(option.value)}
                />
              ))}
            </FilterGroup>

            {/* 生命周期 */}
            <FilterGroup title="生命周期">
              {lifeCycleOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.lifeCycles.includes(option.value)}
                  onClick={() => onToggleLifeCycle(option.value)}
                />
              ))}
            </FilterGroup>

            {/* 健康度 */}
            <FilterGroup title="健康度">
              {healthLevelOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  label={option.label}
                  checked={filters.healthLevels.includes(option.value)}
                  onClick={() => onToggleHealth(option.value)}
                />
              ))}
            </FilterGroup>

            {/* 品类 */}
            <FilterGroup title="品类">
              {displayedCategories.map((category) => (
                <FilterOption
                  key={category}
                  label={category}
                  checked={filters.categories.includes(category)}
                  onClick={() => {
                    const newCategories = filters.categories.includes(category)
                      ? filters.categories.filter((c) => c !== category)
                      : [...filters.categories, category];
                    onCategoryChange(newCategories);
                  }}
                />
              ))}
              {hasMoreCategories && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  {showAllCategories ? '收起' : `展开更多 (+${categories.length - 6})`}
                </button>
              )}
            </FilterGroup>
          </div>

          {/* 面板底部操作区 */}
          <div className="filter-panel__footer flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClearAll}
              className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {/* 移动端 Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        filters={filters}
        categories={categories}
        selectedChips={selectedChips}
        selectedCount={selectedCount}
        onToggleAssetType={onToggleAssetType}
        onToggleDomain={onToggleDomain}
        onToggleLifeCycle={onToggleLifeCycle}
        onToggleHealth={onToggleHealth}
        onCategoryChange={onCategoryChange}
        onClearAll={onClearAll}
      />
    </div>
  );
}
