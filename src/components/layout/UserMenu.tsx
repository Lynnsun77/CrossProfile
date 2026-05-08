import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCachedMyBadges,
  getMyBadgesApi,
  invalidateMyBadgesCache,
  isMyBadgesCacheExpired,
  MY_BADGES_REFRESH_EVENT,
  type MyBadgeMap,
  type MyBadgeSource,
  type MyBadgeRole,
} from '../../api/my';
import {
  buildNavigationHref,
  getCommonUserMenuConfig,
  getConsumerSubRoleOptions,
  getNavigationViewLabel,
  getUserMenuConfig,
} from '../../lib/navigation';
import { buildLandingUrlForView } from '../../lib/view';
import { useGlobalState } from '../../store/globalState';
import type { AppView } from '../../types';

const SESSION_STORAGE_KEYS = ['cp_role_v2', 'cp_app_view', 'cp_user_role'] as const;

function formatBadgeValue(value: number) {
  return value >= 99 ? '99+' : String(value);
}

function Badge({
  value,
  style,
  severity,
}: {
  value: number;
  style: 'number' | 'dot-number' | 'number-new';
  severity?: 'warn';
}) {
  const display = formatBadgeValue(value);
  if (style === 'dot-number' && severity === 'warn') {
    return <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">{display}</span>;
  }
  if (style === 'number-new') {
    return <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">{display} new</span>;
  }
  return <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">{display}</span>;
}

export function UserMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const setCurrentView = useGlobalState((s) => s.setCurrentView);
  const currentUser = useGlobalState((s) => s.currentUser);
  const consumerSubRole = useGlobalState((s) => s.consumerSubRole);
  const setConsumerSubRole = useGlobalState((s) => s.setConsumerSubRole);

  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState<MyBadgeMap>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeView: MyBadgeRole = currentView === 'producer' ? 'producer' : 'consumer';
  const viewConfig = getUserMenuConfig(activeView);
  const commonConfig = getCommonUserMenuConfig();
  const subRoleOptions = getConsumerSubRoleOptions();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const node = rootRef.current;
      if (!node) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;

    const cached = getCachedMyBadges(activeView);
    if (cached) {
      setBadges(cached.badges);
    }

    void getMyBadgesApi(activeView, { force: isMyBadgesCacheExpired(activeView) }).then((result) => {
      setBadges(result.badges);
    });
  }, [activeView, open]);

  useEffect(() => {
    const onRefresh = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as { role?: MyBadgeRole } | undefined) : undefined;
      if (detail?.role && detail.role !== activeView) return;
      invalidateMyBadgesCache(detail?.role);
      if (!open) return;
      void getMyBadgesApi(activeView, { force: true }).then((result) => {
        setBadges(result.badges);
      });
    };

    window.addEventListener(MY_BADGES_REFRESH_EVENT, onRefresh as EventListener);
    return () => window.removeEventListener(MY_BADGES_REFRESH_EVENT, onRefresh as EventListener);
  }, [activeView, open]);

  const nextView = activeView === 'consumer' ? 'producer' : 'consumer';

  const handleNavigate = (path: string, query?: Record<string, string>) => {
    setOpen(false);
    navigate(buildNavigationHref(path, query));
  };

  const handleViewSwitch = (view: AppView) => {
    setCurrentView(view);
    setOpen(false);
    navigate(buildLandingUrlForView(view, location.search));
  };

  const handleLogout = () => {
    SESSION_STORAGE_KEYS.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore storage errors
      }
    });
    setOpen(false);
    setCurrentView('consumer');
    navigate('/marketplace?view=consumer', { replace: true });
  };

  const identityLine = useMemo(() => {
    if (activeView === 'consumer' && viewConfig?.identity.showSubRoleSwitcher) {
      return null;
    }
    return `${getNavigationViewLabel(activeView)}方 · ${currentUser.team}`;
  }, [activeView, currentUser.team, viewConfig?.identity.showSubRoleSwitcher]);

  if (!viewConfig) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-2 text-sm text-text-2 transition-colors hover:text-text-1"
        aria-label="打开头像菜单"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-base"
          aria-hidden="true"
        >
          🏄
        </span>
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`absolute right-0 top-[46px] w-72 rounded-2xl border border-border bg-white shadow-lg transition-all duration-200 ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
        }`}
      >
        <div className="p-3">
          <div className="border-b border-gray-100 px-2 pb-3">
            <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              {identityLine ? (
                identityLine
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={consumerSubRole}
                    onChange={(event) => setConsumerSubRole(event.target.value as 'business' | 'algorithm')}
                    className="rounded-md border border-border bg-white px-2 py-1 text-xs text-text-2"
                  >
                    {subRoleOptions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <span>· {currentUser.team}</span>
                </div>
              )}
            </div>
          </div>

          {viewConfig.groups.map((group) => (
            <div key={group.label} className="border-b border-gray-100 py-2 last:border-b-0">
              <div className="px-2 py-1 text-xs font-medium text-gray-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const badgeSource = item.badge?.source as MyBadgeSource | undefined;
                  const badgeValue = badgeSource ? badges[badgeSource] : 0;
                  const showBadge = typeof badgeValue === 'number' && badgeValue > 0;
                  return (
                    <button
                      key={`${group.label}-${item.label}`}
                      type="button"
                      onClick={() => {
                        if (item.path) handleNavigate(item.path, item.query);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-2 transition-colors hover:bg-gray-50 hover:text-text-1"
                    >
                      <span>{item.label}</span>
                      {showBadge && item.badge ? <Badge value={badgeValue as number} style={item.badge.style} severity={item.badge.severity} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {commonConfig.groups.map((group) => (
            <div key={group.label} className="py-2">
              <div className="px-2 py-1 text-xs font-medium text-gray-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const label =
                    item.action === 'toggleRole' ? `切换到${getNavigationViewLabel(nextView)}视角` : item.label ?? '未命名操作';
                  const className =
                    item.variant === 'danger'
                      ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                      : 'text-text-2 hover:bg-gray-50 hover:text-text-1';

                  return (
                    <button
                      key={`${group.label}-${label}`}
                      type="button"
                      onClick={() => {
                        if (item.action === 'toggleRole') {
                          handleViewSwitch(nextView);
                          return;
                        }
                        if (item.action === 'logout') {
                          handleLogout();
                          return;
                        }
                        if (item.path) {
                          handleNavigate(item.path, item.query);
                        }
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${className}`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
