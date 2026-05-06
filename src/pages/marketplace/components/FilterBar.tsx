import type { MarketplaceTabParam, SortDir, SortKey } from '../../../api/assets';

type FilterBarProps = {
  panelOpen: boolean;
  selectedChips: Array<{ id: string; label: string }>;
  tab: MarketplaceTabParam;
  sortKey: SortKey;
  sortDir: SortDir;
  resultCount: number;
  onTogglePanel: () => void;
  onTabChange: (next: MarketplaceTabParam) => void;
  onSortChange: (nextKey: SortKey, nextDir: SortDir) => void;
  onClearChip: (chipId: string) => void;
  onResetAll: () => void;
};

const tabOptions: Array<{ key: MarketplaceTabParam; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'ranking', label: '应用排行' },
  { key: 'favorites', label: '我的收藏' },
];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'heat', label: '热度' },
  { key: 'quality', label: '质量' },
  { key: 'ab_revenue', label: 'AB收益' },
  { key: 'latest', label: '最新上架' },
  { key: 'subs', label: '订阅数' },
];

export function FilterBar({
  panelOpen,
  selectedChips,
  tab,
  sortKey,
  sortDir,
  resultCount,
  onTogglePanel,
  onTabChange,
  onSortChange,
  onClearChip,
  onResetAll,
}: FilterBarProps) {
  return (
    <section
      className="rounded-2xl border px-3 py-3 md:px-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--market-shadow-card)' }}
      aria-label="筛选栏"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            onClick={onTogglePanel}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium"
            aria-expanded={panelOpen}
            aria-controls="marketplace-structured-search-panel"
            style={{
              borderColor: panelOpen ? 'var(--market-brand-border-soft)' : 'var(--color-border)',
              backgroundColor: panelOpen ? 'var(--market-brand-soft)' : 'white',
              color: panelOpen ? 'var(--market-brand)' : 'var(--color-text-2)',
            }}
          >
            <span aria-hidden>{panelOpen ? '−' : '+'}</span>
            <span>筛选</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {selectedChips.length > 0 ? (
                selectedChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onClearChip(chip.id)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                    style={{ backgroundColor: 'var(--market-brand-soft)', color: 'var(--market-brand)' }}
                    aria-label={`移除筛选 ${chip.label}`}
                  >
                    <span>{chip.label}</span>
                    <span aria-hidden>×</span>
                  </button>
                ))
              ) : (
                <span className="text-sm text-text-3">未选择筛选条件</span>
              )}
              {selectedChips.length > 0 ? (
                <button type="button" onClick={onResetAll} className="text-xs text-text-3 underline-offset-2 hover:underline">
                  重置全部
                </button>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-text-3">当前结果 {resultCount} 条</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: 'var(--market-brand-softer)' }} role="tablist" aria-label="资产子视图">
            {tabOptions.map((option) => {
              const active = option.key === tab;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(option.key)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
                  style={
                    active
                      ? { backgroundColor: 'white', color: 'var(--market-brand)', boxShadow: 'var(--market-shadow-card)' }
                      : { color: 'var(--color-text-2)' }
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-text-3">排序</span>
            <select
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [nextKey, nextDir] = e.target.value.split(':') as [SortKey, SortDir];
                onSortChange(nextKey, nextDir);
              }}
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              aria-label="排序方式"
            >
              {sortOptions.map((option) => (
                <option key={`${option.key}:desc`} value={`${option.key}:desc`}>
                  {option.label} 降序
                </option>
              ))}
              {sortOptions.map((option) => (
                <option key={`${option.key}:asc`} value={`${option.key}:asc`}>
                  {option.label} 升序
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
