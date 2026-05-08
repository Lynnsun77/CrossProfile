import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchResultItem, SearchType } from '../../api/search';
import { searchApi } from '../../api/search';

const TYPE_TABS: Array<{ key: SearchType; label: string }> = [
  { key: 'asset', label: '资产' },
  { key: 'scene', label: '场景' },
  { key: 'rule', label: '规则' },
  { key: 'task', label: '任务' },
  { key: 'user', label: '用户' },
];

function typeBadgeLabel(type: SearchType) {
  if (type === 'asset') return '资产';
  if (type === 'scene') return '场景';
  if (type === 'rule') return '规则';
  if (type === 'task') return '任务';
  return '用户';
}

export function GlobalSearch() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState<SearchType>('asset');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);

  const qTrimmed = q.trim();
  const canSearch = qTrimmed.length >= 2;

  const openModal = useCallback(() => {
    setOpen(true);
    // Focus after modal mount.
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQ('');
    setItems([]);
    setActiveIndex(-1);
    setLoading(false);
  }, []);

  const runNavigate = useCallback(
    (item: SearchResultItem) => {
    closeModal();
    navigate(item.to);
    },
    [closeModal, navigate]
  );

  // Cmd+K / Ctrl+K global open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      const isCombo = (e.metaKey || e.ctrlKey) && isK;
      if (isCombo) {
        e.preventDefault();
        if (!open) openModal();
        return;
      }

      if (open && e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeModal, open, openModal]);

  // Lock body scroll when modal open.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!canSearch) {
      setLoading(false);
      setItems([]);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    const mySeq = ++requestSeqRef.current;
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      searchApi({ q: qTrimmed, types: [activeType] })
        .then((res) => {
          if (requestSeqRef.current !== mySeq) return;
          setItems(res.items);
          setActiveIndex(res.items.length ? 0 : -1);
        })
        .catch(() => {
          if (requestSeqRef.current !== mySeq) return;
          setItems([]);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (requestSeqRef.current !== mySeq) return;
          setLoading(false);
        });
    }, 300);
  }, [open, qTrimmed, activeType, canSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const emptyStateText = useMemo(() => {
    if (!qTrimmed) return '输入关键词开始搜索';
    if (!canSearch) return '请输入至少 2 个字符';
    if (loading) return '搜索中…';
    if (!items.length) return '无匹配结果';
    return null;
  }, [qTrimmed, canSearch, loading, items.length]);

  const shortcutHint = useMemo(() => {
    const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    const isApple = /Mac|iPhone|iPad|iPod/i.test(platform);
    return isApple ? '⌘K' : 'Ctrl K';
  }, []);

  return (
    <>
      <div className="relative w-[320px]">
        <input
          readOnly
          value=""
          onClick={() => openModal()}
          placeholder="全局搜索（资产/场景/规则/任务/用户）"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-14 text-sm text-gray-700 placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          aria-label="全局搜索"
        />
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <kbd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
            {shortcutHint}
          </kbd>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="mx-auto mt-24 w-full max-w-[720px] px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="全局搜索"
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            >
              <div className="border-b border-border p-4">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      closeModal();
                      return;
                    }
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!items.length) return;
                      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!items.length) return;
                      setActiveIndex((i) => Math.max(i - 1, 0));
                      return;
                    }
                    if (e.key === 'Enter') {
                      if (activeIndex < 0 || activeIndex >= items.length) return;
                      e.preventDefault();
                      runNavigate(items[activeIndex]);
                    }
                  }}
                  placeholder="输入关键词（≥2 字符）"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  aria-label="搜索输入框"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {TYPE_TABS.map((tab) => {
                    const selected = tab.key === activeType;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActiveType(tab.key)}
                        className={[
                          'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                          selected
                            ? 'border border-border bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto p-2">
                {emptyStateText ? (
                  <div className="px-3 py-10 text-center text-sm text-gray-500">{emptyStateText}</div>
                ) : (
                  <ul role="listbox" aria-label="搜索结果" className="space-y-1">
                    {items.map((item, idx) => {
                      const active = idx === activeIndex;
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => runNavigate(item)}
                            className={[
                              'w-full rounded-xl px-3 py-2 text-left transition-colors',
                              active ? 'bg-blue-600 text-white' : 'hover:bg-gray-50',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{item.title}</div>
                                {item.subtitle ? (
                                  <div className={active ? 'truncate text-xs text-white/80' : 'truncate text-xs text-gray-500'}>
                                    {item.subtitle}
                                  </div>
                                ) : null}
                              </div>
                              <span
                                className={[
                                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                  active ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600',
                                ].join(' ')}
                              >
                                {typeBadgeLabel(item.type)}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border px-4 py-3 text-xs text-gray-500">
                ↑↓ 选择，Enter 跳转，Esc 关闭
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
