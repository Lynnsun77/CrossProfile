import type {
  DataSource,
  MarketplaceFilters,
  PublishedAfter,
  SubRange,
  Tier,
  Timeliness,
} from '../../../api/assets';

type StructuredSearchPanelProps = {
  open: boolean;
  draftQuery: string;
  filters: MarketplaceFilters;
  resultCount: number;
  onQueryChange: (value: string) => void;
  onFilterChange: (next: MarketplaceFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
};

type FilterGroupOption<T extends string> = { value: T; label: string };

function ChipGroup<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T | null;
  options: FilterGroupOption<T>[];
  onChange: (next: T | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-3">{title}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-full border px-3 py-1.5 text-sm"
          style={{
            borderColor: value == null ? 'var(--market-brand-border-soft)' : 'var(--color-border)',
            backgroundColor: value == null ? 'var(--market-brand-soft)' : 'white',
            color: value == null ? 'var(--market-brand)' : 'var(--color-text-2)',
          }}
        >
          全部
        </button>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active ? null : option.value)}
              aria-pressed={active}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: active ? 'var(--market-brand-border-soft)' : 'var(--color-border)',
                backgroundColor: active ? 'var(--market-brand-soft)' : 'white',
                color: active ? 'var(--market-brand)' : 'var(--color-text-2)',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StructuredSearchPanel({
  open,
  draftQuery,
  filters,
  resultCount,
  onQueryChange,
  onFilterChange,
  onApply,
  onReset,
  onClose,
}: StructuredSearchPanelProps) {
  if (!open) return null;

  return (
    <section
      className="rounded-2xl border p-4 md:p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--market-shadow-card)' }}
      aria-label="结构化搜索面板"
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-text-1">结构化搜索</div>
          <textarea
            value={draftQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            rows={3}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--market-brand-softer)' }}
            placeholder="例如：domain:cross tier:premium quality:>=80 timeliness:realtime 拉新客"
            aria-label="结构化搜索输入"
          />
          <div className="text-xs text-text-3">支持 `domain:`、`tier:`、`quality:`、`timeliness:` 与自由文本组合搜索。</div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChipGroup<Tier>
            title="Tier"
            value={filters.tier}
            onChange={(tier) => onFilterChange({ ...filters, tier })}
            options={[
              { value: 'common', label: 'common' },
              { value: 'premium', label: 'premium' },
              { value: 'longtail', label: 'longtail' },
            ]}
          />
          <ChipGroup<DataSource>
            title="数据源类型"
            value={filters.dataSource}
            onChange={(dataSource) => onFilterChange({ ...filters, dataSource })}
            options={[
              { value: 'btm_plus', label: 'BTM+' },
              { value: 'external', label: '外采' },
              { value: 'cross_domain', label: '跨域' },
              { value: 'private_end', label: '小端' },
            ]}
          />
          <ChipGroup<Timeliness>
            title="时效"
            value={filters.timeliness}
            onChange={(timeliness) => onFilterChange({ ...filters, timeliness })}
            options={[
              { value: 'realtime', label: '实时' },
              { value: 't1', label: 'T+1' },
              { value: 't7', label: 'T+7' },
            ]}
          />
          <ChipGroup<SubRange>
            title="订阅区间"
            value={filters.subRange}
            onChange={(subRange) => onFilterChange({ ...filters, subRange })}
            options={[
              { value: '0_30', label: '<30' },
              { value: '30_60', label: '30-60' },
              { value: '60_plus', label: '>=60' },
            ]}
          />
          <ChipGroup<PublishedAfter>
            title="上架时间"
            value={filters.publishedAfter}
            onChange={(publishedAfter) => onFilterChange({ ...filters, publishedAfter })}
            options={[
              { value: '7d', label: '近 7 天' },
              { value: '30d', label: '近 30 天' },
              { value: '90d', label: '近 90 天' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-sm text-text-2">
            当前命中 <span className="font-semibold text-text-1">{resultCount}</span> 条资产
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="h-10 rounded-xl border px-4 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-2)' }}
            >
              重置
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border px-4 text-sm font-medium"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-2)' }}
            >
              收起
            </button>
            <button
              type="button"
              onClick={onApply}
              className="h-10 rounded-xl px-4 text-sm font-medium text-white"
              style={{ background: 'var(--brand-gradient)' }}
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
