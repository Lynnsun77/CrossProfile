import type { AppView, ViewOption, ViewSwitcherProps } from '../../types';

function labelOfView(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

function buttonSize(size: ViewSwitcherProps['size']) {
  return size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm';
}

function buttonState(option: ViewOption, selected: boolean) {
  if (option.disabled) {
    return 'cursor-not-allowed border-border bg-bg text-text-3';
  }
  if (selected) {
    return 'border-transparent bg-gray-900 text-white shadow-sm';
  }
  return 'border-border bg-white text-text-2 hover:border-gray-300 hover:text-text-1';
}

export function ViewSwitcher({ current_view, available_views, on_switch, size = 'md' }: ViewSwitcherProps) {
  const normalizedCurrentView = current_view === 'consumer' ? 'consumer' : 'producer';

  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-text-3">View Switcher</div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="视角切换">
        {available_views.map((option) => {
          const selected = option.view === normalizedCurrentView;
          const title = option.disabledReason || option.description || labelOfView(option.view);
          return (
            <button
              key={option.view}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-disabled={option.disabled || undefined}
              disabled={option.disabled}
              title={title}
              onClick={() => {
                if (!option.disabled) on_switch(option.view);
              }}
              className={[
                'rounded-xl border font-medium transition-colors',
                buttonSize(size),
                buttonState(option, selected),
              ].join(' ')}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
