import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import type { CrowdBasisCategory } from '../../types';

interface CrowdBasisTabsProps {
  categories: CrowdBasisCategory[];
  title?: string;
  subtitle?: string;
  foundryPath?: string;
}

function normalizeFoundryPath(foundryPath?: string) {
  if (!foundryPath) {
    return '/factory';
  }

  if (foundryPath.startsWith('/factory')) {
    return foundryPath;
  }

  return '/factory';
}

function track(event: string, payload: Record<string, unknown>) {
  const tracker = (
    window as typeof window & {
      __track?: (trackEvent: string, trackPayload?: Record<string, unknown>) => void;
    }
  ).__track;

  tracker?.(event, payload);
}

export function CrowdBasisTabs({
  categories,
  title = '圈人依据',
  subtitle = '按分类浏览规则依据，便于理解每类信号对人群圈选的贡献。',
  foundryPath,
}: CrowdBasisTabsProps) {
  const enabledCategories = useMemo(() => categories.filter((item) => item.enabled), [categories]);
  const [activeKey, setActiveKey] = useState(enabledCategories[0]?.key);

  useEffect(() => {
    if (!enabledCategories.length) {
      return;
    }

    if (!activeKey || !enabledCategories.some((item) => item.key === activeKey)) {
      setActiveKey(enabledCategories[0].key);
    }
  }, [activeKey, enabledCategories]);

  const activeCategory =
    enabledCategories.find((item) => item.key === activeKey) ?? enabledCategories[0];

  if (!activeCategory) {
    return (
      <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-1">{title}</h3>
            <p className="mt-2 text-sm text-text-2">{subtitle}</p>
          </div>
          <Badge tone="foundry">只读</Badge>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
          暂无可浏览的规则依据。
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text-1">{title}</h3>
            <Badge tone="foundry">只读</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-2">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="market">{enabledCategories.length} 类依据</Badge>
          <Link
            to={normalizeFoundryPath(foundryPath)}
            className="inline-flex items-center rounded-lg border border-module-workshop/20 bg-module-workshop/10 px-4 py-2 text-sm font-medium text-module-workshop transition hover:bg-module-workshop/15"
          >
            去工坊继续圈选
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const disabled = !category.enabled;
          const active = category.key === activeCategory.key;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                if (disabled) {
                  return;
                }

                setActiveKey(category.key);
                track('crowd_basis_tab_click', {
                  categoryKey: category.key,
                  foundryPath: normalizeFoundryPath(foundryPath),
                });
              }}
              disabled={disabled}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                disabled
                  ? 'cursor-not-allowed border border-border bg-slate-100 text-slate-400'
                  : active
                  ? 'bg-module-workshop text-white shadow-sm'
                  : 'border border-border bg-white text-text-2 hover:border-module-workshop/30 hover:text-module-workshop'
              }`}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-medium text-text-1">{activeCategory.label}</div>
          <div className="mt-2 text-sm leading-6 text-text-3">
            当前分类共 {activeCategory.items.length} 条依据，按贡献度从高到低浏览。
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {activeCategory.items
            .slice()
            .sort((left, right) => right.contribution - left.contribution)
            .map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-1">{item.label}</div>
                    <p className="mt-2 text-sm leading-6 text-text-2">{item.description}</p>
                  </div>
                  <Badge tone="market">{(item.contribution * 100).toFixed(0)}%</Badge>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-bg">
                    <div
                      className="h-2 rounded-full bg-module-workshop"
                      style={{ width: `${Math.max(8, Math.min(100, item.contribution * 100))}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-text-3">贡献度</div>
                </div>
              </article>
            ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-module-workshop/20 bg-module-workshop/5 px-4 py-3 text-sm text-module-workshop">
        🔒 本页只读；如需修改条件请点击规则卡顶部「去 Foundry 修改」
      </div>
    </section>
  );
}
